import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/Sidebar";
import { MessageBlock } from "@/components/MessageBlock";
import { ThoughtTrace } from "@/components/ThoughtTrace";
import { PromptBar } from "@/components/PromptBar";
import { Rabbit, Wand2, Brain, Rocket } from "lucide-react";
import { toast } from "sonner";

const suggestions = [
  { icon: Brain, text: "Explain quantum computing simply" },
  { icon: Rocket, text: "Write a marketing strategy for a startup" },
  { icon: Wand2, text: "Generate a creative short story" },
];

const Index = () => {
  const { messages, threads, activeThreadId, isStreaming, error, send, clear, createThread, setActiveThreadId, deleteThread, apiKey, updateApiKey } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="noise-overlay" />
      <Sidebar 
        onNewThread={createThread} 
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onDeleteThread={deleteThread}
        apiKey={apiKey}
        onApiKeyChange={updateApiKey}
      />

      <main className="flex-1 flex flex-col min-w-0 ambient-bg">
        <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-center max-w-lg"
              >
                {/* Animated orb */}
                <motion.div
                  className="relative w-20 h-20 mx-auto mb-8"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-20 blur-xl" />
                  <div className="relative w-20 h-20 rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10"
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      animate={{ 
                        y: [0, -4, 0],
                        filter: ["drop-shadow(0 0 0px hsl(var(--primary)/0))", "drop-shadow(0 0 8px hsl(var(--primary)/0.5))", "drop-shadow(0 0 0px hsl(var(--primary)/0))"]
                      }}
                      transition={{ 
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      <Rabbit className="h-8 w-8 text-primary relative z-10" />
                    </motion.div>
                  </div>
                </motion.div>

                <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
                  What can I help you with?
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-10">
                  Advanced AI reasoning at your fingertips. Ask anything.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      onClick={() => send(s.text)}
                      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                    >
                      <s.icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                      {s.text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-[800px] mx-auto px-6 py-8 space-y-1">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <MessageBlock key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {isStreaming && messages[messages.length - 1]?.role === "user" && (
                  <ThoughtTrace />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <PromptBar onSubmit={send} isStreaming={isStreaming} />
      </main>
    </div>
  );
};

export default Index;
