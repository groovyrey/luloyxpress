"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { cn } from "@/lib/utils";

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="pre"
              customStyle={{
                margin: "1.5rem 0",
                borderRadius: "1rem",
                padding: "1.5rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code 
              className={cn(
                "bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] font-semibold", 
                className
              )} 
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
