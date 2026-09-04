import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { Message } from "@/lib/chat";
import { User, Rabbit } from "lucide-react";
import { FileText } from "lucide-react";
import { Attachment } from "@/lib/chat";

export function MessageBlock({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`block-container ${isUser ? "border-muted/30" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
          isUser 
            ? "bg-muted border border-border/50" 
            : "bg-gradient-to-br from-primary to-accent"
        }`}>
          {isUser ? (
            <User className="h-3 w-3 text-muted-foreground" />
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Rabbit className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground tracking-wide">
          {isUser ? "You" : "Anurag"}
        </span>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-auto">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {isUser ? (
        <div className="ml-[34px]">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((file, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-muted-foreground text-xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-foreground leading-relaxed" style={{ fontSize: 15 }}>
            {message.content}
          </p>
        </div>
      ) : (
        <div className="prose-anurag ml-[34px]">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{message.content}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
}
