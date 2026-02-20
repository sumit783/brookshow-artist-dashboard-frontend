import { MediaItem } from "../../types";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trash2, Star, Eye } from "lucide-react";

interface MediaCardProps {
    item: MediaItem;
    onPreview: (item: MediaItem) => void;
    onDelete: (id: string) => void;
    onStar?: (id: string) => void;
}

export function MediaCard({ item, onPreview, onDelete, onStar }: MediaCardProps) {
    return (
        <Card className="mb-4 break-inside-avoid overflow-hidden group relative glass-modern border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
            <div className="relative aspect-auto">
                {item.type === "image" ? (
                    <img
                        src={item.dataUrl || item.url}
                        alt={item.fileName}
                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="relative">
                        <video
                            src={item.dataUrl || item.url}
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                            controls={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                            </div>
                        </div>
                    </div>
                )}

                {item.syncStatus === "pending" && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500/80 backdrop-blur-md border-0" variant="secondary">
                        Syncing...
                    </Badge>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white"
                        onClick={() => onPreview(item)}
                    >
                        <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="secondary"
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-red-500/40 text-white hover:text-red-200"
                        onClick={() => onDelete(item.id)}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="secondary"
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-yellow-500/40 text-white hover:text-yellow-200"
                        onClick={() => onStar?.(item.id)}
                    >
                        <Star className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="p-3 flex items-center justify-between text-xs font-medium">
                <span className="truncate max-w-[70%] text-muted-foreground" title={item.fileName}>
                    {item.fileName}
                </span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/20 bg-primary/5 text-primary">
                    {item.type === "video" ? "Video" : "Image"}
                </Badge>
            </div>
        </Card>
    );
}
