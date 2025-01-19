import React, { useEffect, useRef, useState } from "react";
import "./ContentArea.css";
import './VoiceChat.css'
import { FaMicrophone, FaStop } from 'react-icons/fa';

const ContentArea = () => {
  // copied content from voiceChat.js starts here
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIResponseComplete, setIsAIResponseComplete] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Lyla");

  const voiceOptions = [
    "Castiel",
    "Harry",
    "Lyla",
    "Selena",
    "Abhishek",
    "Hiten",
  ];

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const websocketRef = useRef(null);
  const audioRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const ttsAudioChunksRef = useRef([]);
  const chatboxRef = useRef(null);

  useEffect(() => {
    websocketRef.current = new WebSocket("ws://localhost:8000/ws");
    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.transcription) {
        setConversation((prev) => [
          ...prev,
          {
            type: "user",
            text: data.transcription,
            time: data.transcription_time,
          },
        ]);
      } else if (data.ai_response_chunk) {
        setConversation((prev) => {
          const newConversation = [...prev];
          const lastMessage = newConversation[newConversation.length - 1];
          if (lastMessage && lastMessage.type === "ai") {
            // Append the new chunk, but remove any duplicated content
            const newText = lastMessage.text + data.ai_response_chunk;
            lastMessage.text = newText.replace(/(.+)(?=\1)/g, "");
          } else {
            newConversation.push({
              type: "ai",
              text: data.ai_response_chunk,
              time: null,
            });
          }
          return newConversation;
        });
      } else if (data.ai_response_complete) {
        setConversation((prev) => {
          const newConversation = [...prev];
          const lastMessage = newConversation[newConversation.length - 1];
          if (lastMessage && lastMessage.type === "ai") {
            lastMessage.time = data.ai_response_time;
          }
          return newConversation;
        });
        setIsAIResponseComplete(true);
      }
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isAIResponseComplete && conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.type === "ai") {
        fetchTTS(lastMessage.text);
        setIsAIResponseComplete(false);
      }
    }
  }, [isAIResponseComplete, conversation]);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [conversation]);

  const appendNextChunk = () => {
    if (
      ttsAudioChunksRef.current.length &&
      sourceBufferRef.current &&
      !sourceBufferRef.current.updating
    ) {
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        websocketRef.current.send(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fetchTTS = async (text) => {
    setIsLoading(true);
    ttsAudioChunksRef.current = [];

    try {
      const response = await fetch(
        `http://localhost:8000/tts?text=${encodeURIComponent(
          text
        )}&voice=${selectedVoice}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      audioRef.current.src = URL.createObjectURL(mediaSource);

      mediaSource.addEventListener("sourceopen", async () => {
        sourceBufferRef.current = mediaSource.addSourceBuffer("audio/mpeg");
        sourceBufferRef.current.mode = "sequence";
        sourceBufferRef.current.addEventListener("updateend", appendNextChunk);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            ttsAudioChunksRef.current.push(value);
            if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
              appendNextChunk();
            }

            if (audioRef.current.readyState >= 2) {
              audioRef.current.play();
              setIsLoading(false);
            }
          }
          mediaSource.endOfStream();
        } catch (error) {
          console.error("Error while streaming:", error);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Error fetching TTS:", error);
      setIsLoading(false);
    }
  };
  // copied content from voiceChat.js ends here
  return (
    <div className="content-area">
      <div className="navbar">
        <p>Voice Chat With Kroo</p>
      </div>
      <div className="container main-section">
        <div className="voice-chat-container">
          <h1>Voice Chat</h1>
          <div className="chatbox" ref={chatboxRef}>
            {conversation.map((message, index) => (
              <div key={index} className={`message ${message.type}-message`}>
                <p className="message-text">{message.text}</p>
                <div className="time-chip-container">
                  <span className="time-chip-label">
                    {message.type === "user"
                      ? "Transcription Time:"
                      : "AI Response Time:"}
                  </span>
                  <span className="time-chip">{message.time}s</span>
                </div>
              </div>
            ))}
          </div>
          <div className="tts-audio-section">
            <audio ref={audioRef}>
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="voice-selector">
            <label htmlFor="voice-select">Select Voice: </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voiceOptions.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
            <button
              className={`record-button ${isRecording ? "recording" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
            >
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentArea;
