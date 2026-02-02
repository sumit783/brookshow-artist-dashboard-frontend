import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { storage } from "../services/storage";
import { syncQueue } from "../services/syncQueue";
import { MediaItem } from "../types";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Upload, Trash2, Star, Image as ImageIcon, Eye } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { config } from "../config";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function Media() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const { toast } = useToast();
  const filesBase = ((import.meta.env.VITE_FILES_BASE_URL as string) || config.apiBaseUrl || "")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

  useEffect(() => {
    loadMedia();
  }, [user]);

  const loadMedia = async () => {
    setLoading(true);

    try {
      // Load from local storage first
      const cached = await storage.getAllItems<MediaItem>("media");
      if (cached.length > 0) {
        setMedia(cached.sort((a, b) => a.order - b.order));
      }

      // Fetch from Backend: GET /artist/profile/media
      const token = localStorage.getItem("auth_token");
      if(!token) {
        setMedia([]);
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }
      if (!config.apiBaseUrl) {
        toast({ title: "Config error", description: "API base URL is not configured", variant: "destructive" });
        setLoading(false);
        return;
      }
      const base = (config.apiBaseUrl || "").replace(/\/$/, "");
      const resp = await axios.get(`${base}/artist/profile/media`, {
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { "x_api_key": config.apiKey, "x-api-key": config.apiKey } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const payload = resp.data;
      
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const mapped: MediaItem[] = items.map((it: any, idx: number) => {
        const rawUrl = typeof it?.url === "string"
          ? (/^https?:\/\//.test(it.url) ? it.url : `${filesBase}${it.url}`)
          : "";
        const absoluteUrl = rawUrl
          ? `${rawUrl}${it?.updatedAt ? `?t=${encodeURIComponent(it.updatedAt)}` : ""}`
          : "";
        const fileName = absoluteUrl ? absoluteUrl.split("/").pop() || "media" : "media";
        return {
          id: String(it?._id || `media-${idx}`),
          artistId: String(it?.ownerId || user?.artistId || ""),
          type: it?.type === "video" ? "video" : "image",
          url: absoluteUrl,
          fileName,
          order: idx,
          uploadedAt: String(it?.createdAt || new Date().toISOString()),
        } as MediaItem;
      });
      setMedia(mapped);

      // Update cache with latest server items
      for (const item of mapped) {
        await storage.setItem("media", item.id, item);
      }
    } catch (error: any) {
      console.error("Failed to load media:", error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || "Failed to load media";
      if (status === 401 || status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      if (!navigator.onLine) {
        window.dispatchEvent(new Event("network-issue"));
      }
      toast({ title: "Error", description: String(message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const uploadToServer = async (files: FileList | null) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: `"${files[i].name}" exceeds the 5MB limit.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setUploading(true);
      const token = localStorage.getItem("auth_token");
      const base = (config.apiBaseUrl || "").replace(/\/$/, "");
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          form.append("photos", file);
        } else if (file.type.startsWith("video/")) {
          form.append("videos", file);
        }
      }
      const resp = await axios.post(`${base}/artist/profile/media`, form, {
        headers: {
          ...(config.apiKey ? { "x_api_key": config.apiKey, "x-api-key": config.apiKey } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      // Parse backend JSON: { message, items: [...] }
      const payload: any = resp.data;
      const uploadedItems = Array.isArray(payload?.items) ? payload.items : [];
      const mapped: MediaItem[] = uploadedItems.map((it: any, idx: number) => {
        const rawUrl = typeof it?.url === "string"
          ? (/^https?:\/\//.test(it.url) ? it.url : `${filesBase}${it.url}`)
          : "";
        const absoluteUrl = rawUrl
          ? `${rawUrl}${it?.updatedAt ? `?t=${encodeURIComponent(it.updatedAt)}` : ""}`
          : "";
        const fileName = absoluteUrl ? absoluteUrl.split("/").pop() || "media" : "media";
        return {
          id: String(it?._id || `media-${Date.now()}-${idx}`),
          artistId: user!.artistId!,
          type: it?.type === "video" ? "video" : "image",
          url: absoluteUrl,
          fileName,
          order: media.length + idx,
          uploadedAt: String(it?.createdAt || new Date().toISOString()),
        } as MediaItem;
      });
      if (mapped.length > 0) {
        setMedia((prev) => [...prev, ...mapped]);
        for (const item of mapped) {
          await storage.setItem("media", item.id, item);
        }
      } else {
        // Fallback: refresh from server
        await loadMedia();
      }
      toast({ title: "Uploaded", description: String(payload?.message || "Files uploaded to server") });
    } catch (error) {
      console.error("Server upload failed:", error);
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "", variant: "destructive" });
    } finally {
      setUploading(false);
      const input = document.getElementById("server-file-input") as HTMLInputElement | null;
      if (input) input.value = ""; // allow selecting the same files again
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setMedia((prev) => prev.filter((item) => item.id !== id));
      await storage.removeItem("media", id);
      await syncQueue.enqueue({
        action: "delete",
        entity: "media",
        data: { id },
      });

      toast({
        title: "Media deleted",
        description: "File removed successfully",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadToServer(e.dataTransfer.files);
  }, [media, user]);

  if (loading) {
    return <div className="animate-pulse">Loading media...</div>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold">Media</h1>
        <p className="text-muted-foreground">Manage your portfolio images and videos</p>
      </div>

      {/* Upload Area */}
      {/* <div className="flex items-center gap-2">
        <Button onClick={() => document.getElementById("server-file-input")?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload to Server"}
        </Button>
        <input
          id="server-file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          aria-label="Upload media files to server"
          onChange={(e) => uploadToServer(e.target.files)}
          disabled={uploading}
        />
      </div> */}

      <Card
        className="border-2 p-6 border-dashed text-center cursor-pointer hover:border-primary transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          aria-label="Select media files"
          onChange={(e) => uploadToServer(e.target.files)}
          disabled={uploading}
        />
        
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {uploading ? "Uploading..." : "Upload Media"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Max size: 5MB • Supports: Images (JPG, PNG, GIF) and Videos (MP4, MOV)
        </p>
      </Card>

      {/* Media Masonry Grid */}
      {media.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No media uploaded yet</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          {media.map((item) => (
            <Card key={item.id} className="mb-4 break-inside-avoid overflow-hidden group relative">
              <div className="relative">
                {item.type === "image" ? (
                  <img
                    src={item.dataUrl || item.url}
                    alt={item.fileName}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.dataUrl || item.url}
                    className="w-full h-auto object-cover"
                    controls={false}
                  />
                )}

                {item.syncStatus === "pending" && (
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    Syncing...
                  </Badge>
                )}

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      setPreviewItem(item);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-[70%]" title={item.fileName}>{item.fileName}</span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {item.type === "video" ? "Video" : "Image"}
                  </Badge>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewItem?.fileName || "Preview"}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-full object-contain">
            {previewItem?.type === "video" ? (
              <video src={previewItem.url} className="w-full h-auto object-contain" controls />
            ) : (
              <img src={previewItem?.url} alt={previewItem?.fileName} className="w-full h-auto object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
