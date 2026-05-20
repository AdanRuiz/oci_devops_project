import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  MessageCirclePlus,
  Mic,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Search,
  Square,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'lumi-assistant-chats-v1';
const VIEW_NEW = 'new';
const VIEW_CHAT = 'chat';
const VIEW_SEARCH = 'search';

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildNewChat() {
  return {
    id: uid('chat'),
    title: 'New chat',
    pinned: false,
    updatedAt: Date.now(),
    messages: [],
  };
}

function buildUserMessage(content) {
  return { id: uid('msg'), role: 'user', content, createdAt: Date.now() };
}

function buildAssistantMessage(content) {
  return { id: uid('msg'), role: 'assistant', content, createdAt: Date.now() };
}

function readChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [buildNewChat()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [buildNewChat()];
    return parsed.map((chat) => ({
      ...chat,
      pinned: Boolean(chat.pinned),
    }));
  } catch {
    return [buildNewChat()];
  }
}

function persistChats(chats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function firstWords(text, size = 28) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (clean.length <= size) return clean || 'New chat';
  return `${clean.slice(0, size - 1)}...`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

async function callAssistantApi(message, history) {
  const envUrl = import.meta.env.VITE_GENAI_API_URL;
  const endpoints = [envUrl, '/api/genai/chat'].filter(Boolean);
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-10).map((item) => ({ role: item.role, content: item.content })),
        }),
      });
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.reply || data.message || data.output || data.text || data.response;
      if (typeof text === 'string' && text.trim()) return { ok: true, text };
    } catch {
      // try next endpoint
    }
  }
  return { ok: false, text: '' };
}

function normalize(value) {
  return (value || '').toLowerCase().trim();
}

