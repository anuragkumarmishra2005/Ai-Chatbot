export type Attachment = {
  name: string;
  type: string;
  content: string; // Base64 or raw text
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
};

export type Thread = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
};

const STORAGE_KEY = "anurag_chat_threads";

export function saveThreads(threads: Thread[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function loadThreads(): Thread[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const raw = JSON.parse(saved);
    return raw.map((t: any) => ({
      ...t,
      updatedAt: new Date(t.updatedAt),
      messages: t.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch (e) {
    console.error("Failed to load threads", e);
    return [];
  }
}

export async function directStreamGroq({
  messages,
  apiKey,
  onDelta,
  onDone,
}: {
  messages: Pick<Message, "role" | "content">[];
  apiKey: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

  // Map messages to Groq API compatible format
  const mappedMessages = messages.map(m => ({
    role: m.role,
    content: m.content || " ", // Prevent empty content crash
  }));

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b", // Switched from llama-3.1-8b-instant due to access limits
      messages: mappedMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (resp.status === 401) throw new Error("Invalid API key. Please verify your Groq API key.");
    const errorBody = await resp.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Groq API Error: ${resp.status}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No response body from Groq");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (dataStr === "[DONE]") {
        break; // Stream finished cleanly
      }
      
      try {
        const data = JSON.parse(dataStr);
        const chunk = data.choices?.[0]?.delta?.content;
        if (chunk) onDelta(chunk);
      } catch (e) {
        // Ignore single chunk parsing errors
      }
    }
  }

  onDone();
}

export function saveApiKey(key: string) {
  localStorage.setItem("groq_api_key", key);
}

export function getApiKey(): string | null {
  return localStorage.getItem("groq_api_key");
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Pick<Message, "role" | "content">[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  throw new Error("Supabase Edge Function has been decommissioned.");
}
