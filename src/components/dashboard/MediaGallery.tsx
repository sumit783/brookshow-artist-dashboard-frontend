interface MediaGalleryProps {
    media: any[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
    if (!Array.isArray(media) || media.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-primary rounded-full" />
                Media Portfolio
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
                {media.map((m, idx) => {
                    const raw = typeof m?.url === "string" ? m.url : "";
                    const base = import.meta.env.VITE_FILES_BASE_URL as string | undefined;
                    const src = /^https?:\/\//.test(raw) ? raw : `${base || ""}${raw}`;

                    return (
                        <div
                            key={m?._id || idx}
                            className="mb-6 break-inside-avoid rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group ring-1 ring-white/10"
                        >
                            {m?.type === "video" ? (
                                <div className="relative aspect-video">
                                    <video
                                        src={src}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={src}
                                        alt="media"
                                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