function extractNames(text) {
  const match = text.match(/(?:with|con)\s+(.+)/i);
  if (!match) return [];
  return match[1]
    .split(/[;,]| and | y /i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findUsersByNames(users, names) {
  return names
    .map((name) => {
      const token = normalize(name);
      return users.find((u) => normalize(u.name || u.username || u.email || '').includes(token));
    })
    .filter(Boolean);
}

async function runSmartAction(message) {
  const lower = normalize(message);

  if (lower.includes('create team') || lower.includes('crear team') || lower.includes('crear equipo')) {
    const users = await fetchJson('/users');
    const teams = await fetchJson('/teams');
    const names = extractNames(message);
    const matched = findUsersByNames(users, names);
    if (matched.length === 0) {
      return {
        handled: true,
        text:
          'I can create a team with existing developers. Example: "Create team Platform Crew with Alex Rivera and Jessie Park".',
      };
    }

    const managerId = matched[0].id;
    const teamName =
      message.match(/create team\s+(.+?)(?:\s+with|$)/i)?.[1]?.trim() ||
      message.match(/crear (?:team|equipo)\s+(.+?)(?:\s+con|$)/i)?.[1]?.trim() ||
      `Team ${teams.length + 1}`;

    const createdTeam = await fetchJson('/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName, managerId }),
    });
    const memberIds = new Set(matched.map((u) => u.id));
    memberIds.add(managerId);
    await Promise.all(
      [...memberIds].map((memberUserId) =>
        fetch('/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: createdTeam.id, memberUserId }),
        })
      )
    );

    return { handled: true, text: `Done. I created "${teamName}" with ${memberIds.size} developers.` };
  }

  if (lower.includes('create project') || lower.includes('crear proyecto')) {
    const teams = await fetchJson('/teams');
    const projectName =
      message.match(/create project\s+(.+?)(?:\s+using|\s+from|$)/i)?.[1]?.trim() ||
      message.match(/crear proyecto\s+(.+?)(?:\s+usando|\s+desde|$)/i)?.[1]?.trim();
    const teamNameHint =
      message.match(/(?:using|from|usando|desde)\s+team\s+(.+)$/i)?.[1]?.trim() ||
      message.match(/(?:using|from|usando|desde)\s+(.+)$/i)?.[1]?.trim();

    if (!projectName) {
      return {
        handled: true,
        text: 'Tell me the project name. Example: "Create project Mobile Revamp using team Platform Ops".',
      };
    }

    const sourceTeam = teams.find((team) => normalize(team.name).includes(normalize(teamNameHint || '')));
    if (!sourceTeam) {
      return { handled: true, text: 'I need an existing source team name to copy members from.' };
    }

    const managerId = sourceTeam.managerId || sourceTeam.users?.[0]?.id;
    const createdProjectTeam = await fetchJson('/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, managerId }),
    });

    const memberIds = new Set((sourceTeam.users || []).map((u) => u.id));
    memberIds.add(managerId);
    await Promise.all(
      [...memberIds].map((memberUserId) =>
        fetch('/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: createdProjectTeam.id, memberUserId }),
        })
      )
    );

    return {
      handled: true,
      text: `Project "${projectName}" is ready. Workspace copied from "${sourceTeam.name}".`,
    };
  }

  if (lower.includes('create sprint') || lower.includes('crear sprint')) {
    const teams = await fetchJson('/teams');
    const sprintName =
      message.match(/create sprint\s+(.+?)\s+(?:for|inside|in)\s+/i)?.[1]?.trim() ||
      message.match(/crear sprint\s+(.+?)\s+(?:para|en)\s+/i)?.[1]?.trim();
    const projectName =
      message.match(/(?:for|inside|in)\s+project\s+(.+?)\s+(?:from|starting|start|de|desde)\s+/i)?.[1]?.trim() ||
      message.match(/(?:para|en)\s+proyecto\s+(.+?)\s+(?:de|desde)\s+/i)?.[1]?.trim();
    const dateMatch = message.match(
      /(\d{4}-\d{2}-\d{2}(?:[ t]\d{2}:\d{2})?).*?(\d{4}-\d{2}-\d{2}(?:[ t]\d{2}:\d{2})?)/i
    );

    if (!sprintName || !projectName || !dateMatch) {
      return {
        handled: true,
        text:
          'Use this format: "Create sprint Sprint 9 for project Mobile App from 2026-05-20 09:00 to 2026-06-03 18:00".',
      };
    }

    const project = teams.find((team) => normalize(team.name).includes(normalize(projectName)));
    if (!project) return { handled: true, text: `I could not find project "${projectName}".` };

    await fetch('/sprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: sprintName,
        teamId: project.id,
        startDate: new Date(dateMatch[1]).toISOString(),
        endDate: new Date(dateMatch[2]).toISOString(),
      }),
    });
    return { handled: true, text: `Sprint "${sprintName}" created inside "${project.name}".` };
  }

  if (
    lower.includes('how much more work') ||
    lower.includes('team doing this week') ||
    lower.includes('carga esta semana') ||
    lower.includes('workload')
  ) {
    const tasks = await fetchJson('/tasks');
    const openTasks = tasks.filter((task) => task.status !== 'DONE');
    const remainingHours = openTasks.reduce(
      (sum, task) => sum + Math.max((task.expectedHours || 0) - (task.hoursDone || 0), 0),
      0
    );
    const totalExpected = tasks.reduce((sum, task) => sum + (task.expectedHours || 0), 0);
    const totalDone = tasks.reduce((sum, task) => sum + (task.hoursDone || 0), 0);
    return {
      handled: true,
      text: `This week snapshot: ${remainingHours}h remaining, ${totalDone}h done out of ${totalExpected}h planned.`,
    };
  }

  return { handled: false, text: '' };
}

async function replyForMessage(message, history) {
  const apiResult = await callAssistantApi(message, history);
  if (apiResult.ok) return apiResult.text;
  const actionResult = await runSmartAction(message);
  if (actionResult.handled) return actionResult.text;
  return 'Tell me what you need in plain language — for example: "Set up a team called Platform Crew with Alex and Jessie."';
}

