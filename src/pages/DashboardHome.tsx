import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { Artist } from "../types";
import { config } from "../config";
import { useNavigate } from "react-router-dom";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { ArtistProfileCard } from "../components/dashboard/ArtistProfileCard";
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { MediaGallery } from "../components/dashboard/MediaGallery";

export default function DashboardHome() {
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const navigate = useNavigate();

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
        if (!token) {
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
  }, [user, navigate]);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/complete-profile", { replace: true });
    }
  }, [loading, profile, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 slide-in-up">
      {networkError && (
        <div className="glass-modern p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-medium animate-shake">
          Network connection required. Please check your internet connection.
        </div>
      )}

      {profile?.verificationStatus === "pending" && (
        <div className="glass-modern p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 font-medium">
          Your verification is pending. Our team will verify your profile shortly.
        </div>
      )}

      {/* Welcome Section */}
      <WelcomeBanner profile={profile} artist={artist} />

      {/* Stats Section */}
      <DashboardStats profile={profile} />

      {/* Profile Details */}
      <ArtistProfileCard profile={profile} artist={artist} />

      {/* Media Portfolio */}
      <MediaGallery media={profile?.media} />
    </div>
  );
}
