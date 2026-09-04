import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Paperclip, X, FileText } from "lucide-react";
import { Attachment } from "@/lib/chat";

interface PromptBarProps {
  onSubmit: (text: string, attachments?: Attachment[]) => void;
  isStreaming: boolean;
}

export function PromptBar({ onSubmit, isStreaming }: PromptBarProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Only support text-based files for now
      if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".json")) {
        const content = await file.text();
        newAttachments.push({
          name: file.name,
          type: file.type,
          content,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = () => {
    if ((!value.trim() && attachments.length === 0) || isStreaming) return;
    onSubmit(value, attachments);
    setValue("");
    setAttachments([]);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <motion.div
      className="sticky bottom-0 w-full max-w-[800px] mx-auto px-6 pb-6 pt-2 relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative group">
        {/* Attachment preview area */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex flex-wrap gap-2 mb-3 px-1"
            >
              {attachments.map((file, i) => (
                <motion.div
                  key={i}
                  layout
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium group/chip"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="ml-1 p-0.5 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow effect behind input */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
        
        <div className="relative glass-card rounded-2xl transition-all duration-300 group-focus-within:border-primary/30 flex items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".txt,.md,.json,text/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="ml-2 mb-2 p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 disabled:opacity-30"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything…"
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none bg-transparent px-5 py-4 text-foreground placeholder:text-muted-foreground/60 text-[15px] leading-relaxed focus:outline-none disabled:opacity-50 rounded-2xl min-h-[56px]"
          />
          
          <div className="p-3">
            <button
              onClick={submit}
              disabled={(!value.trim() && attachments.length === 0) || isStreaming}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:shadow-none"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground/40 mt-2.5">
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/50 text-[10px]">Shift+Enter</kbd>
        {" "}newline · {" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/50 text-[10px]">Enter</kbd>
        {" "}send
      </p>
    </motion.div>
  );
}
