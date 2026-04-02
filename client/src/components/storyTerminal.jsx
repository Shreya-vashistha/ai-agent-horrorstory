import { useEffect, useRef, useState } from "react";
import "./terminal.css";

const SUGGESTIONS = [
  "A small town where everyone forgets your name at midnight.",
  "An abandoned hospital with a pager that still beeps your number.",
  "A mirror that moves even when you don't.",
  "A shadow appears in photos but not in real life.",
];

export default function StoryTerminal() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);
  const activeSession = sessions.find((s) => s.id === activeId);

  // Create new chat
  const newChat = () => {
    const newSession = { id: Date.now(), title: "New Chat", messages: [] };
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(newSession.id);
  };

  useEffect(() => {
    if (sessions.length === 0) newChat();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  // Delete chat
  const deleteChat = (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (id === activeId) setActiveId(updated.length ? updated[0].id : null);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || loading || !activeSession) return;
    const prompt = input;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeId
          ? {
              ...s,
              messages: [...s.messages, { role: "user", content: prompt }],
              title: s.messages.length === 0 ? prompt.slice(0, 25) : s.title,
            }
          : s
      )
    );
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://ai-agent-horrorstory-1.onrender.com/api/story/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const story = data.story;

      // Add empty bot message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeId
            ? { ...s, messages: [...s.messages, { role: "assistant", content: "" }] }
            : s
        )
      );

      let i = 0;
      const interval = setInterval(() => {
        i++;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeId) return s;
            const msgs = [...s.messages];
            const lastIndex = msgs.length - 1;
            msgs[lastIndex].content = story.slice(0, i);
            return { ...s, messages: msgs };
          })
        );
        if (i >= story.length) {
          clearInterval(interval);
          setLoading(false);
        }
      }, 12);
    } catch {
      setLoading(false);
    }
  };

  // Top actions
  const suggestPrompt = () => {
    const s = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    setInput(s);
  };

  const copyLast = () => {
    const last = activeSession?.messages.slice().reverse().find((m) => m.role === "assistant");
    if (last) navigator.clipboard.writeText(last.content);
  };

  const clearChat = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, messages: [] } : s))
    );
  };

  // Send on Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <button className="newChat" onClick={newChat}>
          + New Chat
        </button>
        {sessions.map((s) => (
          <div key={s.id} className={`sidebar__item ${s.id === activeId ? "active" : ""}`}>
            <span className="sidebar__text" onClick={() => setActiveId(s.id)}>
              {s.title}
            </span>
            <button className="deleteBtn" onClick={() => deleteChat(s.id)}>
              ✕
            </button>
          </div>
        ))}
      </aside>

      {/* MAIN */}
      <div className="ui">
        {/* TOP BAR */}
        <header className="topbar">
          <button onClick={suggestPrompt}>Suggest Prompt</button>
          <button onClick={copyLast}>Copy Last</button>
          <button onClick={clearChat}>Clear</button>
        </header>

        {/* CHAT */}
       <div className="chat" ref={chatRef}>
        {activeSession?.messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "user" : "bot"}>
            <div>{msg.content}</div>

            {/* Character count only for bot messages */}
            {msg.role === "assistant" && (
              <div className={`charCount ${msg.content.length > 300 ? "warning" : ""}`}>
                {msg.content.length}/300
              </div>
            )}

            {/* Blinking cursor for typing bot */}
            {msg.role === "assistant" && loading && i === activeSession.messages.length - 1 && (
              <span className="cursor">|</span>
            )}
          </div>
        ))}
      </div>

        {/* INPUT */}
        <div className="inputArea">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something scary..."
            rows={2}
          />
          <button onClick={sendMessage}>{loading ? "..." : "Send"}</button>
        </div>

        {/* FOOTER */}
        <footer className="footer">
          <p>Horror Story AI Agent © 2026 | Build by Shreya Vashistha</p>
        </footer>
      </div>
    </div>
  );
}
