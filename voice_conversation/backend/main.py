import os
import time
from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
from langchain_openai import  ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from speech_tts import client, template
import tempfile

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow only our React app
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

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
            start_time = time.time()
            with client.audio.speech.with_streaming_response.create(
                model="tts-1",
                voice=mapped_voice,
                input=text,
            ) as response:
                for chunk in response.iter_bytes():
                    yield chunk
            end_time = time.time()
            print(f"TTS response time: {end_time - start_time:.2f} seconds")
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
                start_time = time.time()
                # Use the temporary file for transcription
                with open(temp_audio_file_path, "rb") as audio_file:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file
                    )

                text = transcription.text
                transcription_time = time.time() - start_time
                print(f"Transcribed text: {text}")
                print(f"Transcription time: {transcription_time:.2f} seconds")

                # Process the transcribed text with OpenAI
                ai_start_time = time.time()
                chat = ChatOpenAI(model="gpt-4o")
                messages = [
                    SystemMessage(content=template),
                    HumanMessage(content=text)
                ]
                ai_response = chat.invoke(messages)
                response_text = ai_response.content
                
                ai_response_time = time.time() - ai_start_time
                print(f"AI response: {response_text}")
                print(f"AI response time: {ai_response_time:.2f} seconds")

                # Send both transcription and AI response to the client
                await websocket.send_json({
                    "transcription": text,
                    "ai_response": response_text,
                    "transcription_time": round(transcription_time, 2),
                    "ai_response_time": round(ai_response_time, 2)
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
