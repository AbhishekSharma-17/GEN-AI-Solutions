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
import nltk
from nltk.tokenize import sent_tokenize

load_dotenv()
GLADIA_API_URL = "https://api.gladia.io"

# Download necessary NLTK data
nltk.download('punkt', quiet=True)


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
    system_prompt = """You are an AI assistant helping with job interviews. Provide reasonably detailed answers to interview questions as if you are the interviewee. Structure your responses using Markdown formatting, including bullet points, headers, and emphasis where appropriate. Keep responses professional and informative. If you hear a statement instead of a question, respond appropriately in context."""

    if is_final:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"""Analyze this interview conversation and provide in Markdown format:

# Key Points Discussed
[List key points in bullet points]

# Suggested Questions for the Interviewer
[List suggested questions in bullet points]

# Thank You Note
[A brief thank you note]

Keep the response informative and ready for immediate use:\n{text}"""}
        ]
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Provide a professional interview answer for this question/topic, using Markdown formatting with appropriate headers, bullet points, and emphasis:\n{text}"}
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

def is_question_complete(text: str) -> bool:
    # Use NLTK to tokenize sentences
    sentences = sent_tokenize(text)
    if not sentences:
        return False
    
    last_sentence = sentences[-1].strip()
    
    # Check if the last sentence ends with a question mark or period
    if last_sentence.endswith(('?', '.')):
        return True
    
    # Check for common question starters
    question_starters = ['what', 'when', 'where', 'who', 'why', 'how', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'did']
    if any(last_sentence.lower().startswith(starter) for starter in question_starters):
        return True
    
    # If the sentence is longer than 10 words, consider it complete
    if len(last_sentence.split()) > 10:
        return True
    
    return False

async def process_messages(socket: ClientConnection, extension_socket: websockets.WebSocketServerProtocol) -> None:
    global full_recording
    current_question = ""
    silence_counter = 0
    max_silence = 3  # Maximum number of silent chunks before considering the question complete

    async for message in socket:
        content = json.loads(message)
        if content["type"] == "transcript":
            text = content["data"]["utterance"]["text"].strip()
            if text:
                full_recording += text + " "
                current_question += text + " "
                silence_counter = 0
            else:
                silence_counter += 1

            if content["data"]["is_final"] or (silence_counter >= max_silence and current_question.strip()):
                if is_question_complete(current_question):
                    # Get suggested answer
                    suggested_answer = send_to_llm(current_question.strip())
                    
                    # Send response to extension
                    response = {
                        "question": current_question.strip(),
                        "answer": suggested_answer
                    }
                    await extension_socket.send(json.dumps(response))
                    current_question = ""  # Reset for the next question
                    silence_counter = 0
            
        if content["type"] == "post_final_transcript":
            # If there's any remaining partial question, process it
            if current_question.strip():
                suggested_answer = send_to_llm(current_question.strip())
                response = {
                    "question": current_question.strip(),
                    "answer": suggested_answer
                }
                await extension_socket.send(json.dumps(response))
            
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
