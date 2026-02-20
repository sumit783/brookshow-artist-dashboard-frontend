import { MediaItem } from "../../types";
import { MediaCard } from "./MediaCard";
import { ImageIcon } from "lucide-react";

interface MediaGridProps {
    media: MediaItem[];
    onPreview: (item: MediaItem) => void;
    onDelete: (id: string) => void;
    onStar?: (id: string) => void;
}

export function MediaGrid({ media, onPreview, onDelete, onStar }: MediaGridProps) {
    if (media.length === 0) {
        return (
            <div className="text-center py-20 glass-modern rounded-2xl border-2 border-dashed border-border/50">
                <div className="p-6 rounded-full bg-accent/5 w-fit mx-auto mb-4">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium text-lg">No media uploaded yet</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Upload your best work to showcase it here</p>
            </div>
        );
    }

    return (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
            {media.map((item) => (
                <MediaCard
                    key={item.id}
                    item={item}
                    onPreview={onPreview}
                    onDelete={onDelete}
                    onStar={onStar}
                />
            ))}
        </div>
    );
}
