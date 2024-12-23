import os
from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse
import uvicorn
from openai import OpenAI
from speech_tts import client, template
import tempfile

app = FastAPI()

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get():
    with open("static/index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/tts")
def text_to_speech(
    text: str = Query(..., description="Text to convert to speech"),
    voice: str = Query(..., description="Voice to use for TTS"),
):
    # Voice mapping dictionary
    voice_mapping = {
        "Castiel": "echo",
        "Harry": "alloy",
        "Lyla": "shimmer",
        "Selena": "nova",
        "Abhishek": "onyx",
        "Hiten": "fable",
    }

    # Map the provided voice to its corresponding key
    mapped_voice = voice_mapping.get(voice.capitalize(), voice)

    if not text:
        raise HTTPException(
            status_code=400, detail="Text to convert to speech is required"
        )

    def generate():
        try:
            with client.audio.speech.with_streaming_response.create(
                model="tts-1",
                voice=mapped_voice,
                input=text,
            ) as response:
                for chunk in response.iter_bytes():
                    yield chunk
        except Exception as e:
            print(f"Error in text_to_speech: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    return StreamingResponse(generate(), media_type="audio/mpeg")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive audio data from the client
            audio_data = await websocket.receive_bytes()
            
            # Save audio to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio_file:
                temp_audio_file.write(audio_data)
                temp_audio_file_path = temp_audio_file.name

            try:
                # Use the temporary file for transcription
                with open(temp_audio_file_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file
                    )

                text = transcription.text
                print(f"Transcribed text: {text}")

                # Process the transcribed text with OpenAI
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": template},
                        {"role": "user", "content": text}
                    ]
                )
                response_text = response.choices[0].message.content
                print(f"AI response: {response_text}")

                # Send both transcription and AI response to the client
                await websocket.send_json({
                    "transcription": text,
                    "ai_response": response_text
                })

            except Exception as e:
                print(f"Error processing audio: {str(e)}")
                await websocket.send_text(f"Error: {str(e)}")
            finally:
                # Remove the temporary file
                os.remove(temp_audio_file_path)

    except Exception as e:
        print(f"WebSocket error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)