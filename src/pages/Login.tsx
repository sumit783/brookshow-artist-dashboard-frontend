import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { config } from "../config";
import { RefreshCcw } from "lucide-react";
import logo from "../assets/logo.webp";

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

    } catch (error: any) {
      
      toast({
        title: "Request failed",
        description: "User already exists or invalid email",
        variant: "destructive" as const,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Left Side: Brand Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark moving-bg relative flex-col items-center justify-center p-12 overflow-hidden border-r border-white/5">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 text-center space-y-8 slide-in-up">
          <div className="inline-block p-6 rounded-3xl glass-modern mb-4 floating-card bg-white/5">
            <img src={logo} alt={config.brandName} className="h-24 w-auto drop-shadow-glow" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Welcome Back to <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent italic">BrookShow</span>
            </h1>
            <p className="text-xl text-white/60 max-w-sm mx-auto font-light leading-relaxed">
              Manage your artist profile, bookings and schedule with ease.
            </p>
          </div>
          
          <div className="pt-8 flex justify-center gap-4">
             <div className="h-1 w-12 rounded-full bg-gradient-primary" />
             <div className="h-1 w-4 rounded-full bg-white/20" />
             <div className="h-1 w-4 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Logo (visible only on small screens) */}
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
              <Link to="/" className="flex items-center">
                <span className="mr-1.5 group-hover:-translate-x-1 transition-transform">←</span>
                Back to Site
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
            <h2 className="text-3xl font-bold tracking-tight text-white">Sign In</h2>
            <p className="text-muted-foreground">Access your artist dashboard</p>
          </div>
  
          <Card className="glass-ultra border-white/10 shadow-strong hover-glow overflow-hidden border-t-primary/20 border-t-2">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold lg:hidden">Sign In</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your email address to get an OTP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80 ml-1">Email address</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="artist@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 h-12 px-4 focus:ring-primary focus:border-primary/50 transition-smooth group-hover:border-white/20 rounded-xl"
                    />
                  </div>
                </div>
    
                <Button 
                  type="submit" 
                  className="w-full h-12 text-md font-bold bg-gradient-primary hover:shadow-glow transition-bounce shadow-medium rounded-xl group" 
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {loading ? "Verifying..." : "Send Secure OTP"}
                  {!loading && <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>}
                </Button>
    
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                    <span className="bg-[#0b0c14] px-2 text-white/30">Artist Access Only</span>
                  </div>
                </div>
    
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground/80">
                    Need an account?{" "}
                    <Link to="/signup" className="text-white hover:text-primary font-bold underline underline-offset-4 transition-smooth">
                      Create Artist Profile
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-center gap-6 pt-4">
             <p className="text-[10px] text-white/20 uppercase tracking-tighter">SECURE LOGIN</p>
             <p className="text-[10px] text-white/20 uppercase tracking-tighter">ENCRYPTED DATA</p>
             <p className="text-[10px] text-white/20 uppercase tracking-tighter">24/7 SUPPORT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
