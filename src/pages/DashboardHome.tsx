import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { Artist } from "../types";
import { config } from "../config";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { ArtistProfileCard } from "../components/dashboard/ArtistProfileCard";
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { MediaGallery } from "../components/dashboard/MediaGallery";

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: () => apiClient.artists.getProfile(),
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Artist profile not found") || message.includes("404")) {
        navigate("/complete-profile", { replace: true });
      }
    }
  }, [error, navigate]);

  useEffect(() => {
    if (!isLoading && !profile && !error) {
      navigate("/complete-profile", { replace: true });
    }
  }, [isLoading, profile, error, navigate]);

  if (isLoading) {
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
      {error && !profile && (
        <div className="glass-modern p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-medium animate-shake">
          {error instanceof Error ? error.message : "Failed to load dashboard data. Please check your connection."}
        </div>
      )}

      {profile?.verificationStatus === "pending" && (
        <div className="glass-modern p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 font-medium">
          Your verification is pending. Our team will verify your profile shortly.
        </div>
      )}
      {
        profile?.verificationStatus === "rejected" && (
          <div className="glass-modern p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 font-medium">
            Your verification has been rejected. Reason: {profile?.verificationNote}
          </div>
        )
      }

      {/* Welcome Section */}
      <WelcomeBanner profile={profile} artist={profile} />

      {/* Stats Section */}
      <DashboardStats profile={profile} />

      {/* Profile Details */}
      <ArtistProfileCard profile={profile} artist={profile} />

      {/* Media Portfolio */}
      <MediaGallery media={profile?.media} />
    </div>
  );
}