function dateLabel(timestamp) {
  const now = new Date();
  const value = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const compare = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (compare.getTime() === today.getTime()) return 'Today';
  if (compare.getTime() === yesterday.getTime()) return 'Yesterday';
  return value.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function initialsFromName(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return 'LU';
}

function LumiComposer({ draft, setDraft, loading, onSend }) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  const hasDraft = draft.trim().length > 0;

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    return () => recognitionRef.current?.stop();
  }, []);

  const stopDictation = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const startDictation = () => {
    if (isListening) {
      stopDictation();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setDraft(transcript);
    };

    recognition.onerror = () => stopDictation();
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleDraftChange = (event) => {
    if (isListening) stopDictation();
    setDraft(event.target.value);
  };

  const handleAction = () => {
    if (hasDraft) onSend();
    else startDictation();
  };

  const actionMode = hasDraft ? 'send' : isListening ? 'listening' : 'idle';
  const isFilled = actionMode !== 'idle';

  return (
    <div className="flex items-center gap-3 rounded-full border border-[#2A1814]/15 bg-white pl-6 pr-4 py-3 shadow-[0_10px_35px_-28px_rgba(199,70,52,0.8)]">
      <input
        value={draft}
        onChange={handleDraftChange}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (hasDraft) onSend();
          }
        }}
        placeholder="Ask Lumi"
        className="w-full bg-transparent text-base text-[#2A1814] placeholder:text-[#6B6560] focus:outline-none"
      />
      <button
        type="button"
        onClick={handleAction}
        disabled={loading || (!hasDraft && !speechSupported)}
        aria-label={
          hasDraft ? 'Send message' : isListening ? 'Stop dictation' : 'Start dictation'
        }
        className={`lumi-composer-action-btn inline-flex h-10 w-10 shrink-0 aspect-square items-center justify-center rounded-full disabled:opacity-60 ${
          isFilled ? 'lumi-composer-action-btn--filled' : 'lumi-composer-action-btn--ghost'
        }`}
      >
        <span key={actionMode} className="lumi-composer-action-icon" aria-hidden>
          {actionMode === 'send' && <ArrowUp className="h-6 w-6" strokeWidth={2.5} />}
          {actionMode === 'listening' && (
            <Square className="h-3.5 w-3.5 fill-current stroke-none" />
          )}
          {actionMode === 'idle' && <Mic className="h-6 w-6" />}
        </span>
      </button>
    </div>
  );
}

