import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  BookOpen,
  Languages,
  RotateCcw,
  CheckCheck,
  HelpCircle,
  Minimize2,
} from 'lucide-react';
import { getApiUrl } from '../config/api';
import './WhatsAppAiAssistant.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface WhatsAppAiAssistantProps {
  literatureTitle: string;
  literatureContent: string;
  user: any;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const WhatsAppAiAssistant: React.FC<WhatsAppAiAssistantProps> = ({
  literatureTitle,
  literatureContent,
  user,
  onOpenAuth,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Initialize greeting message on first mount or literature change
  useEffect(() => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'initial-greeting',
        sender: 'assistant',
        text: `Salutations! 📖 I am your Athenæum Scholarly Companion. You are reading "${literatureTitle || 'this classical work'}". How may I illuminate the narrative, characters, or philosophy for you today?`,
        timestamp: now,
      },
    ]);
  }, [literatureTitle]);

  // Scroll to bottom of chat automatically when messages update
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!text || loading) return;

    if (!user) {
      onOpenAuth('login');
      return;
    }

    const token = localStorage.getItem('literature_token');
    if (!token) {
      onOpenAuth('login');
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const res = await fetch(getApiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: literatureTitle,
          content: (literatureContent || '').slice(0, 8000),
          userMessage: text,
          history,
        }),
      });

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!res.ok) {
        throw new Error(data.error || 'AI service is temporarily unavailable. Please try again later.');
      }

      const botReply: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'I am reflecting upon this passage.',
        timestamp: replyTime,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: err.message || 'AI service is temporarily unavailable. Please try again later.',
          timestamp: errTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChip = (chipType: 'summarize' | 'explain' | 'hindi' | 'kannada') => {
    switch (chipType) {
      case 'summarize':
        handleSendMessage('Please provide a concise scholarly summary and core themes of this work.');
        break;
      case 'explain':
        handleSendMessage('Could you explain the main metaphors and difficult sections in simple, evocative language?');
        break;
      case 'hindi':
        handleSendMessage('Please translate the opening essence of this literature into graceful Hindi (हिन्दी).');
        break;
      case 'kannada':
        handleSendMessage('Please translate the opening essence of this literature into graceful Kannada (ಕನ್ನಡ).');
        break;
    }
  };

  return (
    <>
      {/* Floating Action Button Launcher */}
      {!isOpen && (
        <button
          className="wa-chat-launcher"
          onClick={() => {
            if (!user) {
              onOpenAuth('login');
              return;
            }
            setIsOpen(true);
          }}
          id="btn-open-wa-chat"
          title="Open WhatsApp-style Literature AI Assistant"
        >
          <div className="wa-launcher-pulse"></div>
          <MessageSquare size={18} />
          <span>Literature AI Chat</span>
        </button>
      )}

      {/* WhatsApp-Style Chat Window */}
      {isOpen && (
        <div className="wa-chat-window" id="wa-chat-window">
          {/* Header Bar */}
          <div className="wa-header">
            <div className="wa-header-left">
              <div className="wa-avatar">
                <Sparkles size={20} />
                <span className="wa-online-dot"></span>
              </div>
              <div className="wa-title-area">
                <h4 className="wa-name">Scholarly Companion</h4>
                <span className="wa-status">
                  {loading ? 'typing...' : 'online • Google Gemini 2.5'}
                </span>
              </div>
            </div>
            <div className="wa-header-actions">
              <button
                className="wa-icon-btn"
                onClick={() => {
                  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  setMessages([
                    {
                      id: 'reset-greeting',
                      sender: 'assistant',
                      text: `Conversation renewed. How may I assist your exploration of "${literatureTitle}"?`,
                      timestamp: now,
                    },
                  ]);
                }}
                title="Clear & Restart Chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="wa-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="wa-chips-bar">
            <button
              className="wa-chip"
              disabled={loading}
              onClick={() => handleQuickChip('summarize')}
            >
              <BookOpen size={12} color="#075e54" />
              <span>✨ Summarize</span>
            </button>
            <button
              className="wa-chip"
              disabled={loading}
              onClick={() => handleQuickChip('explain')}
            >
              <HelpCircle size={12} color="#075e54" />
              <span>✨ Explain Metaphors</span>
            </button>
            <button
              className="wa-chip"
              disabled={loading}
              onClick={() => handleQuickChip('hindi')}
            >
              <Languages size={12} color="#075e54" />
              <span>✨ Hindi (हिन्दी)</span>
            </button>
            <button
              className="wa-chip"
              disabled={loading}
              onClick={() => handleQuickChip('kannada')}
            >
              <Languages size={12} color="#075e54" />
              <span>✨ Kannada (ಕನ್ನಡ)</span>
            </button>
          </div>

          {/* Chat Stream Messages */}
          <div className="wa-chat-stream" ref={chatStreamRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`wa-bubble ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}
              >
                <div className="wa-bubble-content">{m.text}</div>
                <div className="wa-meta">
                  <span>{m.timestamp}</span>
                  {m.sender === 'user' && (
                    <CheckCheck size={13} color="#53bdeb" style={{ marginLeft: '2px' }} />
                  )}
                </div>
              </div>
            ))}

            {/* Typing Animation */}
            {loading && (
              <div className="wa-typing-indicator">
                <div className="wa-dot"></div>
                <div className="wa-dot"></div>
                <div className="wa-dot"></div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            className="wa-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="wa-input-field"
              placeholder="Ask about this literature..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
              id="input-wa-chat-message"
            />
            <button
              type="submit"
              className="wa-send-btn"
              disabled={!inputVal.trim() || loading}
              id="btn-wa-send-message"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
