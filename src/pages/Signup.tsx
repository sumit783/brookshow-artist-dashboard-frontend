import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { config } from "../config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import logo from "../assets/logo.webp";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    displayName: "",
    countryCode: "+91",
    role: "artist" as const,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Ensure role is fixed to artist
      await signup({
        email: form.email.trim(),
        phone: form.phone.trim(),
        displayName: form.displayName.trim(),
        countryCode: form.countryCode.trim(),
        role: "artist",
      });
      // Store email for OTP verification page
      localStorage.setItem("pending_email", form.email.trim());
      navigate("/verify-otp");
    } catch (err: any) {
      let message = "Failed to create account";
      // Prefer explicit message field if thrown from api client
      if (err?.message) {
        message = String(err.message);
        // If backend returned a JSON string in message, extract .message
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background overflow-hidden font-body">
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
              Start Your Journey <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent italic">With Us</span>
            </h1>
            <p className="text-xl text-white/60 max-w-sm mx-auto font-light leading-relaxed">
              Join the elite circle of verified artists and take your career to the next level.
            </p>
          </div>

          <div className="pt-8 flex justify-center gap-4">
             <div className="h-1 w-4 rounded-full bg-white/20" />
             <div className="h-1 w-12 rounded-full bg-gradient-primary" />
             <div className="h-1 w-4 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto no-scrollbar">
        {/* Mobile Logo */}
        <div className="lg:hidden mb-12 text-center slide-in-up">
          <img src={logo} alt={config.brandName} className="h-16 w-auto mx-auto mb-4 drop-shadow-glow" />
          <h1 className="text-3xl font-bold tracking-tight text-white italic">BrookShow</h1>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 fade-in-scale py-8">
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
            <h2 className="text-3xl font-bold tracking-tight text-white">Join BrookShow</h2>
            <p className="text-muted-foreground">Register as a professional artist</p>
          </div>

          <Card className="glass-ultra border-white/10 shadow-strong hover-glow border-t-primary/20 border-t-2">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold lg:hidden">Create Account</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your professional details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium text-white/80 ml-1">Artist / Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    required
                    placeholder="e.g. DJ Sarah Music"
                    value={form.displayName}
                    onChange={onChange}
                    autoComplete="name"
                    className="bg-white/5 border-white/10 h-11 focus:ring-primary focus:border-primary/50 transition-smooth rounded-xl px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/80 ml-1">Work Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="artist@example.com"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    className="bg-white/5 border-white/10 h-11 focus:ring-primary focus:border-primary/50 transition-smooth rounded-xl px-4"
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="countryCode" className="text-sm font-medium text-white/80 block truncate">Code</Label>
                    <Input
                      id="countryCode"
                      name="countryCode"
                      required
                      placeholder="+91"
                      value={form.countryCode}
                      onChange={onChange}
                      className="bg-white/5 border-white/10 h-11 text-center focus:ring-primary focus:border-primary/50 transition-smooth rounded-xl px-0"
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-white/80 ml-1">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      required
                      placeholder="9112345928"
                      value={form.phone}
                      onChange={onChange}
                      autoComplete="tel"
                      className="bg-white/5 border-white/10 h-11 focus:ring-primary focus:border-primary/50 transition-smooth rounded-xl px-4"
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
                  className="w-full h-12 text-md font-bold bg-gradient-primary hover:shadow-glow transition-bounce mt-4 rounded-xl group shadow-medium" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <RefreshCcw className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {submitting ? "Processing..." : "Create Artist Account"}
                  {!submitting && <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>}
                </Button>
              </form>

              <div className="text-sm text-muted-foreground text-center pt-6">
                <p>
                  Already registered?{" "}
                  <Link to="/login" className="text-white hover:text-primary font-bold underline underline-offset-4 transition-smooth">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <footer className="pt-8 text-center sm:text-left">
            <p className="text-[10px] text-white/20 uppercase tracking-widest leading-loose">
              By joining, you agree to our <br className="sm:hidden" />
              <span className="underline cursor-pointer hover:text-white/40">Terms of Service</span> and <span className="underline cursor-pointer hover:text-white/40">Privacy Policy</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Signup;


