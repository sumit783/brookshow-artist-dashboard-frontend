import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { config } from "../config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base = (config.apiBaseUrl || "").replace(/\/$/, "");
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      if (config.apiKey) {
        headers.set("x_api_key", config.apiKey);
        headers.set("x-api-key", config.apiKey);
      }
      const resp = await fetch(`${base}/auth/request-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Failed to request OTP");
      }
      // store for VerifyOTP page
      localStorage.setItem("pending_email", email);
      toast({ title: "OTP sent", description: "Please check your email." });
      navigate("/verify-otp");
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Unable to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark px-4">
      <div className="w-full max-w-md space-y-6 relative">
        <Button
          variant="outline"
          className="absolute -top-4 left-0 glass-modern"
          asChild
        >
          <Link to="/">← Back to Website</Link>
        </Button>
        
        <div className="text-center mt-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            {config.brandName}
          </h1>
          <p className="text-muted-foreground">Artist Dashboard</p>
        </div>

        <Card className="glass-modern hover-glow">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email to receive a login OTP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="text-sm text-muted-foreground text-center pt-2">
                <p>Don't have an account? <Link to="/signup" className="underline">Sign up</Link></p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
