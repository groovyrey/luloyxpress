import fs from "fs/promises";
import path from "path";
import Markdown from "@/components/Markdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function DocsPage() {
  const systemDocs = await fs.readFile(path.join(process.cwd(), "SYSTEM.md"), "utf-8");
  const dbDocs = await fs.readFile(path.join(process.cwd(), "DATABASE.md"), "utf-8");

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12">
          <h1 className="text-5xl font-black tracking-tight text-black mb-4">Documentation</h1>
          <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed">
            Technical overview and database architecture of the LuloyXpress platform.
          </p>
        </header>
        
        <Tabs defaultValue="system">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-zinc-100 p-1 rounded-2xl">
              <TabsTrigger 
                value="system" 
                className="px-8 py-3 rounded-xl text-sm font-bold transition-all data-[active]:bg-white data-[active]:text-blue-600 data-[active]:shadow-sm"
              >
                System Overview
              </TabsTrigger>
              <TabsTrigger 
                value="database" 
                className="px-8 py-3 rounded-xl text-sm font-bold transition-all data-[active]:bg-white data-[active]:text-blue-600 data-[active]:shadow-sm"
              >
                Database Schema
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="system" className="markdown-container">
            <Markdown>{systemDocs}</Markdown>
          </TabsContent>
          
          <TabsContent value="database" className="markdown-container">
            <Markdown>{dbDocs}</Markdown>
          </TabsContent>
        </Tabs>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .markdown-container {
          color: #3f3f46;
          line-height: 1.75;
          font-size: 1.0625rem;
        }
        .markdown-container h1 { font-size: 2.5rem; font-weight: 900; margin-top: 3rem; margin-bottom: 1.5rem; color: #000; letter-spacing: -0.05em; line-height: 1.1; }
        .markdown-container h2 { font-size: 1.875rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1rem; color: #000; border-bottom: 2px solid #f4f4f5; padding-bottom: 0.5rem; letter-spacing: -0.02em; }
        .markdown-container h3 { font-size: 1.375rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; color: #18181b; }
        .markdown-container p { margin-bottom: 1.25rem; }
        .markdown-container ul, .markdown-container ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .markdown-container ul { list-style-type: disc; }
        .markdown-container ol { list-style-type: decimal; }
        .markdown-container li { margin-bottom: 0.5rem; }
        .markdown-container li > p { margin-bottom: 0.5rem; }
        .markdown-container a { color: #2563eb; text-decoration: underline; text-underline-offset: 4px; font-weight: 600; }
        .markdown-container a:hover { color: #1d4ed8; }
        .markdown-container blockquote { border-left: 4px solid #e4e4e7; padding-left: 1.25rem; italic: true; color: #71717a; margin-bottom: 1.5rem; }
        .markdown-container hr { border: 0; border-top: 2px solid #f4f4f5; margin: 3rem 0; }
        .markdown-container strong { color: #18181b; font-weight: 700; }
      `}} />
    </div>
  );
}
