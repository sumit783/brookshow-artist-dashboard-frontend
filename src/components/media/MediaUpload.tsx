import { useCallback } from "react";
import { Card } from "../ui/card";
import { Upload } from "lucide-react";

interface MediaUploadProps {
    onUpload: (files: FileList | null) => void;
    uploading: boolean;
}

export function MediaUpload({ onUpload, uploading }: MediaUploadProps) {
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onUpload(e.dataTransfer.files);
    }, [onUpload]);

    return (
        <Card
            className="border-2 p-10 border-dashed text-center cursor-pointer hover:border-primary transition-all duration-300 bg-accent/5 group hover:bg-accent/10"
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
                onChange={(e) => onUpload(e.target.files)}
                disabled={uploading}
            />

            <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-10 w-10 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-1">
                        {uploading ? "Uploading..." : "Upload Media"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Drag and drop files here, or click to browse from your device
                    </p>
                </div>
                <div className="flex gap-4 text-xs font-medium text-muted-foreground bg-background/50 px-4 py-2 rounded-full border border-border/50">
                    <span>Max size: 100MB</span>
                    <span className="w-px h-3 bg-border" />
                    <span>Images & Videos</span>
                </div>
            </div>
        </Card>
    );
}
