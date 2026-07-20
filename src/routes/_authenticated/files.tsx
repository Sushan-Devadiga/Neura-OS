import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, ModuleHeader } from "@/components/os/ModulePage";
import { supabase } from "@/integrations/supabase/client";
import { Folder, File as FileIcon, Upload, Trash, Download, HardDrive, Loader2, ChevronRight, FileText, Image as ImageIcon, Video, Music, Archive, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/files")({ component: Page });

type StorageBucket = {
  id: string;
  name: string;
  public: boolean;
};

type FileObject = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: { size: number; mimetype: string };
};

type ViewItem = {
  name: string;
  isFolder: boolean;
  path: string; // full path
  file?: FileObject;
};

function Page() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  
  const [currentPath, setCurrentPath] = useState<string[]>([]); // Empty = root of bucket
  const [items, setItems] = useState<ViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (activeBucket) {
      loadFiles();
    }
  }, [activeBucket, currentPath]);

  const loadBuckets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      setBuckets(data || []);
      if (data && data.length > 0 && !activeBucket) {
        setActiveBucket(data[0].name);
      }
    } catch (err) {
      toast.error("Failed to load storage buckets");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!activeBucket) return;
    setIsLoading(true);
    try {
      const pathString = currentPath.length > 0 ? currentPath.join('/') : '';
      
      const { data, error } = await supabase.storage
        .from(activeBucket)
        .list(pathString, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) throw error;
      
      // Map data to ViewItems
      const mapped: ViewItem[] = (data || []).filter(item => item.name !== '.emptyFolderPlaceholder').map(item => {
        // Supabase returns folders with id null and metadata null
        const isFolder = !item.id; 
        return {
          name: item.name,
          isFolder,
          path: pathString ? `${pathString}/${item.name}` : item.name,
          file: isFolder ? undefined : item
        };
      });
      
      setItems(mapped);
    } catch (err) {
      toast.error("Failed to load files");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBucket) return;

    setIsUploading(true);
    try {
      const prefix = currentPath.length > 0 ? `${currentPath.join('/')}/` : '';
      const filePath = `${prefix}${file.name}`;
      
      const { error } = await supabase.storage
        .from(activeBucket)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;
      toast.success("File uploaded");
      loadFiles();
    } catch (err) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: ViewItem) => {
    if (!activeBucket) return;
    if (!confirm(`Delete ${item.isFolder ? 'folder (and all contents)' : 'file'}?`)) return;
    
    try {
      if (item.isFolder) {
        // To delete a folder, we must delete all contents first
        const { data: contents } = await supabase.storage.from(activeBucket).list(item.path);
        if (contents && contents.length > 0) {
          const paths = contents.map(c => `${item.path}/${c.name}`);
          await supabase.storage.from(activeBucket).remove(paths);
        }
      } else {
        await supabase.storage.from(activeBucket).remove([item.path]);
      }
      toast.success("Deleted successfully");
      loadFiles();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleDownload = async (item: ViewItem) => {
    if (!activeBucket || item.isFolder) return;
    
    try {
      const { data, error } = await supabase.storage
        .from(activeBucket)
        .createSignedUrl(item.path, 60); // 60 seconds
        
      if (error) throw error;
      
      if (data?.signedUrl) {
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      toast.error("Failed to download file");
    }
  };

  const createFolder = () => {
    const name = prompt("Folder name:");
    if (!name || !activeBucket) return;
    
    // Create an empty file to simulate a folder
    const prefix = currentPath.length > 0 ? `${currentPath.join('/')}/` : '';
    const filePath = `${prefix}${name}/.emptyFolderPlaceholder`;
    
    supabase.storage.from(activeBucket).upload(filePath, new Blob([""]), { upsert: true })
      .then(() => {
        toast.success("Folder created");
        loadFiles();
      })
      .catch(() => toast.error("Failed to create folder"));
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "--";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getIcon = (item: ViewItem) => {
    if (item.isFolder) return <Folder className="h-6 w-6 text-ai-purple fill-ai-purple/20" />;
    
    const mime = item.file?.metadata?.mimetype || "";
    if (mime.includes("image")) return <ImageIcon className="h-6 w-6 text-ai-orange" />;
    if (mime.includes("video")) return <Video className="h-6 w-6 text-rose-500" />;
    if (mime.includes("audio")) return <Music className="h-6 w-6 text-ai-green" />;
    if (mime.includes("pdf") || mime.includes("document")) return <FileText className="h-6 w-6 text-ai-cyan" />;
    if (mime.includes("zip") || mime.includes("tar")) return <Archive className="h-6 w-6 text-amber-500" />;
    
    return <FileIcon className="h-6 w-6 text-muted-foreground" />;
  };

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Breadcrumbs logic
  const navigateTo = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };
  
  const navigateHome = () => setCurrentPath([]);

  return (
    <ModulePage>
      <ModuleHeader eyebrow="Files" title="Everything, in one place." description="File manager connected to Supabase storage." hue="ai-purple" />
      
      <div className="mt-8 max-w-6xl mx-auto flex gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar: Buckets */}
        <div className="w-64 shrink-0 space-y-6">
          <div className="bg-surface border border-border/50 rounded-2xl p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-4 px-2">Storage Buckets</h3>
            <div className="space-y-1">
              {buckets.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setActiveBucket(b.name); setCurrentPath([]); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeBucket === b.name ? "bg-ai-purple text-purple-950" : "text-muted-foreground hover:bg-surface-hover"}`}
                >
                  <HardDrive className="h-4 w-4" />
                  {b.name}
                </button>
              ))}
              {buckets.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground px-2 py-4 text-center">No buckets found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-surface border border-border/50 rounded-2xl flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm">
            
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-foreground" onClick={navigateHome}>
                <HardDrive className="h-4 w-4" />
              </Button>
              {currentPath.map((segment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Button variant="ghost" size="sm" className="px-2 font-medium" onClick={() => navigateTo(idx)}>
                    {segment}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-4">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..." 
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8" onClick={createFolder}>
                <Folder className="h-4 w-4 mr-2" /> New Folder
              </Button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
              <Button size="sm" className="h-8 bg-ai-purple hover:bg-ai-purple/90 text-purple-950" onClick={() => fileInputRef.current?.click()} disabled={!activeBucket || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload
              </Button>
            </div>
          </div>

          {/* File Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : !activeBucket ? (
              <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                <HardDrive className="h-12 w-12 opacity-20 mb-4" />
                <p>Select a storage bucket to view files</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                <Folder className="h-12 w-12 opacity-20 mb-4" />
                <p>This folder is empty</p>
                {searchQuery && <p className="text-sm mt-2">No files match your search.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map(item => (
                  <div 
                    key={item.path}
                    className="bg-background border border-border/50 rounded-xl p-4 hover:border-ai-purple/40 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                    onDoubleClick={() => item.isFolder && setCurrentPath([...currentPath, item.name])}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-surface rounded-lg">
                        {getIcon(item)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isFolder && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-ai-purple" onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <h4 className="text-[14px] font-medium truncate text-foreground mb-1" title={item.name}>
                        {item.name}
                      </h4>
                      {item.isFolder ? (
                        <p className="text-[11px] text-muted-foreground">Folder</p>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{formatSize(item.file?.metadata?.size)}</span>
                          {item.file?.updated_at && <span>{formatDistanceToNow(new Date(item.file.updated_at))} ago</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
