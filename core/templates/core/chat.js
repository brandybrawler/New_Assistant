// pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const IndexPage = () => {
  const router = useRouter();
  const [chatLog, setChatLog] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('Not Connected');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket(`ws://${window.location.host}/ws/chat/`);
    newSocket.onopen = () => {
      setStatus('Connected');
    };
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChatLog((prevLog) => prevLog + `Server: ${data.message}\n`);
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play();
      }
    };
    newSocket.onclose = () => {
      setStatus('Not Connected');
      console.error('Chat socket closed unexpectedly');
    };
    setSocket(newSocket);

    const newRecognition = new window.webkitSpeechRecognition() || new window.SpeechRecognition();
    newRecognition.continuous = true;
    newRecognition.interimResults = true;
    newRecognition.onresult = (event) => {
      let interim_transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const final_transcript = event.results[i][0].transcript;
          setChatLog((prevLog) => prevLog + `You: ${final_transcript}\n`);
          socket.send(JSON.stringify({ message: final_transcript }));
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      setInputValue(interim_transcript);
    };
    newRecognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };
    newRecognition.onend = () => {
      setIsListening(false);
      setInputValue('');
    };
    setRecognition(newRecognition);

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      socket.send(JSON.stringify({ message: inputValue }));
      setChatLog((prevLog) => prevLog + `You: ${inputValue}\n`);
      setInputValue('');
    }
  };

  const startListening = () => {
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  return (
    <div className="container">
      <h1>Voice Assistant Chat</h1>
      <div className="status">{status}</div>
      <textarea className="chat-log" value={chatLog} readOnly aria-live="polite"></textarea>
      <br />
      <input
        className="chat-message-input"
        type="text"
        placeholder="Type your message here..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        aria-label="Message Input"
      />
      <div className="controls">
        <button onClick={sendMessage}>Send</button>
        <button className="start" onClick={startListening} disabled={isListening}>
          Start Voice Input
        </button>
        <button className="stop" onClick={stopListening} disabled={!isListening}>
          Stop Voice Input
        </button>
      </div>
      <audio className="response-audio" controls hidden></audio>

      <style jsx>{`
        .container {
          font-family: Arial, sans-serif;
          margin: 40px;
          background: #f4f4f9;
          color: #333;
        }
        .status {
          margin: 10px 0;
          color: ${status === 'Connected' ? 'green' : 'red'};
        }
        .chat-log {
          width: 100%;
          height: 300px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          background: white;
          overflow-y: auto;
          margin-bottom: 10px;
        }
        .chat-message-input {
          width: calc(100% - 22px);
          padding: 10px;
          margin-top: 10px;
        }
        .controls {
          margin-top: 10px;
        }
        button {
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background-color: #0056b3;
          color: white;
          border: none;
          border-radius: 5px;
          margin-right: 5px;
        }
        button:hover {
          background-color: #004494;
        }
        .start[disabled] {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .stop[disabled] {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