function LumiAssistant() {
  const [chats, setChats] = useState(readChats);
  const [selectedChatId, setSelectedChatId] = useState(() => readChats()[0]?.id);
  const [activeView, setActiveView] = useState(VIEW_NEW);
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [heroLine] = useState('Hi, how can I help you today?');
  const [chatMenuOpenId, setChatMenuOpenId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profileName] = useState('Guest');
  const [profileEmail] = useState('');
  const [profileAvatar] = useState('');

  useEffect(() => {
    const faviconLink = document.getElementById('favicon');
    const previousTitle = document.title;
    const previousFavicon = faviconLink?.getAttribute('href') ?? '';

    document.title = 'Lumi';

    const updateFavicon = () => {
      if (!faviconLink) return;
      faviconLink.href = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? '/lumi-ico-w.svg'
        : '/lumi-ico-b.svg';
    };

    updateFavicon();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateFavicon);

    return () => {
      document.title = previousTitle;
      if (faviconLink) {
        faviconLink.href =
          previousFavicon ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? '/logo-w.svg' : '/logo-b.svg');
      }
      mediaQuery.removeEventListener('change', updateFavicon);
    };
  }, []);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || chats[0],
    [chats, selectedChatId]
  );

  const visibleChats = useMemo(() => {
    const token = normalize(searchTerm);
    return chats
      .filter((chat) => normalize(chat.title).includes(token))
      .sort((a, b) => {
        if (a.pinned === b.pinned) return b.updatedAt - a.updatedAt;
        return a.pinned ? -1 : 1;
      });
  }, [chats, searchTerm]);
  const pinnedChats = useMemo(() => visibleChats.filter((chat) => chat.pinned), [visibleChats]);
  const recentChats = useMemo(() => visibleChats.filter((chat) => !chat.pinned), [visibleChats]);

  const updateChats = (next) => {
    setChats(next);
    persistChats(next);
  };

  const createChat = () => {
    setSelectedChatId(null);
    setActiveView(VIEW_NEW);
    setSearchTerm('');
    setChatMenuOpenId(null);
    setDraft('');
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || loading) return;

    const userMessage = buildUserMessage(text);
    const isDraftStart = activeView === VIEW_NEW || !selectedChatId || !selectedChat;
    const baseChat =
      isDraftStart
        ? {
            id: uid('chat'),
            title: firstWords(text),
            pinned: false,
            updatedAt: Date.now(),
            messages: [userMessage],
          }
        : {
            ...selectedChat,
            title: selectedChat.messages.length === 0 ? firstWords(text) : selectedChat.title,
            updatedAt: Date.now(),
            messages: [...selectedChat.messages, userMessage],
          };

    const nextBeforeReply = isDraftStart
      ? [baseChat, ...chats]
      : chats.map((chat) => (chat.id === baseChat.id ? baseChat : chat));

    updateChats(nextBeforeReply);
    setSelectedChatId(baseChat.id);
    setDraft('');
    setActiveView(VIEW_CHAT);
    setLoading(true);

    try {
      const responseText = await replyForMessage(text, baseChat.messages);
      const assistantMessage = buildAssistantMessage(responseText);
      updateChats(
        nextBeforeReply.map((chat) =>
          chat.id !== baseChat.id
            ? chat
            : { ...chat, updatedAt: Date.now(), messages: [...chat.messages, assistantMessage] }
        )
      );
    } catch (error) {
      const assistantMessage = buildAssistantMessage(
        `I hit an error: ${error.message || 'unknown error'}.`
      );
      updateChats(
        nextBeforeReply.map((chat) =>
          chat.id !== baseChat.id
            ? chat
            : { ...chat, updatedAt: Date.now(), messages: [...chat.messages, assistantMessage] }
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#2A1814]">
      {isSidebarOpen ? (
        <aside className="lumi-sidebar-enter flex w-72 shrink-0 flex-col bg-white p-4">
        <div className="mb-5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <img src="/lumi.svg" alt="Lumi" className="h-8 w-8 shrink-0" />
              <p className="text-xl font-semibold text-[#2A1814]">Lumi</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6B6560] transition hover:bg-[#f5f2ec] hover:text-[#2A1814]"
              aria-label="Hide sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={createChat}
            className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
              activeView === VIEW_NEW
                ? 'bg-[#efefef] text-[#2A1814] shadow-sm'
                : 'text-[#2A1814] hover:bg-[#faf9f6]'
            }`}
          >
            <MessageCirclePlus className="h-4 w-4" />
            New chat
          </button>
          <button
            type="button"
            onClick={() => setActiveView(VIEW_SEARCH)}
            className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
              activeView === VIEW_SEARCH
                ? 'bg-[#efefef] text-[#2A1814] shadow-sm'
                : 'text-[#2A1814] hover:bg-[#faf9f6]'
            }`}
          >
            <Search className="h-4 w-4" />
            Search chats
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#2A1814] transition hover:bg-[#f5f2ec]"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Lumen
          </Link>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {pinnedChats.length > 0 && (
            <>
              <p className="mb-2 px-2 text-sm font-semibold text-[#6B6560]">Pinned</p>
              <div className="space-y-1">
                {pinnedChats.map((chat) => (
                  <div key={chat.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChatId(chat.id);
                        setActiveView(VIEW_CHAT);
                        setChatMenuOpenId(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition ${
                        activeView === VIEW_CHAT && chat.id === selectedChat?.id
                          ? 'bg-[#efefef] text-[#2A1814] shadow-sm'
                          : 'text-[#6B6560] hover:bg-[#f5f5f5] hover:text-[#2A1814]'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
                          chatMenuOpenId === chat.id
                            ? 'bg-[#e9e9e9] text-[#2A1814]'
                            : 'text-[#6B6560] opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setChatMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    </button>
                    {chatMenuOpenId === chat.id && (
                      <div className="absolute right-2 top-9 z-20 w-36 overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            updateChats(
                              chats.map((item) =>
                                item.id === chat.id ? { ...item, pinned: !item.pinned, updatedAt: Date.now() } : item
                              )
                            );
                            setChatMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#2A1814] hover:bg-[#faf9f6]"
                        >
                          <PinOff className="h-3.5 w-3.5" />
                          Unpin
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = chats.filter((item) => item.id !== chat.id);
                            updateChats(next.length > 0 ? next : [buildNewChat()]);
                            if (selectedChatId === chat.id) {
                              setSelectedChatId(next[0]?.id || null);
                              setActiveView(next.length > 0 ? VIEW_CHAT : VIEW_NEW);
                            }
                            setChatMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#c74634] hover:bg-[#fff6f4]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="mb-2 mt-3 px-2 text-sm font-semibold text-[#6B6560]">Recent</p>
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <div key={chat.id} className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setActiveView(VIEW_CHAT);
                    setChatMenuOpenId(null);
                  }}
                  className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition ${
                    activeView === VIEW_CHAT && chat.id === selectedChat?.id
                      ? 'bg-[#efefef] text-[#2A1814] shadow-sm'
                      : 'text-[#6B6560] hover:bg-[#f5f5f5] hover:text-[#2A1814]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {chat.title}
                  </span>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
                      chatMenuOpenId === chat.id
                        ? 'bg-[#e9e9e9] text-[#2A1814]'
                        : 'text-[#6B6560] opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setChatMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                </button>
                {chatMenuOpenId === chat.id && (
                  <div className="absolute right-2 top-9 z-20 w-36 overflow-hidden rounded-xl border border-[#2A1814]/10 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        updateChats(
                          chats.map((item) =>
                            item.id === chat.id ? { ...item, pinned: !item.pinned, updatedAt: Date.now() } : item
                          )
                        );
                        setChatMenuOpenId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#2A1814] hover:bg-[#faf9f6]"
                    >
                      <Pin className="h-3.5 w-3.5" />
                      Pin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = chats.filter((item) => item.id !== chat.id);
                        updateChats(next.length > 0 ? next : [buildNewChat()]);
                        if (selectedChatId === chat.id) {
                          setSelectedChatId(next[0]?.id || null);
                          setActiveView(next.length > 0 ? VIEW_CHAT : VIEW_NEW);
                        }
                        setChatMenuOpenId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#c74634] hover:bg-[#fff6f4]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            {profileAvatar ? (
              <img src={profileAvatar} alt={profileName} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c74634]/15 text-xs font-semibold text-[#c74634]">
                {initialsFromName(profileName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#2A1814]">{profileName}</p>
              <p className="truncate text-xs text-[#6B6560]">{profileEmail}</p>
            </div>
          </div>
        </div>
      </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="lumi-sidebar-toggle-enter absolute left-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6B6560] shadow-sm transition hover:bg-[#f5f2ec] hover:text-[#2A1814]"
          aria-label="Show sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <section className="relative flex min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(199,70,52,0.18),transparent_55%)]" />

        <div className="relative z-10 flex min-h-0 w-full flex-col items-center overflow-y-auto px-6 py-10">
          {activeView === VIEW_SEARCH ? (
            <div className="lumi-view-enter w-full max-w-3xl">
              <label className="mx-auto mt-2 flex w-full items-center gap-2 rounded-full border border-[#2A1814]/10 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[#6B6560]" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search chats"
                  className="w-full bg-transparent text-sm text-[#2A1814] placeholder:text-[#6B6560]/75 focus:outline-none"
                />
              </label>
              <div className="mt-5">
                <p className="mb-2 text-xs text-[#6B6560]">Recent</p>
                <div>
                  {visibleChats.map((chat, index) => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        setSelectedChatId(chat.id);
                        setActiveView(VIEW_CHAT);
                      }}
                      className="lumi-search-row grid w-full grid-cols-[minmax(0,1fr)_90px] items-center rounded-lg px-4 py-2.5 text-left text-base text-[#2A1814] transition hover:bg-[#faf9f6] lumi-message-enter"
                      style={{ animationDelay: `${Math.min(index * 20, 180)}ms` }}
                    >
                      <span className="truncate">{chat.title}</span>
                      <span className="text-right text-sm text-[#6B6560]">{dateLabel(chat.updatedAt)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full max-w-5xl flex-col">
              {activeView === VIEW_NEW ? (
                <div className="lumi-view-enter">
                    <div className="mx-auto mt-20 flex w-full max-w-4xl flex-col items-center">
                      <img src="/lumi.svg" alt="" aria-hidden className="h-24 w-24 shrink-0" />
                      <h1 className="mt-6 text-center text-[46px] font-semibold leading-tight tracking-tight text-[#2A1814]">
                        {heroLine}
                      </h1>
                    </div>
                    <div className="mx-auto mt-12 w-full max-w-4xl">
                      <LumiComposer
                        draft={draft}
                        setDraft={setDraft}
                        loading={loading}
                        onSend={sendMessage}
                      />
                    </div>
                </div>
              ) : (
                <div key={`chat-view-${selectedChatId || 'none'}`} className="lumi-view-enter flex h-full flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-14">
                      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-6">
                        {selectedChat?.messages?.map((message, index) =>
                          message.role === 'user' ? (
                            <div
                              key={message.id}
                              className="lumi-message-enter ml-auto max-w-[56%] rounded-full bg-[#f2f2f2] px-5 py-2.5 text-sm text-[#2A1814]"
                              style={{ animationDelay: `${Math.min(index * 26, 220)}ms` }}
                            >
                              {message.content}
                            </div>
                          ) : (
                            <div
                              key={message.id}
                              className="lumi-message-enter max-w-[72%] text-sm leading-relaxed text-[#2A1814]"
                              style={{ animationDelay: `${Math.min(index * 26, 220)}ms` }}
                            >
                              {message.content}
                            </div>
                          )
                        )}
                        {loading && (
                          <div className="lumi-message-enter max-w-[72%] text-sm text-[#6B6560]">
                            Lumi is thinking...
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="lumi-composer-enter mx-auto w-full max-w-4xl pb-6 pt-2">
                      <LumiComposer
                        draft={draft}
                        setDraft={setDraft}
                        loading={loading}
                        onSend={sendMessage}
                      />
                    </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LumiAssistant;
