import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { config } from "../config";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated) {
      navigate("/");
      return;
    }

    // Get email from localStorage (set during login/signup)
    const pendingEmail = localStorage.getItem("pending_email");
    if (!pendingEmail) {
      // No pending email means user came here directly, redirect to login
      navigate("/login");
      return;
    }
    setEmail(pendingEmail);
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const base = (config.apiBaseUrl || "").replace(/\/$/, "");
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      if (config.apiKey) {
        headers.set("x_api_key", config.apiKey);
        headers.set("x-api-key", config.apiKey);
      }
      const resp = await fetch(`${base}/auth/verify-email-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, otp: otp.trim(), isLogin: true }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Failed to verify OTP");
      }
      const data = await resp.json();
      if (!data?.success || !data?.jwtToken || !data?.user) {
        throw new Error(data?.message || "Invalid response");
      }
      const backendUser = data.user;
      const authUser = {
        id: backendUser._id,
        email: backendUser.email,
        role: backendUser.role === "admin" ? "admin" : "artist",
      } as const;
      setSession(authUser, data.jwtToken);
      localStorage.removeItem("pending_email");
      navigate("/", { replace: true });
    } catch (err: any) {
      let message = "Failed to verify OTP";
      if (err?.message) {
        message = String(err.message);
        try {
          const parsed = JSON.parse(message);
          if (parsed && typeof parsed === "object" && parsed.message) {
            message = String(parsed.message);
          }
        } catch (_) {
          // not JSON, keep as-is
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
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
          <Link to="/login">← Back to Login</Link>
        </Button>

        <div className="text-center mt-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            {config.brandName}
          </h1>
          <p className="text-muted-foreground">Artist Dashboard</p>
        </div>

        <Card className="glass-modern hover-glow">
          <CardHeader>
            <CardTitle>Verify Email</CardTitle>
            <CardDescription>
              Enter the OTP sent to your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  required
                  maxLength={4}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the verification code
                </p>
              </div>

              {error ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>

            <div className="text-sm text-muted-foreground text-center pt-3">
              <p>
                Didn't receive the code? <Link to="/signup" className="underline">Sign up again</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;
