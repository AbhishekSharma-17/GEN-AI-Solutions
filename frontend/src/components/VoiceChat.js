import React, { useState, useEffect, useRef } from 'react';

const VoiceChat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [transcriptionTime, setTranscriptionTime] = useState(null);
  const [aiResponseTime, setAiResponseTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);
  const audioRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const ttsAudioChunksRef = useRef([]);

  useEffect(() => {
    websocketRef.current = new WebSocket('ws://localhost:8000/ws');
    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTranscription(data.transcription);
      setAiResponse(data.ai_response);
      setTranscriptionTime(data.transcription_time);
      setAiResponseTime(data.ai_response_time);

      // After receiving the AI response, send it to the TTS API
      fetchTTS(data.ai_response);
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const appendNextChunk = () => {
    if (ttsAudioChunksRef.current.length && sourceBufferRef.current && !sourceBufferRef.current.updating) {
      const chunk = ttsAudioChunksRef.current.shift();
      sourceBufferRef.current.appendBuffer(chunk);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        websocketRef.current.send(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fetchTTS = async (text) => {
    setIsPlaying(false);
    setIsLoading(true);
    ttsAudioChunksRef.current = [];

    try {
      const response = await fetch(`http://localhost:8000/tts?text=${encodeURIComponent(text)}&voice=Lyla`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      audioRef.current.src = URL.createObjectURL(mediaSource);

      mediaSource.addEventListener('sourceopen', async () => {
        sourceBufferRef.current = mediaSource.addSourceBuffer('audio/mpeg');
        sourceBufferRef.current.mode = 'sequence';
        sourceBufferRef.current.addEventListener('updateend', appendNextChunk);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            ttsAudioChunksRef.current.push(value);
            if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
              appendNextChunk();
            }

            if (!isPlaying && audioRef.current.readyState >= 2) {
              setIsPlaying(true);
              setIsLoading(false);
            }
          }
          mediaSource.endOfStream();
        } catch (error) {
          console.error('Error while streaming:', error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching TTS:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Voice Chat</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      {transcription && (
        <div>
          <h2>Transcription:</h2>
          <p>{transcription}</p>
          <p>Transcription Time: {transcriptionTime} seconds</p>
        </div>
      )}
      {aiResponse && (
        <div>
          <h2>AI Response:</h2>
          <p>{aiResponse}</p>
          <p>AI Response Time: {aiResponseTime} seconds</p>
        </div>
      )}
      <div>
        <h2>TTS Audio:</h2>
        <audio ref={audioRef} controls>
          Your browser does not support the audio element.
        </audio>
        <button onClick={() => setIsPlaying(!isPlaying)} disabled={isLoading}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};

export default VoiceChat;
