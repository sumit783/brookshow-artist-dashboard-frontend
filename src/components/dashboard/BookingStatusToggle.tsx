import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../services/apiClient";
import { Switch } from "../ui/switch";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";

interface BookingStatusToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function BookingStatusToggle({ className, showLabels = true }: BookingStatusToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: artistProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: () => apiClient.artists.getProfile(),
    enabled: !!user,
  });

  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: () => apiClient.artists.toggleActive(),
    onSuccess: (data) => {
      queryClient.setQueryData(["artistProfile"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isAvailable: data.isAvailable,
        };
      });
      toast({
        title: data.isAvailable ? "Profile Active" : "Profile Inactive",
        description: data.isAvailable 
          ? "You are now visible and accepting new bookings." 
          : "You are currently hidden from search results.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const isAvailable = artistProfile?.isAvailable ?? false;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-full border border-border/50 bg-accent/5 backdrop-blur-sm transition-all",
      className
    )}>
      {showLabels && (
        <div className="flex flex-col items-end mr-1">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-colors",
            isAvailable ? 'text-success' : 'text-muted-foreground'
          )}>
            {isAvailable ? 'Accepting' : 'Paused'}
          </span>
          <span className="text-[9px] text-muted-foreground leading-none">Bookings</span>
        </div>
      )}
      <Switch
        checked={isAvailable}
        onCheckedChange={() => toggleActive()}
        disabled={isToggling || isProfileLoading}
        className="data-[state=checked]:bg-success"
      />
    </div>
  );
}
