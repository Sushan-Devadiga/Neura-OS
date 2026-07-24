import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Search, ArrowRight, Loader2, AlignLeft, Bookmark, ExternalLink } from "lucide-react";
import { apiFetch } from "@/api/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SearchResultItem = {
  title: string;
  url: string;
  snippet: string;
  icon?: string;
};

type FetchResponse = {
  title: string;
  content: string;
  url: string;
  is_search: boolean;
  search_results: SearchResultItem[];
};

export const Route = createFileRoute("/_authenticated/browser")({ component: Page });

function Page() {
  const [urlInput, setUrlInput] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [viewMode, setViewMode] = useState<"web" | "reader">("reader");
  const [isLoading, setIsLoading] = useState(false);
  const [isClipping, setIsClipping] = useState(false);
  const [readerData, setReaderData] = useState<FetchResponse | null>(null);

  const getProjectId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    let { data: projects, error: projectsError } = await supabase.from("projects").select("id").limit(1);
    if (projectsError) throw projectsError;
    
    let projectId = projects?.[0]?.id;
    if (!projectId) {
      const { data: newProject, error: createProjectError } = await supabase
        .from("projects")
        .insert({ name: "Personal", user_id: session.user.id })
        .select("id")
        .single();
        
      if (createProjectError) throw createProjectError;
      projectId = newProject.id;
    }
    return projectId;
  };

  const handleNavigate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    let target = urlInput.trim();
    if (!target) return;
    
    // If it doesn't look like a URL, do a DuckDuckGo search
    if (!target.includes(".") || target.includes(" ")) {
      target = `https://duckduckgo.com/html/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith("http")) {
      target = `https://${target}`;
    }

    setCurrentUrl(target);
    
    if (viewMode === "reader") {
      fetchReaderView(target);
    }
  };

  const fetchReaderView = async (targetUrl: string) => {
    setIsLoading(true);
    try {
      const resp = await apiFetch(`/browser/fetch?url=${encodeURIComponent(targetUrl)}`);
      setReaderData(resp);
    } catch (err) {
      toast.error("Failed to extract reader view. Some sites block extraction.");
      // Fallback to web view if reader fails
      setViewMode("web");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    if (viewMode === "web") {
      setViewMode("reader");
      if (currentUrl && (!readerData || readerData.url !== currentUrl)) {
        fetchReaderView(currentUrl);
      }
    } else {
      setViewMode("web");
    }
  };

  const clipToMemory = async () => {
    if (!readerData || (!readerData.content && !readerData.is_search)) {
      toast.error("Nothing to clip! Switch to reader view and load a page first.");
      return;
    }

    setIsClipping(true);
    try {
      const projectId = await getProjectId();
      
      let memoryContent = "";
      if (readerData.is_search) {
         memoryContent = `Search results for: ${currentUrl}\n\n` + readerData.search_results.map(r => `${r.title}\n${r.url}`).join("\n\n");
      } else {
         memoryContent = `Clipped from ${readerData.url} (${readerData.title}):\n\n${readerData.content.substring(0, 3000)}`;
      }
      
      await apiFetch("/memories", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          content: memoryContent,
          importance: "medium",
          category: "fact"
        })
      });
      toast.success("Page clipped to Memory successfully!");
    } catch (err) {
      toast.error("Failed to clip page to memory.");
    } finally {
      setIsClipping(false);
    }
  };

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Browser" title="Web-aware AI." description="Browse and capture pages directly into your memory." hue="ai-pink" />
      
      <div className="mt-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-220px)] border border-border/50 bg-surface/30 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Browser Top Bar */}
        <div className="h-14 bg-surface border-b border-border/50 flex items-center px-4 gap-3 shrink-0">
          <div className="flex bg-background border border-border/50 rounded-lg p-1">
            <button 
              onClick={() => { setViewMode("web"); if(currentUrl && viewMode !== "web") setViewMode("web"); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "web" ? "bg-ai-pink text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Globe className="h-3.5 w-3.5 inline-block mr-1.5 mb-0.5" />
              Web
            </button>
            <button 
              onClick={toggleView}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === "reader" ? "bg-ai-pink text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <AlignLeft className="h-3.5 w-3.5 inline-block mr-1.5 mb-0.5" />
              Reader
            </button>
          </div>

          <form onSubmit={handleNavigate} className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter a URL or search the web..." 
              className="w-full pl-9 h-9 bg-background border-border/50 rounded-lg text-sm"
            />
          </form>
          
          <Button size="sm" onClick={handleNavigate} variant="outline" className="h-9">
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1"></div>

          <Button 
            size="sm" 
            onClick={clipToMemory} 
            disabled={isClipping || viewMode !== "reader" || !readerData}
            className="h-9 bg-ai-pink hover:bg-ai-pink/90 text-white shadow-sm"
          >
            {isClipping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
            Clip to Memory
          </Button>
        </div>

        {/* Browser Content Area */}
        <div className="flex-1 overflow-hidden relative bg-background/50">
          {!currentUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <div className="h-16 w-16 bg-surface border border-border/50 rounded-2xl flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-ai-pink" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Ready to explore</h3>
              <p className="text-sm max-w-md">
                Search the web or enter a URL. Use Reader View to extract clean text and instantly clip important information to your AI's memory.
              </p>
            </div>
          ) : viewMode === "web" ? (
            <iframe 
              src={currentUrl} 
              className="w-full h-full border-0 bg-white"
              title="Browser View"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          ) : (
            <div className="w-full h-full overflow-y-auto p-8 md:p-12">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-ai-pink" />
                  <p className="text-sm">Extracting reader view...</p>
                </div>
              ) : readerData ? (
                <div className="max-w-3xl mx-auto pb-12">
                  {readerData.is_search ? (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold text-foreground mb-8">Search Results</h1>
                      {readerData.search_results.map((res, idx) => (
                        <div key={idx} className="bg-surface border border-border/50 rounded-2xl p-5 hover:border-border transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            {res.icon ? (
                              <img src={res.icon} alt="" className="w-6 h-6 rounded-md bg-white object-contain p-0.5" />
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-border flex items-center justify-center">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs text-foreground font-medium truncate">{res.title.split('-')[0].trim()}</span>
                              <span className="text-[11px] text-muted-foreground truncate">{res.url}</span>
                            </div>
                          </div>
                          <a href={res.url} target="_blank" rel="noreferrer" className="block text-xl text-ai-pink font-semibold hover:underline mb-2">
                            {res.title}
                          </a>
                          <p className="text-[14px] text-muted-foreground leading-relaxed">
                            {res.snippet}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-foreground mb-4">{readerData.title}</h1>
                      <a href={readerData.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-ai-pink hover:underline mb-8">
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        {readerData.url}
                      </a>
                      <div className="prose prose-invert prose-p:text-muted-foreground prose-a:text-ai-pink prose-a:no-underline hover:prose-a:underline prose-h3:text-ai-pink prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-1 prose-h3:mt-0 prose-hr:border-border/50 prose-hr:my-6 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {readerData.content}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
