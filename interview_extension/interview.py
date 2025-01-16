import asyncio
import base64
import json
import signal
import sys
from datetime import time
from typing import Literal, TypedDict
import pyaudio
import requests
import os
from dotenv import load_dotenv
from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import ConnectionClosedOK
import websockets

load_dotenv()
GLADIA_API_URL = "https://api.gladia.io"


class InitiateResponse(TypedDict):
    id: str
    url: str


class LanguageConfiguration(TypedDict):
    languages: list[str] | None
    code_switching: bool | None


class StreamingConfiguration(TypedDict):
    encoding: Literal["wav/pcm", "wav/alaw", "wav/ulaw"]
    bit_depth: Literal[8, 16, 24, 32]
    sample_rate: Literal[8_000, 16_000, 32_000, 44_100, 48_000]
    channels: int
    language_config: LanguageConfiguration | None


def init_live_session(config: StreamingConfiguration) -> InitiateResponse:
    gladia_key = os.getenv("GLADIA_API_KEY")

    response = requests.post(
        f"{GLADIA_API_URL}/v2/live",
        headers={"X-Gladia-Key": gladia_key},
        json=config,
        timeout=3,
    )

    if not response.ok:
        print(f"{response.status_code}: {response.text or response.reason}")
        exit(response.status_code)
    return response.json()


full_recording = ""

def send_to_llm(text: str, is_final: bool = False) -> str:
    system_prompt = """You are an expert interview assistant that provides immediate, ready-to-use answers for job interviews.
    For each interview question, provide a complete, professional response that the interviewer can use directly.
    Structure your answers to:
    1. Start with a strong opening statement
    2. Include relevant experience and concrete examples
    3. Demonstrate technical knowledge where appropriate
    4. End with a confident conclusion
    
    Format the answer as if speaking directly to the interviewer. Make it natural and conversational, yet professional.
    If you hear something that's not a question, interpret the context and provide relevant talking points or follow-up responses.
    
    Remember: The user will be using your response verbatim in their interview, so make it sound natural when spoken."""

    if is_final:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"""Review this interview conversation and provide:
1. A collection of polished, ready-to-use answers for the key questions discussed
2. Additional variations of these answers to handle similar questions
3. Important technical points and examples mentioned that could be reused
4. Strong closing statements and follow-up responses

Make all responses natural and ready for immediate use in future interviews:\n{text}"""}
        ]
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Provide a professional interview answer for this question/topic:\n{text}"}
        ]

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "temperature": 0.7
        }
    )
    return response.json()['choices'][0]['message']['content']

async def process_messages(socket: ClientConnection, extension_socket: websockets.WebSocketServerProtocol) -> None:
    global full_recording

    async for message in socket:
        content = json.loads(message)
        if content["type"] == "transcript" and content["data"]["is_final"]:
            text = content["data"]["utterance"]["text"].strip()
            full_recording += text + " "
            
            # Get suggested answer
            suggested_answer = send_to_llm(text)
            
            # Send response to extension
            response = {
                "question": text,
                "answer": suggested_answer
            }
            await extension_socket.send(json.dumps(response))
        
        if content["type"] == "post_final_transcript":
            await extension_socket.send(json.dumps({"type": "session_complete"}))

async def stop_recording(websocket: ClientConnection) -> None:
    await websocket.send(json.dumps({"type": "stop_recording"}))
    await asyncio.sleep(0)

P = pyaudio.PyAudio()

CHANNELS = 1
FORMAT = pyaudio.paInt16
FRAMES_PER_BUFFER = 3200
SAMPLE_RATE = 16_000

STREAMING_CONFIGURATION: StreamingConfiguration = {
    "encoding": "wav/pcm",
    "sample_rate": SAMPLE_RATE,
    "bit_depth": 16,
    "channels": CHANNELS,
    "language_config": {
        "languages": ["en"],
        "code_switching": True,
    }
}

async def send_audio(socket: ClientConnection) -> None:
    stream = P.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=FRAMES_PER_BUFFER,
    )

    while True:
        data = stream.read(FRAMES_PER_BUFFER)
        data = base64.b64encode(data).decode("utf-8")
        json_data = json.dumps({"type": "audio_chunk", "data": {"chunk": str(data)}})
        try:
            await socket.send(json_data)
            await asyncio.sleep(0.1)  # Send audio every 100ms
        except ConnectionClosedOK:
            return

async def handle_extension_connection(websocket):
    global full_recording
    full_recording = ""

    response = init_live_session(STREAMING_CONFIGURATION)
    async with connect(response["url"]) as gladia_socket:
        send_audio_task = asyncio.create_task(send_audio(gladia_socket))
        process_messages_task = asyncio.create_task(process_messages(gladia_socket, websocket))

        try:
            async for message in websocket:
                if message == "stop":
                    await stop_recording(gladia_socket)
                    break
        finally:
            send_audio_task.cancel()
            process_messages_task.cancel()
            await asyncio.gather(send_audio_task, process_messages_task, return_exceptions=True)

        # Send final summary
        final_summary = send_to_llm(full_recording, is_final=True)
        await websocket.send(json.dumps({"type": "final_summary", "summary": final_summary}))

async def main():
    server = await websockets.serve(handle_extension_connection, "localhost", 8765)
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
