import React, { useState, useEffect, useRef } from 'react';

const VoiceChat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);
  const audioRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const ttsAudioChunksRef = useRef([]);
  const chatboxRef = useRef(null);

  useEffect(() => {
    websocketRef.current = new WebSocket('ws://localhost:8000/ws');
    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setConversation(prev => [
        ...prev,
        { type: 'user', text: data.transcription, time: data.transcription_time },
        { type: 'ai', text: data.ai_response, time: data.ai_response_time }
      ]);

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
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [conversation]);

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
    <div className="voice-chat-container">
      <h1>Voice Chat</h1>
      <div className="recording-controls">
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
      <div className="chatbox" ref={chatboxRef}>
        {conversation.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <p className="message-text">{message.text}</p>
            <div className="time-chip-container">
              <span className="time-chip-label">
                {message.type === 'user' ? 'Transcription Time:' : 'AI Response Time:'}
              </span>
              <span className="time-chip">{message.time}s</span>
            </div>
          </div>
        ))}
      </div>
      <div className="tts-audio-section">
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
