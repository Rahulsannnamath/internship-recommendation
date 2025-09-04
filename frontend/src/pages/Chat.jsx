import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Sparkles, Send, Trash2,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const starterSuggestions = [
  'How can I improve my resume?',
  'What skills should I learn next?',
  'Suggest internships for React + MongoDB',
  'How to increase my match percentage?'
];

const Chat = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your internship assistant. Ask about internships, skills, or improving your profile.', speak: true }
  ]);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // Speech recognition
  const [recording, setRecording] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const interimRef = useRef('');

  // TTS
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lastInputMode, setLastInputMode] = useState('text'); // 'text' | 'voice'
  const speakQueueRef = useRef([]);
  const lastSpokenRef = useRef(null);

  const voiceCapturedRef = useRef(false);

  const listRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, loading]);

  // Init SpeechRecognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false;

    r.onresult = (e) => {
      let finalTxt = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalTxt += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) {
        interimRef.current = interim;
        setInput(v => v); // force re-render
      }
      if (finalTxt) {
        interimRef.current = '';
        voiceCapturedRef.current = true;
        setLastInputMode('voice');
        setInput(prev => (prev ? prev + ' ' : '') + finalTxt.trim());
      }
    };

    r.onerror = () => { setRecording(false); };
    r.onend = () => { setRecording(false); };

    setRecognizer(r);
  }, []);

  // Speak helper
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (!ttsEnabled || !text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => {
      speakQueueRef.current.shift();
      if (speakQueueRef.current.length) {
        setTimeout(() => speak(speakQueueRef.current[0]), 120);
      }
    };
    speechSynthesis.speak(utter);
  };

  // Speak only bot messages flagged speak:true
  useEffect(() => {
    if (!ttsEnabled) {
      speechSynthesis.cancel();
      speakQueueRef.current = [];
      return;
    }
    const botSpeakable = messages
      .map((m, idx) => ({ ...m, _i: idx }))
      .filter(m => m.from === 'bot' && m.speak);

    if (!botSpeakable.length) return;
    const newest = botSpeakable[botSpeakable.length - 1];
    if (lastSpokenRef.current === newest._i) return;

    const unsaid = botSpeakable.filter(b => b._i > (lastSpokenRef.current ?? -1));
    unsaid.forEach(u => speakQueueRef.current.push(u.text));
    lastSpokenRef.current = newest._i;

    if (!speechSynthesis.speaking && speakQueueRef.current.length) {
      speak(speakQueueRef.current[0]);
    }
  }, [messages, ttsEnabled]);

  const toggleRecord = () => {
    if (!recognizer) return;
    if (recording) {
      recognizer.stop();
      setRecording(false);
    } else {
      interimRef.current = '';
      try {
        recognizer.start();
        setLastInputMode('voice');
        setRecording(true);
      } catch {
        // ignore
      }
    }
  };

  const toggleTts = () => {
    if (ttsEnabled) {
      speechSynthesis.cancel();
      speakQueueRef.current = [];
      setTtsEnabled(false);
    } else {
      setTtsEnabled(true);
    }
  };

  const sendToAPI = async (conv) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        messages: conv.map(m => ({ role: m.from === 'bot' ? 'bot' : 'user', text: m.text }))
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Chat error');
    return json.answer;
  };

  const send = (preset) => {
    const q = (preset ?? input).trim();
    if (!q || loading) {
      if (!q) setErr('Please enter a prompt.');
      return;
    }
    setErr('');

    const isVoice = voiceCapturedRef.current === true; // capture before reset
    voiceCapturedRef.current = false;                  // reset so next typed submit isn't treated as voice
    setLastInputMode('text');                          // normalize after send
    setInput('');

    const next = [...messages, { from: 'user', text: q, mode: isVoice ? 'voice' : 'text' }];
    setMessages(next);
    setLoading(true);

    sendToAPI(next)
      .then(answer => {
        const speakThis = isVoice; // ONLY speak if this prompt was from voice capture
        setMessages(m => [...m, { from: 'bot', text: answer, speak: speakThis }]);
      })
      .catch(e => {
        setErr(e.message);
        setMessages(m => [...m, { from: 'bot', text: 'Error: ' + e.message, speak: false }]);
      })
      .finally(() => setLoading(false));
  };

  const clearChat = () => {
    speechSynthesis.cancel();
    speakQueueRef.current = [];
    setMessages([{ from: 'bot', text: 'Conversation cleared. Ask a new question!' }]);
    setErr('');
  };

  return (
    <div className="view chat-view">
      <div className="chat-shell panel chat-shell--wide">
        <header className="chat-header-row">
          <div className="chat-title">
            <MessageCircle size={18} />
            <span>Chat Assistant</span>
          </div>
          <div className="chat-actions">
            <button
              type="button"
              className="btn-out btn-out--sm"
              onClick={toggleTts}
              title={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
            >
              {ttsEnabled ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{ttsEnabled ? 'Mute' : 'Voice'}</span>
            </button>
            <button
              className="btn-out btn-out--sm"
              onClick={clearChat}
              title="Clear conversation"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </header>

        {messages.length === 1 && (
          <div className="chat-suggestions">
            {starterSuggestions.map(s => (
              <button
                key={s}
                type="button"
                className="chip chip--suggest"
                onClick={() => { voiceCapturedRef.current = false; send(s); }}
              >
                <Sparkles size={14} /> {s}
              </button>
            ))}
          </div>
        )}

        {err && (
          <div className="alert error small" style={{ margin: '.2rem 0 .4rem' }}>
            {err}
          </div>
        )}

        <div className="chat-message-list" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.from}`}>
              <div className="bubble">
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg bot">
              <div className="bubble typing">
                <span className="dots">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          className="chat-input-bar"
          onSubmit={e => {
            e.preventDefault();
            if (!input.trim()) { setErr('Please enter a prompt.'); return; }
            send();
          }}
        >
          <div className="voice-controls">
            <button
              type="button"
              className={`mic-btn ${recording ? 'rec' : ''}`}
              onClick={toggleRecord}
              disabled={!recognizer || loading}
              title={recording ? 'Stop Recording' : 'Start Voice Input'}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
          <textarea
            className="chat-text"
            placeholder="Speak or type your question..."
            value={input + (interimRef.current ? (' ' + interimRef.current) : '')}
            onChange={e => { voiceCapturedRef.current = false; setLastInputMode('text'); setInput(e.target.value); }}
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!input.trim()) { setErr('Please enter a prompt.'); return; }
                voiceCapturedRef.current = false;
                send();
              }
            }}
          />
          <button
            type="submit"
            className="btn-primary send-btn"
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
            <span>{loading ? '...' : 'Send'}</span>
          </button>
        </form>
        <div className="hint-row">
          Enter to send • Mic for voice • {ttsEnabled ? 'Voice on' : 'Voice off'}
        </div>
      </div>
    </div>
  );
};

export default Chat;