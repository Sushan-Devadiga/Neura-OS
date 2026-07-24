import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@monaco-editor/react";
import { Folder, FileText, ChevronRight, ChevronDown, TerminalSquare, Bot, Code2, Loader2, Sparkles, Send } from "lucide-react";
import { apiFetch } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/ide")({ component: Page });

type FileNode = {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
};

function FileTreeItem({ node, depth = 0, onFileSelect, selectedPath }: { node: FileNode, depth?: number, onFileSelect: (path: string) => void, selectedPath: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (node.is_dir) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-surface transition-colors select-none ${isSelected ? 'bg-surface/80 text-ai-pink' : 'text-muted-foreground hover:text-foreground'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.is_dir ? (
          <span className="mr-1 text-muted-foreground/70">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-4 h-4 mr-1 inline-block" />
        )}
        
        {node.is_dir ? (
          <Folder className={`w-4 h-4 mr-2 ${isOpen ? 'text-ai-blue' : 'text-muted-foreground'}`} />
        ) : (
          <FileText className={`w-4 h-4 mr-2 ${isSelected ? 'text-ai-pink' : 'text-muted-foreground'}`} />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {node.is_dir && isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map((child, i) => (
            <FileTreeItem key={i} node={child} depth={depth + 1} onFileSelect={onFileSelect} selectedPath={selectedPath} />
          ))}
        </div>
      )}
    </div>
  );
}

