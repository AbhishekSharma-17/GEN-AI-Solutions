import asyncio
import base64
import json
import signal
import sys
from datetime import time
from typing import Literal, TypedDict
import pyaudio
import requests
from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import ConnectionClosedOK

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


async def print_messages_from_socket(socket: ClientConnection) -> None:
    global full_recording

    async for message in socket:
        content = json.loads(message)
        if content["type"] == "transcript" and content["data"]["is_final"]:
            text = content["data"]["utterance"]["text"].strip()
            print(text, end=" ", flush=True)
            full_recording += text + " "
        if content["type"] == "post_final_transcript":
            print("\n\n################ End of session ################\n")


def print_full_recording():
    print("\n################ Full Recording ################\n")
    print(full_recording.strip())
    print("\n################ End of Full Recording ################\n")


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
        "languages": [],
        "code_switching": True,
    },
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