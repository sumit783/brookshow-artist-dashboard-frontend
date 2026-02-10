import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { Artist } from "../types";
import { User, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { config } from "../config";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const navigate = useNavigate();
  
  // Compute a base URL for static files (strip trailing / and optional /api)
  const profileImagePath = profile?.profileImage || ""; // e.g. "/uploads/1762....png"
  const normalizedPath =
    profileImagePath.startsWith("/") ? profileImagePath : `/${profileImagePath}`;
  const imgSrc =
    import.meta.env.VITE_FILES_BASE_URL ? `${import.meta.env.VITE_FILES_BASE_URL}${normalizedPath}` : normalizedPath;

  useEffect(() => {
    const loadArtist = async () => {
      if (user?.artistId) {
        try {
          const data = await apiClient.artists.getById(user.artistId);
          setArtist(data);
        } catch (error) {
          console.error("Failed to load artist:", error);
        }
      }
    };

    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if(!token) {
          navigate("/login", { replace: true });
          return;
        }
        const headers = new Headers();
        headers.set("Content-Type", "application/json");
        if (config.apiKey) {
          headers.set("x_api_key", config.apiKey);
          headers.set("x-api-key", config.apiKey);
        }
        if (token) headers.set("Authorization", `Bearer ${token}`);
        const base = (config.apiBaseUrl || "").replace(/\/$/, "");
        const response = await fetch(`${base}/artist/profile`, { headers });
        if (!response.ok) {
          const text = await response.text();
          if (text && text.includes("Network connection required")) {
            setNetworkError(true);
            return;
          }
          if (response.status === 404 || (text && text.includes("Artist profile not found"))) {
            navigate("/complete-profile", { replace: true });
            return;
          }
          throw new Error(text || "Failed to load profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Network connection required")) {
          setNetworkError(true);
          return;
        }
        if (message && message.includes("Artist profile not found")) {
          navigate("/complete-profile", { replace: true });
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    loadArtist();
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/complete-profile", { replace: true });
    }
  }, [loading, profile, navigate]);

  if (loading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  // if (!artist) {
  //   return <div>Artist not found</div>;
  // }

  return (
    <div className="space-y-6 slide-in-up">
      {networkError && (
        <div className="glass-modern p-4 rounded-md border border-red-300/30 bg-red-50/10 text-red-800 dark:text-red-200">
          Network connection required. Please check your internet connection.
        </div>
      )}
      {profile?.verificationStatus === "pending" && (
        <div className="glass-modern p-4 rounded-md border border-yellow-300/30 bg-yellow-50/10 text-yellow-800 dark:text-yellow-200">
          Your verification is pending. Admin can verify you soon.
        </div>
      )}
      <div className="glass-modern p-6 rounded-lg flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={imgSrc}
            alt={profile?.userId?.displayName || artist?.displayName}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = ""; // trigger AvatarFallback when the image fails (e.g., 503)
            }}
          />
          <AvatarFallback>{(profile?.userId?.displayName || artist?.displayName || "A").slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome back, {profile?.userId?.displayName || artist?.displayName}!
          </h1>
          <p className="text-muted-foreground mt-2">Manage your artist profile and settings</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => navigate("/edit-profile")} variant="outline">
            Edit Profile
          </Button>
        </div>
      </div>

      <Card className="glass-modern hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Artist Profile
            {(profile?.isAdminVerified || profile?.verificationStatus === "verified") && (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile?.userId?.email || artist?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile?.userId?.phone || artist?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {profile?.location
                      ? `${profile.location.city || ""}${profile.location.state ? ", " + profile.location.state : ""}${profile.location.country ? ", " + profile.location.country : ""}`
                      : artist.city}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {(profile?.category || artist.categories).map((category: string) => (
                  <Badge key={category} variant="accent">
                    {category}
                  </Badge>
                ))}
              </div>

              {(profile?.bio || artist.bio) && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="text-sm">{profile?.bio || artist.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass-modern hover-glow border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">0</p>
              <p className="text-sm text-muted-foreground mt-2">Pending Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-modern hover-glow border-accent/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-accent drop-shadow-glow">0</p>
              <p className="text-sm text-muted-foreground mt-2">Confirmed Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-modern hover-glow border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">{Array.isArray(profile?.media) ? profile.media.length : 0}</p>
              <p className="text-sm text-muted-foreground mt-2">Media Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {Array.isArray(profile?.media) && profile.media.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Media</h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">{/* Masonry layout */}
            {profile.media.map((m: any, idx: number) => {
              const raw = typeof m?.url === "string" ? m.url : "";
              const base = import.meta.env.VITE_FILES_BASE_URL as string | undefined;
              const src = /^https?:\/\//.test(raw) ? raw : `${base || ""}${raw}`;
              return (
                <div key={m?._id || idx} className="mb-4 break-inside-avoid rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {m?.type === "video" ? (
                    <video src={src} className="w-full h-auto" controls />
                  ) : (
                    <img src={src} alt="media" className="w-full h-auto" loading="lazy" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
