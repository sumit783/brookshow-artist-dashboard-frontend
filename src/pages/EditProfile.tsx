import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Badge } from "../components/ui/badge";
import { Camera, ChevronLeft, Loader2, RefreshCcw } from "lucide-react";
import { apiClient, authApi } from "../services/apiClient";
import { ProfilePayload, EventPricing } from "../types";
import { config } from "../config";

const EditProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    countryCode: "",
    bio: "",
    city: "",
    state: "",
    country: "",
  });
  const [eventPricing, setEventPricing] = useState<Record<string, EventPricing>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load categories
        const categoryList = await apiClient.artists.getCategories(true);
        setCategories(categoryList);

        // Load existing profile
        const token = localStorage.getItem("auth_token");
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
           throw new Error("Failed to load profile");
        }
        
        const data = await response.json();
        
        // Fetch services pricing
        let servicesData: any[] = [];
        try {
          const servicesResponse = await apiClient.services.getByArtist("");
          servicesData = servicesResponse;
        } catch (sErr) {
          console.error("Failed to fetch services:", sErr);
        }

        // Populate form
        if (data) {
          setForm({
            displayName: data.userId?.displayName || "",
            email: data.userId?.email || "",
            phone: data.userId?.phone || "",
            countryCode: data.userId?.countryCode || "",
            bio: data.bio || "",
            city: data.location?.city || data.city || "",
            state: data.location?.state || data.state || "",
            country: data.location?.country || data.country || "",
          });
          
          let initialCategories: string[] = [];
          if (data.category && Array.isArray(data.category)) {
            initialCategories = data.category;
          } else if (data.categories && Array.isArray(data.categories)) {
             initialCategories = data.categories;
          }

          const initialPricing: Record<string, EventPricing> = data.eventPricing || {};

          // Merge with services data (prefer services data for pricing if available)
          if (servicesData && servicesData.length > 0) {
            servicesData.forEach((s: any) => {
              if (s.title) {
                if (!initialCategories.includes(s.title)) {
                  initialCategories.push(s.title);
                }
                initialPricing[s.title] = {
                  eventPlannerPrice: s.price_for_planner || 0,
                  userPrice: s.price_for_user || 0,
                  advance: s.advance || 0,
                };
              }
            });
          }

          setSelectedCategories(initialCategories);
          setEventPricing(initialPricing);
          
          if (data.profileImage) {
             const raw = data.profileImage;
             let finalSrc = raw;
             if (!/^https?:\/\//.test(raw)) {
                const normalized = raw.startsWith("/") ? raw : `/${raw}`;
                finalSrc = import.meta.env.VITE_FILES_BASE_URL ? `${import.meta.env.VITE_FILES_BASE_URL}${normalized}` : normalized;
             }
             setProfileImagePreview(finalSrc);
          }
        }

      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        // Remove category
        const newPricing = { ...eventPricing };
        delete newPricing[category];
        setEventPricing(newPricing);
        return prev.filter((c) => c !== category);
      } else {
        // Add category with default pricing
        setEventPricing((prev) => ({
          ...prev,
          [category]: {
            eventPlannerPrice: 0,
            userPrice: 0,
            advance: 0,
          },
        }));
        return [...prev, category];
      }
    });
  };

  const handlePricingChange = (category: string, field: keyof EventPricing, value: string) => {
    setEventPricing((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Update User Details
      if (!form.displayName.trim() || !form.email.trim()) {
         throw new Error("Display Name and Email are required");
      }

      await authApi.updateUser({
        displayName: form.displayName,
        email: form.email,
        phone: form.phone,
        countryCode: form.countryCode,
      });

      // 2. Update Artist Profile
      if (selectedCategories.length === 0) {
        throw new Error("Please select at least one category");
      }

      if (!form.bio.trim()) {
        throw new Error("Bio is required");
      }

      if (!form.city.trim() || !form.state.trim() || !form.country.trim()) {
        throw new Error("City, State, and Country are required");
      }

      for (const category of selectedCategories) {
        const pricing = eventPricing[category];
        if (!pricing || pricing.eventPlannerPrice <= 0 || pricing.userPrice <= 0) {
          throw new Error(`Please set valid pricing for ${category}`);
        }
      }

      const payload: ProfilePayload = {
        profileImage: profileImage || undefined,
        bio: form.bio.trim(),
        category: selectedCategories,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        eventPricing,
      };

      const response = await apiClient.artists.updateProfile(payload);
      
      if (response.success) {
        setSuccessMessage("Profile updated successfully!");
        window.scrollTo(0, 0);
        // Optional: redirect after short delay
        setTimeout(() => {
           navigate("/");
        }, 1500);
      }
    } catch (err: any) {
      let message = "Failed to update profile";
      if (err?.message) {
        message = String(err.message);
        try {
           const parsed = JSON.parse(message);
           if (parsed && typeof parsed === "object" && parsed.message) {
              message = String(parsed.message);
           }
        } catch (_) {}
      }
      setError(message);
      window.scrollTo(0, 0);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="Refresh Page"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Edit Profile
          </h1>
          <p className="text-muted-foreground">Update your artist details</p>
        </div>

        <Card className="glass-modern hover-glow">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Make changes to your information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {successMessage && (
                <Alert className="border-green-500 bg-green-500/10 text-green-500">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Profile Image */}
              <div className="flex items-center gap-4 justify-center flex-col">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={handleImageClick}
                    className="relative w-24 h-24 rounded-full border-2 border-primary cursor-pointer overflow-hidden bg-muted hover:opacity-80 transition-opacity group"
                  >
                    {profileImagePreview ? (
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload profile image"
                  />
                </div>
              </div>

               {/* User Details */}
               <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <h4 className="font-semibold mb-2">Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        required
                        value={form.displayName}
                        onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        required
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="countryCode">Country Code</Label>
                      <Input
                        id="countryCode"
                        required
                        value={form.countryCode}
                        onChange={(e) => setForm((prev) => ({ ...prev, countryCode: e.target.value }))}
                        placeholder="+91"
                      />
                    </div>
                  </div>
               </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself and your services..."
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  required
                  rows={4}
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      type="button"
                    >
                      {selectedCategories.length > 0
                        ? `${selectedCategories.length} category selected`
                        : "Select categories..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {categories.length > 0 ? (
                        categories.map((category) => {
                          const isSelected = selectedCategories.includes(category);
                          return (
                            <div
                              key={category}
                              className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm"
                            >
                              <Checkbox
                                id={`category-${category}`}
                                checked={isSelected}
                                onCheckedChange={() => {
                                  handleCategoryToggle(category);
                                }}
                              />
                              <Label
                                htmlFor={`category-${category}`}
                                className="text-sm font-normal cursor-pointer flex-1 select-none"
                              >
                                {category}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">Loading categories...</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-sm flex items-center gap-1">
                        <span>{category}</span>
                        <button
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className="ml-1 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring rounded"
                          aria-label={`Remove ${category}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {selectedCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground">Select at least one category</p>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    required
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    required
                    placeholder="India"
                    value={form.country}
                    onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  />
                </div>
              </div>

              {/* Event Pricing */}
              {selectedCategories.length > 0 && (
                <div className="space-y-4">
                  <Label>Event Pricing (per category)</Label>
                  <div className="space-y-4 border rounded-md p-4">
                    {selectedCategories.map((category) => (
                      <div key={category} className="space-y-3 p-3 bg-muted/50 rounded-md">
                        <h4 className="font-semibold">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`${category}-planner`}>Event Planner Price</Label>
                            <Input
                              id={`${category}-planner`}
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="1000"
                              value={eventPricing[category]?.eventPlannerPrice || ""}
                              onChange={(e) =>
                                handlePricingChange(category, "eventPlannerPrice", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${category}-user`}>User Price</Label>
                            <Input
                              id={`${category}-user`}
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="800"
                              value={eventPricing[category]?.userPrice || ""}
                              onChange={(e) =>
                                handlePricingChange(category, "userPrice", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${category}-advance`}>Advance</Label>
                            <Input
                              id={`${category}-advance`}
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="100"
                              value={eventPricing[category]?.advance || ""}
                              onChange={(e) =>
                                handlePricingChange(category, "advance", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Saving changes..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
