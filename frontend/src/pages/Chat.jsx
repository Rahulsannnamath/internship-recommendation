import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Sparkles, Send, Trash2 } from 'lucide-react';

const starterSuggestions = [
  'How to improve my profile?',
  'Show internships for React + MongoDB',
  'What skills am I missing?',
  'Suggest ML internships'
];

const mockAnswers = {
  'How to improve my profile?':
    'Add more quantified achievements, list 5–8 core skills, and ensure your resume URL is valid.',
  'Show internships for React + MongoDB':
    'You match several full-stack postings. Focus on MERN and emphasize recent project repos.',
  'What skills am I missing?':
    'You could add: TypeScript, Testing (Jest), CI/CD basics, and Docker fundamentals.',
  'Suggest ML internships':
    'Look at ML, NLP, and Data Science roles requiring Python, pandas, and model experimentation.'
};

const Chat = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your internship assistant. Ask anything about internships, skills or profile optimization.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMessages(m => [...m, { from: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const reply =
        mockAnswers[q] ||
        'Mock AI: (Static) I will soon use Gemini API to give smarter tailored recommendations.';
      setMessages(m => [...m, { from: 'bot', text: reply }]);
      setLoading(false);
    }, 650);
  };

  const clearChat = () => {
    setMessages([{ from: 'bot', text: 'Conversation cleared. Ask a new question!' }]);
  };

  return (
    <div className="view chat-view">
      <div className="chat-shell panel">
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
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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
              <span>Send</span>
            </button>
        </form>
        <div className="hint-row">
          Press Enter to send • Ctrl/⌘ + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default Chat;