function Page() {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("// Select a file to edit\n");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"chat" | "terminal">("chat");

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: "user" | "assistant", content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const tree = await apiFetch("/ide/files");
        setFileTree(tree);
      } catch (err) {
        console.error("Failed to fetch file tree", err);
      } finally {
        setIsLoadingTree(false);
      }
    };
    fetchTree();
  }, []);

  const handleFileSelect = async (path: string) => {
    setSelectedPath(path);
    setIsLoadingFile(true);
    try {
      const data = await apiFetch(`/ide/read?path=${encodeURIComponent(path)}`);
      setFileContent(data.content);
    } catch (err) {
      console.error("Failed to read file", err);
      setFileContent("// Error loading file");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const getLanguageFromPath = (path: string | null) => {
    if (!path) return "javascript";
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".py")) return "python";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".html")) return "html";
    return "javascript";
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;
    
    const userMessage = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setIsChatting(true);
    
    try {
      const response = await apiFetch("/ide/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          file_path: selectedPath,
          file_content: selectedPath ? fileContent : null,
        }),
      });
      setChatHistory(prev => [...prev, { role: "assistant", content: response.response }]);
    } catch (err) {
      console.error("Chat error", err);
      setChatHistory(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <ModulePage>
      <ModuleHeader eyebrow="AI IDE" title="Code, with your second brain." description="Editor with AI completions, refactors, and agent runs." hue="ai-pink" />
      
      <div className="mt-6 flex-1 max-h-[calc(100vh-220px)] min-h-[calc(100vh-220px)] border border-border/50 bg-background rounded-2xl overflow-hidden shadow-sm flex flex-col">
        
        {/* IDE Topbar */}
        <div className="h-10 border-b border-border/50 bg-surface flex items-center px-4 shrink-0">
          <div className="flex items-center text-xs font-medium text-muted-foreground space-x-2">
            <Code2 className="w-4 h-4 text-ai-pink mr-1" />
            <span>NeuraOS Workspace</span>
            {selectedPath && (
              <>
                <ChevronRight className="w-3.5 h-3.5 mx-1 opacity-50" />
                <span className="text-foreground">{selectedPath.split("\\").pop()}</span>
              </>
            )}
          </div>
        </div>

        {/* IDE Layout */}
        <div className="flex-1 grid grid-cols-[250px_1fr_300px] w-full min-h-0 overflow-hidden divide-x divide-border/50">
          
          {/* Sidebar: File Explorer */}
          <div className="h-full flex flex-col bg-surface/30 overflow-hidden">
            <div className="h-8 flex items-center px-4 border-b border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
              Explorer
            </div>
            <ScrollArea className="flex-1">
              <div className="py-2">
                {isLoadingTree ? (
                  <div className="flex items-center justify-center p-4 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  fileTree.map((node, i) => (
                    <FileTreeItem key={i} node={node} onFileSelect={handleFileSelect} selectedPath={selectedPath} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center: Editor */}
          <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
            <div className="h-9 flex items-center bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto shrink-0">
              {selectedPath && (
                <div className="h-full flex items-center px-4 bg-[#1e1e1e] border-t-2 border-ai-pink text-xs text-[#cccccc] cursor-pointer whitespace-nowrap">
                  {selectedPath.split("\\").pop()}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              {isLoadingFile && (
                <div className="absolute inset-0 z-10 bg-[#1e1e1e]/80 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-ai-pink mb-2" />
                  <span className="text-xs text-[#cccccc]">Loading file...</span>
                </div>
              )}
              <div className="absolute inset-0">
                <Editor
                  height="100%"
                  width="100%"
                  language={getLanguageFromPath(selectedPath)}
                  theme="vs-dark"
                  value={fileContent}
                  onChange={(val) => setFileContent(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: AI Chat / Terminal */}
          <div className="h-full flex flex-col bg-surface/30 overflow-hidden">
            <div className="h-10 flex items-center border-b border-border/50 shrink-0">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 h-full flex items-center justify-center text-xs font-medium transition-colors border-b-2 ${activeTab === "chat" ? "border-ai-pink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Agent
              </button>
              <button
                onClick={() => setActiveTab("terminal")}
                className={`flex-1 h-full flex items-center justify-center text-xs font-medium transition-colors border-b-2 ${activeTab === "terminal" ? "border-ai-pink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <TerminalSquare className="w-4 h-4 mr-2" />
                Terminal
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "chat" ? (
                <div className="h-full flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      <div className="bg-ai-pink/10 border border-ai-pink/20 rounded-xl p-3 text-sm">
                        <p className="text-foreground flex items-center mb-1">
                          <Sparkles className="w-4 h-4 text-ai-pink mr-2" />
                          <strong>NeuraOS Copilot</strong>
                        </p>
                        <p className="text-muted-foreground">
                          I'm connected to your codebase. Ask me to refactor code, explain functions, or write new features.
                        </p>
                      </div>
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-surface border border-border/50 ml-6' : 'bg-transparent mr-6'}`}>
                          {msg.role === 'assistant' && (
                            <p className="text-foreground flex items-center mb-1 text-xs font-bold uppercase text-ai-pink">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Copilot
                            </p>
                          )}
                          <div className="text-muted-foreground whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ))}
                      {isChatting && (
                        <div className="p-3">
                          <Loader2 className="w-4 h-4 animate-spin text-ai-pink" />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t border-border/50 bg-background">
                    <div className="relative">
                      <Input 
                        placeholder="Ask AI about this code..." 
                        className="w-full bg-surface border-border/50 pr-10"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendChat();
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-1 top-1 h-7 w-7 text-ai-pink hover:bg-ai-pink/10 hover:text-ai-pink"
                        onClick={handleSendChat}
                        disabled={isChatting || !chatInput.trim()}
                      >
                        {isChatting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-black p-4 font-mono text-xs text-green-400 overflow-y-auto">
                  <p className="mb-2 text-gray-400">NeuraOS Embedded Terminal</p>
                  <p className="mb-1">$ uvicorn main:app --reload</p>
                  <p className="mb-1 text-gray-300">INFO:     Will watch for changes in these directories: ['C:\\Users\\Susha\\Desktop\\Neura-OS\\backend']</p>
                  <p className="mb-1 text-gray-300">INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)</p>
                  <p className="mb-1 text-gray-300">INFO:     Started reloader process [12345] using StatReload</p>
                  <p className="mt-4 flex items-center">
                    <span className="text-blue-400 mr-2">C:\Users\Susha\Desktop\Neura-OS\backend{'>'}</span>
                    <span className="w-2 h-4 bg-gray-400 animate-pulse inline-block" />
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ModulePage>
  );
}
