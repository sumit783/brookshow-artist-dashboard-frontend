import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { config } from "../config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

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
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Create your artist account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  required
                  placeholder="Your artist name"
                  value={form.displayName}
                  onChange={onChange}
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country code</Label>
                  <Input
                    id="countryCode"
                    name="countryCode"
                    required
                    placeholder="+91"
                    value={form.countryCode}
                    onChange={onChange}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    placeholder="9112345928"
                    value={form.phone}
                    onChange={onChange}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" value="artist" disabled />
              </div> */}

              {error ? (
                <Alert variant="destructive" role="alert">
                  {/* <AlertTitle>Signup failed</AlertTitle> */}
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Sign up"}
              </Button>
            </form>

            <div className="text-sm text-muted-foreground text-center pt-3">
              <p>
                Already have an account? <Link to="/login" className="underline">Login</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          API: {config.apiBaseUrl.replace(/\/$/, "")}/auth/register
        </p>
      </div>
    </div>
  );
};

export default Signup;


