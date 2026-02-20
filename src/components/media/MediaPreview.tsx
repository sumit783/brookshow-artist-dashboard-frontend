import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { MediaItem } from "../../types";

interface MediaPreviewProps {
    open: boolean;
    item: MediaItem | null;
    onOpenChange: (open: boolean) => void;
}

export function MediaPreview({ open, item, onOpenChange }: MediaPreviewProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden p-0 border-0 glass-modern">
                <div className="flex flex-col h-full bg-black/95">
                    <DialogHeader className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-md z-10">
                        <DialogTitle className="text-white font-medium truncate">
                            {item?.fileName || "Preview"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                        {item?.type === "video" ? (
                            <video
                                src={item.url}
                                className="max-w-full max-h-full rounded-lg shadow-2xl"
                                controls
                                autoPlay
                            />
                        ) : (
                            <img
                                src={item?.url}
                                alt={item?.fileName}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
