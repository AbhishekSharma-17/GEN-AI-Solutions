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
    import os, dotenv
    from dotenv import load_dotenv

    load_dotenv()

    gladia_key = os.getenv("GLADIA_API_KEY")

    # gladia_key = get_gladia_key()
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


def format_duration(seconds: float) -> str:
    milliseconds = int(seconds * 1_000)
    return time(
        hour=milliseconds // 3_600_000,
        minute=(milliseconds // 60_000) % 60,
        second=(milliseconds // 1_000) % 60,
        microsecond=milliseconds % 1_000 * 1_000,
    ).isoformat(timespec="milliseconds")


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

async def print_messages_from_socket(socket: ClientConnection) -> None:
    global full_recording

    async for message in socket:
        content = json.loads(message)
        if content["type"] == "transcript" and content["data"]["is_final"]:
            text = content["data"]["utterance"]["text"].strip()
            print("\n📝 Interview Question/Topic:", flush=True)
            print("-" * 50)
            print(text)
            print("-" * 50)
            full_recording += text + " "
            
            # Get suggested answer
            print("\n💡 Suggested Response:", flush=True)
            print("-" * 50)
            suggested_answer = send_to_llm(text)
            print(suggested_answer)
            print("-" * 50 + "\n")
        
        if content["type"] == "post_final_transcript":
            print("\n################ Interview Session Complete ################\n")

def print_full_recording():
    print("\n################ Interview Session Recording ################\n")
    print(full_recording.strip())
    print("\n################ End of Recording ################\n")
    
    # Get key talking points and strong answers for future use
    final_summary = send_to_llm(full_recording, is_final=True)
    print("\n################ Key Interview Points & Sample Answers ################\n")
    print(final_summary)
    print("\n################ End of Interview Summary ################\n")


async def stop_recording(websocket: ClientConnection) -> None:
    print("\n\n>>>>> Ending the recording…")
    await websocket.send(json.dumps({"type": "stop_recording"}))
    await asyncio.sleep(0)


## Sample code
P = pyaudio.PyAudio()

CHANNELS = 1
FORMAT = pyaudio.paInt16
FRAMES_PER_BUFFER = 3200
SAMPLE_RATE = 16_000

STREAMING_CONFIGURATION: StreamingConfiguration = {
    "encoding": "wav/pcm",
    "sample_rate": SAMPLE_RATE,
    "bit_depth": 16,  # It should match the FORMAT value
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


async def main():
    response = init_live_session(STREAMING_CONFIGURATION)
    async with connect(response["url"]) as websocket:
        print("\n################ Begin session ################\n")
        print("Press Enter to stop the recording.")

        send_audio_task = asyncio.create_task(send_audio(websocket))
        print_messages_task = asyncio.create_task(print_messages_from_socket(websocket))

        # Wait for user to press Enter
        await asyncio.get_event_loop().run_in_executor(None, input)

        await stop_recording(websocket)

        send_audio_task.cancel()
        print_messages_task.cancel()
        await asyncio.gather(
            send_audio_task, print_messages_task, return_exceptions=True
        )

        print_full_recording()


if __name__ == "__main__":
    asyncio.run(main())
