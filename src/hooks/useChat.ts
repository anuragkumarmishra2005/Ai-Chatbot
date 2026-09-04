import { useState, useCallback, useEffect, useMemo } from "react";
import { Message, Thread, Attachment, streamChat, directStreamGroq, saveThreads as persistThreads, loadThreads, getApiKey, saveApiKey } from "@/lib/chat";

const ENV_GROQ_KEY = (import.meta.env.VITE_GROQ_API_KEY as string) || null;

export function useChat() {
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const saved = loadThreads();
    return saved.length > 0 ? saved[0].id : null;
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => getApiKey());

  const updateApiKey = useCallback((key: string) => {
    saveApiKey(key);
    setApiKey(key);
  }, []);

  useEffect(() => {
    console.log("Chat initialized with threads:", threads.length);
  }, []);

  const activeThread = useMemo(() => 
    threads.find(t => t.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  const messages = useMemo(() => activeThread?.messages || [], [activeThread]);

  useEffect(() => {
    persistThreads(threads);
  }, [threads]);

  const createThread = useCallback(() => {
    const newThread: Thread = {
      id: crypto.randomUUID(),
      title: "New conversation",
      messages: [],
      updatedAt: new Date(),
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    return newThread.id;
  }, []);

  const deleteThread = useCallback((id: string) => {
    setThreads(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeThreadId === id) {
        setActiveThreadId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeThreadId]);

  const send = useCallback(async (input: string, attachments?: Attachment[]) => {
    console.log("Sending message...", { input: input.slice(0, 20), attachmentsCount: attachments?.length });
    if ((!input.trim() && (!attachments || attachments.length === 0)) || isStreaming) {
      console.warn("Send blocked: empty input or already streaming");
      return;
    }
    setError(null);

    let threadId = activeThreadId;
    if (!threadId) {
      threadId = createThread();
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      attachments,
    };

    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        const title = t.messages.length === 0 ? (input.trim().slice(0, 40) || attachments?.[0]?.name || "Attachment") : t.title;
        return {
          ...t,
          title,
          updatedAt: new Date(),
          messages: [...t.messages, userMsg],
        };
      }
      return t;
    }));

    setIsStreaming(true);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          const last = t.messages[t.messages.length - 1];
          const newMessages = last?.id === assistantId
            ? t.messages.map((m, i) => i === t.messages.length - 1 ? { ...m, content: assistantContent } : m)
            : [...t.messages, { id: assistantId, role: "assistant" as const, content: assistantContent, timestamp: new Date() }];
          
          return { ...t, messages: newMessages, updatedAt: new Date() };
        }
        return t;
      }));
    };

    try {
      const currentMessages = threads.find(t => t.id === threadId)?.messages || [];
      const history = [...currentMessages, userMsg].map(({ role, content, attachments: msgAttachments }) => {
        let finalContent = content;
        if (msgAttachments && msgAttachments.length > 0) {
          const attachmentsContent = msgAttachments.map(a => `[File Attachment: ${a.name}]\n${a.content}`).join("\n\n");
          finalContent = `${finalContent || "Discussing attachments:"}\n\nAttachments:\n${attachmentsContent}`;
        }
        return { role, content: finalContent };
      });
      const resolvedKey = ENV_GROQ_KEY || apiKey;
      if (resolvedKey) {
        await directStreamGroq({
          messages: history,
          apiKey: resolvedKey,
          onDelta: upsert,
          onDone: () => setIsStreaming(false),
        });
      } else {
        await streamChat({
          messages: history,
          onDelta: upsert,
          onDone: () => setIsStreaming(false),
        });
      }
    } catch (e) {
      setIsStreaming(false);
      setError(e instanceof Error ? e.message : "An error occurred");
    }
  }, [threads, activeThreadId, isStreaming, createThread]);

  const clear = useCallback(() => {
    if (activeThreadId) {
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: [], updatedAt: new Date() } : t));
    }
    setError(null);
  }, [activeThreadId]);

  return { 
    messages, 
    threads, 
    activeThreadId, 
    isStreaming, 
    error, 
    send, 
    clear, 
    createThread, 
    setActiveThreadId, 
    deleteThread,
    apiKey,
    updateApiKey
  };
}
