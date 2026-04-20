import { useState } from "react";
import { Link, Copy, Check, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";

interface ShareProfileCardProps {
  artistId: string;
  className?: string;
}

export function ShareProfileCard({ artistId, className }: ShareProfileCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const publicUrl = `https://brookshow.com/artists/${artistId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your profile link is now in your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn("glass-modern border-primary/20 overflow-hidden relative", className)}>
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Share2 size={120} className="text-primary rotate-12" />
      </div>
      
      <CardContent className="p-6 sm:p-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              Share Your Profile
            </h3>
            <p className="text-muted-foreground text-sm font-medium">
              Use this link to get bookings from social media and attract new clients.
            </p>
            
            <div className="mt-4 flex items-center gap-2 p-3 bg-accent/5 rounded-lg border border-border/50 group">
              <span className="flex-1 font-mono text-xs sm:text-sm truncate select-all text-primary/80">
                {publicUrl}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                title="Copy Link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
