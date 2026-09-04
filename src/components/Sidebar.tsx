import { motion, AnimatePresence } from "framer-motion";
import { Rabbit, Plus, MessageSquare, Trash2, Key, ChevronDown, ChevronUp } from "lucide-react";
import { Thread } from "@/lib/chat";
import { useState } from "react";

interface SidebarProps {
  onNewThread: () => void;
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  apiKey?: string | null;
  onApiKeyChange?: (key: string) => void;
}

export function Sidebar({ 
  onNewThread, 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onDeleteThread,
  apiKey,
  onApiKeyChange
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="w-72 border-r bg-card/50 flex flex-col relative z-20">
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center relative group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          >
            <Rabbit className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="font-semibold text-lg tracking-tight text-foreground">Anurag</span>
        </div>

        <button
          onClick={onNewThread}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/10 active:scale-[0.98] mb-6"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium text-sm">New thread</span>
        </button>

        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 custom-scrollbar">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeThreadId === thread.id 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              onClick={() => onSelectThread(thread.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{thread.title || "New thread"}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-border/50 bg-muted/20">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="font-medium">API Settings</span>
          </div>
          {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 px-1 pb-2 space-y-3">
                <input
                  type="password"
                  placeholder="Paste Gemini API Key..."
                  value={apiKey || ""}
                  onChange={(e) => onApiKeyChange?.(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
                <p className="text-[10px] text-muted-foreground/60 px-1 leading-relaxed">
                  Get a free key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>. Using a key bypasses the server.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
