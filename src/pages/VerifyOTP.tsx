import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import { config } from "../config";
import logo from "../assets/logo.webp";

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Left Side: Brand Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark moving-bg relative flex-col items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 text-center space-y-8 slide-in-up">
          <div className="inline-block p-6 rounded-3xl glass-modern mb-4 floating-card bg-white/5">
            <img src={logo} alt={config.brandName} className="h-24 w-auto drop-shadow-glow" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              One Last Step <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent italic">To Access</span>
            </h1>
            <p className="text-xl text-white/60 max-w-sm mx-auto font-light leading-relaxed">
              Verifying your identity ensures a safe and secure environment for all our artists.
            </p>
          </div>

          <div className="pt-8 flex justify-center gap-4">
             <div className="h-1 w-4 rounded-full bg-white/20" />
             <div className="h-1 w-4 rounded-full bg-white/20" />
             <div className="h-1 w-12 rounded-full bg-gradient-primary" />
          </div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12 text-center slide-in-up">
          <img src={logo} alt={config.brandName} className="h-16 w-auto mx-auto mb-4 drop-shadow-glow" />
          <h1 className="text-3xl font-bold tracking-tight text-white italic">BrookShow</h1>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 fade-in-scale">
          <div className="flex justify-between items-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="glass-modern hover:bg-white/5 transition-bounce group text-xs px-3"
              asChild
            >
              <Link to="/login" className="flex items-center">
                <span className="mr-1.5 group-hover:-translate-x-1 transition-transform">←</span>
                Back to Login
              </Link>
            </Button>
    
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.reload()}
              className="glass-modern hover:bg-white/5 transition-bounce h-8 w-8"
              title="Refresh"
            >
              <RefreshCcw className="h-3.5 w-3.5 text-white/60" />
            </Button>
          </div>

          <div className="space-y-2 mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold tracking-tight text-white">Verification</h2>
            <p className="text-muted-foreground">Secure access to your dashboard</p>
          </div>

          <Card className="glass-ultra border-white/10 shadow-strong hover-glow border-t-primary/20 border-t-2">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-xl font-bold lg:hidden">Verify Email</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter the 4-digit code sent to <br />
                <span className="text-white font-medium">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium text-white/80 ml-1">OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="0 0 0 0"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                      maxLength={4}
                      autoComplete="one-time-code"
                      className="bg-white/5 border-white/10 h-16 text-center text-3xl tracking-[0.5em] font-bold focus:ring-primary focus:border-primary/50 transition-smooth rounded-2xl"
                    />
                  </div>
                </div>

                {error ? (
                  <Alert variant="destructive" className="bg-danger/10 border-danger/50 text-danger animate-fade-in py-2">
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                  </Alert>
                ) : null}

                <Button 
                  type="submit" 
                  className="w-full h-12 text-md font-bold bg-gradient-primary hover:shadow-glow transition-bounce shadow-medium rounded-xl group" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {submitting ? "Verifying..." : "Verify & Sign In"}
                  {!submitting && <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>}
                </Button>
              </form>

              <div className="text-sm text-muted-foreground text-center pt-8">
                <p>
                  Didn't receive the code?{" "}
                  <Link to="/signup" className="text-white hover:text-primary font-bold underline underline-offset-4 transition-smooth">
                    Try another email
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="pt-8 text-center">
             <p className="text-[10px] text-white/20 uppercase tracking-widest leading-loose">
               Confidential Access &bull; Secured with TLS 1.3
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
