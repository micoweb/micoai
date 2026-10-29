import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Atom, BookOpen, Bot, ChevronDown, CircleHelp, Clock3, GraduationCap,
  History, Menu, Mic, MicOff, Plus, Send, Settings2, Sparkles, Trash2,
  Volume2, VolumeX, X, Zap
} from "lucide-react";
import "./styles.css";

const WELCOME = {
  role: "assistant",
  content: "ආයුබෝවන්! මම MICO AI — ඔයාගේ AI Study Buddy. ✨\n\nඅද අපි එකට මොන පාඩමද ඉගෙනගන්නේ? Maths, Science, English හෝ වෙනත් ඕනෑම විෂයක් ගැන මගෙන් අහන්න."
};
const starterPrompts = [
  { icon: Atom, title: "Explain a concept", text: "Explain a difficult science concept in simple steps." },
  { icon: BookOpen, title: "Help with homework", text: "Help me understand my homework step by step." },
  { icon: GraduationCap, title: "Study plan", text: "Make me a simple study plan for today." }
];
const STORE_KEY = "mico-ai-chats-v1";

function getSavedChats() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); }
  catch { return []; }
}
function makeChat() {
  return { id: crypto.randomUUID?.() || String(Date.now()), title: "New study session", messages: [WELCOME], updatedAt: Date.now() };
}
function App() {
  const [chats, setChats] = useState(getSavedChats);
  const [activeId, setActiveId] = useState(() => getSavedChats()[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [apiReady, setApiReady] = useState(null);
  const [language, setLanguage] = useState("auto");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!chats.length) {
      const first = makeChat();
      setChats([first]);
      setActiveId(first.id);
    } else if (!activeId || !chats.some(c => c.id === activeId)) setActiveId(chats[0].id);
  }, []);
  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(chats)); }, [chats]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [activeId, chats, loading]);
  useEffect(() => {
    fetch("/api/health").then(r => r.json()).then(d => setApiReady(Boolean(d.configured))).catch(() => setApiReady(false));
  }, []);

  const activeChat = chats.find(c => c.id === activeId) || chats[0];
  const messages = activeChat?.messages || [WELCOME];

  function updateChat(id, updater) {
    setChats(prev => prev.map(c => c.id === id ? { ...updater(c), updatedAt: Date.now() } : c));
  }
  function newChat() {
    const chat = makeChat();
    setChats(prev => [chat, ...prev]);
    setActiveId(chat.id);
    setDraft("");
    setSidebarOpen(false);
    setHistoryOpen(false);
  }
  function deleteChat(id, e) {
    e?.stopPropagation();
    setChats(prev => {
      const next = prev.filter(c => c.id !== id);
      if (!next.length) {
        const fresh = makeChat();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }
  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || loading || !activeChat) return;
    const userMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    const title = activeChat.messages.length <= 1 ? content.slice(0, 34) : activeChat.title;
    updateChat(activeChat.id, c => ({ ...c, title, messages: nextMessages }));
    setDraft("");
    setLoading(true);
    try {
      const apiMessages = nextMessages.filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content }));
      if (language !== "auto") apiMessages.push({ role: "user", content: `Please answer in ${language === "si" ? "Sinhala" : "English"} for this conversation.` });
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "AI server එකට සම්බන්ධ වෙන්න බැරි වුණා.");
      updateChat(activeChat.id, c => ({ ...c, messages: [...c.messages, { role: "assistant", content: data.answer }] }));
    } catch (err) {
      updateChat(activeChat.id, c => ({ ...c, messages: [...c.messages, {
        role: "assistant",
        content: `දැනට පිළිතුර ලබාගන්න බැරි වුණා.\n\n${err.message}\n\nAPI key එක සකස් කරලා server එක නැවත ආරම්භ කරන්න.`
      }] }));
    } finally { setLoading(false); inputRef.current?.focus(); }
  }
  function toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input එක මේ browser එකේ සහය නොදක්වයි. Chrome browser එකෙන් උත්සාහ කරන්න.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "en" ? "en-US" : "si-LK";
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceOn(true);
    recognition.onend = () => setVoiceOn(false);
    recognition.onerror = () => setVoiceOn(false);
    recognition.onresult = e => setDraft(prev => `${prev}${prev ? " " : ""}${e.results[0][0].transcript}`);
    recognition.start();
  }
  function readAnswer(text) {
    if (!("speechSynthesis" in window)) { alert("Text-to-speech මේ browser එකේ සහය නොදක්වයි."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0D80-\u0DFF]/.test(text) ? "si-LK" : "en-US";
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
  function clearCurrent() {
    if (!activeChat) return;
    updateChat(activeChat.id, c => ({ ...c, title: "New study session", messages: [WELCOME] }));
  }

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row">
        <div className="brand-mark"><Bot size={23} /></div>
        <div><div className="brand-name">MICO <span>AI</span></div><div className="brand-sub">YOUR STUDY COMPANION</div></div>
        <button className="icon-btn close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <button className="new-chat-btn" onClick={newChat}><Plus size={18}/> New study session <span>⌘ K</span></button>
      <div className="sidebar-label"><History size={14}/> RECENT SESSIONS</div>
      <div className="chat-list">
        {chats.slice().sort((a,b) => b.updatedAt-a.updatedAt).map(chat =>
          <button key={chat.id} className={`chat-item ${chat.id === activeId ? "selected" : ""}`} onClick={() => { setActiveId(chat.id); setSidebarOpen(false); setHistoryOpen(false); }}>
            <span className="chat-dot"/><span className="chat-title">{chat.title}</span>
            <span className="delete-chat" role="button" tabIndex={0} aria-label="Delete session" onClick={e => deleteChat(chat.id,e)}><Trash2 size={14}/></span>
          </button>
        )}
      </div>
      <div className="sidebar-bottom">
        <div className="profile-orb"><Sparkles size={18}/></div>
        <div className="profile-copy"><strong>Keep learning</strong><span>One step at a time.</span></div>
        <button className="icon-btn" title="Clear current session" onClick={clearCurrent}><Settings2 size={17}/></button>
      </div>
    </aside>

    {sidebarOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="main-panel">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
          <div className="status-orb"><span/></div>
          <div><div className="topbar-title">MICO Study Space</div><div className="online-line"><span className={`online-dot ${apiReady === false ? "offline" : ""}`}/>{apiReady === null ? "Checking connection…" : apiReady ? "AI engine ready" : "API setup needed"}</div></div>
        </div>
        <div className="topbar-actions">
          <label className="language-select"><span>Language</span><select value={language} onChange={e => setLanguage(e.target.value)} aria-label="Answer language"><option value="auto">Auto</option><option value="si">සිංහල</option><option value="en">English</option></select><ChevronDown size={13}/></label>
          <button className="history-button" onClick={() => setHistoryOpen(!historyOpen)}><History size={16}/><span>History</span></button>
        </div>
      </header>

      {historyOpen && <div className="history-popover">
        <div className="popover-heading">Your study sessions <button className="icon-btn" onClick={() => setHistoryOpen(false)}><X size={16}/></button></div>
        {chats.slice().sort((a,b)=>b.updatedAt-a.updatedAt).map(c => <button key={c.id} className="history-row" onClick={() => {setActiveId(c.id);setHistoryOpen(false);}}><History size={15}/><span>{c.title}</span><small>{c.messages.length - 1} msgs</small></button>)}
        <button className="history-new" onClick={newChat}><Plus size={15}/> Start new session</button>
      </div>}

      <section className="conversation" aria-live="polite">
        {messages.length <= 1 ? <div className="welcome-layout">
          <div className="hero-eyebrow"><span className="eyebrow-line"/> YOUR PERSONAL AI STUDY BUDDY <span className="eyebrow-line"/></div>
          <div className="hero-orb-wrap">
            <div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit orbit-c"/>
            <div className="hero-orb"><div className="orb-core"><Bot size={48} strokeWidth={1.4}/></div><div className="orb-glint"/></div>
            <span className="float-chip chip-one"><Sparkles size={14}/> Learn smarter</span>
            <span className="float-chip chip-two"><Zap size={14}/> Your pace</span>
          </div>
          <h1>Big ideas.<br/><span>Made simple.</span></h1>
          <p className="hero-description">ඔයාගේ ඉගෙනීමේ ගමනට මම උදව් කරන්නම්.<br className="desktop-break"/> Ask anything. Understand everything.</p>
          <div className="starter-grid">
            {starterPrompts.map(item => {const Icon = item.icon; return <button className="starter-card" key={item.title} onClick={() => sendMessage(item.text)}><span className="starter-icon"><Icon size={18}/></span><span className="starter-copy"><strong>{item.title}</strong><small>{item.text}</small></span><span className="starter-arrow">↗</span></button>;})}
          </div>
        </div> : <div className="message-stack">
          {messages.map((m, i) => <article key={i} className={`message-row ${m.role === "user" ? "user-row" : ""}`}>
            <div className={`message-avatar ${m.role === "user" ? "user-avatar" : ""}`}>{m.role === "user" ? "Y" : <Bot size={18}/>}</div>
            <div className="message-body"><div className="message-meta">{m.role === "user" ? "YOU" : "MICO AI"} {m.role === "assistant" && <button className="read-aloud" title="Read answer aloud" onClick={() => readAnswer(m.content)}>{speaking ? <VolumeX size={14}/> : <Volume2 size={14}/>}</button>}</div><div className="message-content">{m.content}</div></div>
          </article>)}
          {loading && <article className="message-row"><div className="message-avatar"><Bot size={18}/></div><div className="message-body"><div className="message-meta">MICO AI</div><div className="typing-bubble"><span/><span/><span/> <small>Thinking with you…</small></div></div></article>}
          <div ref={endRef}/>
        </div>}
      </section>

      <footer className="composer-area">
        <div className="composer-box">
          <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {if(e.key === "Enter" && !e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Ask MICO anything… / ඕනෑම දෙයක් අහන්න" rows={1} aria-label="Message MICO AI"/>
          <div className="composer-tools">
            <div className="composer-hint"><span className="hint-spark"><Sparkles size={13}/></span> Learn at your own pace <span className="hint-divider"/> <kbd>↵</kbd> to send</div>
            <div className="composer-buttons">
              <button className={`voice-btn ${voiceOn ? "recording" : ""}`} title="Voice input" onClick={toggleVoiceInput}>{voiceOn ? <MicOff size={17}/> : <Mic size={17}/>}</button>
              <button className="send-btn" onClick={() => sendMessage()} disabled={!draft.trim() || loading} aria-label="Send message"><Send size={17}/></button>
            </div>
          </div>
        </div>
        <div className="disclaimer"><CircleHelp size={12}/> MICO can make mistakes. Check important information with your teacher or textbook.</div>
      </footer>
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);