import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Sparkles, Send, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const starterSuggestions = [
  'How can I improve my resume?',
  'What skills should I learn next?',
  'Suggest internships for React + MongoDB',
  'How to increase my match percentage?'
];

const Chat = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your internship assistant. Ask about internships, skills, or improving your profile.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendToAPI = async (conv) => {
    setErr('');
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
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Chat error');
    }
    return json.answer;
  };

  const send = (preset) => {
    const q = (preset ?? input).trim();
    if (!q || loading) return;
    setInput('');
    const next = [...messages, { from: 'user', text: q }];
    setMessages(next);
    setLoading(true);
    sendToAPI(next)
      .then(answer => {
        setMessages(m => [...m, { from: 'bot', text: answer }]);
      })
      .catch(e => {
        setErr(e.message);
        setMessages(m => [...m, { from: 'bot', text: 'Error: ' + e.message }]);
      })
      .finally(() => setLoading(false));
  };

  const clearChat = () => {
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
            <button className="btn-out btn-out--sm" onClick={clearChat} title="Clear conversation">
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
                onClick={() => send(s)}
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
            send();
          }}
        >
          <input
            className="chat-text"
            placeholder="Ask about internships, skills, profile..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
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
          Enter to send
        </div>
      </div>
    </div>
  );
};

export default Chat;