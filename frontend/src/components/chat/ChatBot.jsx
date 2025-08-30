import React, { useState } from 'react';

const ChatBot = ({ open, onClose }) => {
  const [messages, setMessages] = useState([
    { from:'bot', text:'Hi! Ask about internships or improving your profile.' }
  ]);
  const [input,setInput] = useState('');

  const send = () => {
    if(!input.trim()) return;
    const q = input.trim();
    setMessages(m => [...m, { from:'user', text:q }, { from:'bot', text:'(Mock AI) Response for: '+q }]);
    setInput('');
  };

  return (
    <div className={`chat-panel ${open ? 'open':''}`}>
      <div className="chat-header">
        <span>Assistant</span>
        <button onClick={onClose} className="icon-x">×</button>
      </div>
      <div className="chat-body">
        {messages.map((m,i)=>(
          <div key={i} className={`msg-row ${m.from}`}>
            <div className="msg-bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Type a question..."
        />
        <button className="btn-primary tiny" onClick={send}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;