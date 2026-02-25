import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { Artist } from "../../types";

interface WelcomeBannerProps {
    profile: any | null;
    artist: Artist | null;
}

export function WelcomeBanner({ profile, artist: propsArtist }: WelcomeBannerProps) {
    const navigate = useNavigate();
    const artist = profile || propsArtist; // DashboardHome passes mapped artist into profile

    const profileImagePath = artist?.coverImageId || "";
    let imgSrc = "";

    if (profileImagePath) {
        if (/^https?:\/\//.test(profileImagePath)) {
            imgSrc = profileImagePath;
        } else {
            const normalizedPath = profileImagePath.startsWith("/") ? profileImagePath : `/${profileImagePath}`;
            const base = import.meta.env.VITE_FILES_BASE_URL as string | undefined;
            imgSrc = base ? `${base}${normalizedPath}` : normalizedPath;
        }
    }

    const displayName = artist?.displayName || "Artist";

    return (
        <div className="glass-modern p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10 shadow-xl">
                <AvatarImage
                    src={imgSrc}
                    alt={displayName}
                    onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.src = "";
                    }}
                />
                <AvatarFallback className="bg-gradient-primary text-white text-xl">
                    {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Welcome back, {displayName}!
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                    Manage your artist profile, bookings, and media from your dashboard.
                </p>
            </div>

            <div className="w-full sm:w-auto">
                <Button
                    onClick={() => navigate("/edit-profile")}
                    variant="outline"
                    className="w-full sm:w-auto hover-glow transition-all"
                >
                    Edit Profile
                </Button>
            </div>
        </div>
    );
}
