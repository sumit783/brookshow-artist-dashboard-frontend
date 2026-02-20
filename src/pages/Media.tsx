import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { storage } from "../services/storage";
import { syncQueue } from "../services/syncQueue";
import { MediaItem } from "../types";
import { useToast } from "../hooks/use-toast";
import { config } from "../config";
import { useNavigate } from "react-router-dom";
import { MediaUpload } from "../components/media/MediaUpload";
import { MediaGrid } from "../components/media/MediaGrid";
import { MediaPreview } from "../components/media/MediaPreview";

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
      if (!token) {
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
    if (!files) return;

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_SIZE) {
        toast({
          title: "File too large",
          description: `"${files[i].name}" exceeds the 100MB limit.`,
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
      const input = document.getElementById("file-input") as HTMLInputElement | null;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading your media portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-slide-up">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Media</h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your portfolio images and videos</p>
      </div>

      {/* Upload Area */}
      <MediaUpload onUpload={uploadToServer} uploading={uploading} />

      {/* Media Masonry Grid */}
      <MediaGrid
        media={media}
        onPreview={(item) => {
          setPreviewItem(item);
          setPreviewOpen(true);
        }}
        onDelete={handleDelete}
      />

      <MediaPreview
        open={previewOpen}
        item={previewItem}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
