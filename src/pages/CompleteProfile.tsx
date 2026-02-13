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
import { Camera, RefreshCcw } from "lucide-react";
import { apiClient } from "../services/apiClient";
import { ProfilePayload, EventPricing } from "../types";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    bio: "",
    city: "",
    state: "",
    country: "",
  });
  const [eventPricing, setEventPricing] = useState<Record<string, EventPricing>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Load active categories from backend
    apiClient.artists
      .getCategories(true)
      .then((list) => setCategories(list))
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setError("Failed to load categories");
      });
  }, [isAuthenticated, navigate]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        // Remove category and its pricing
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

    try {
      // Validation
      if (selectedCategories.length === 0) {
        throw new Error("Please select at least one category");
      }

      if (!form.bio.trim()) {
        throw new Error("Bio is required");
      }

      if (!form.city.trim() || !form.state.trim() || !form.country.trim()) {
        throw new Error("City, State, and Country are required");
      }

      // Validate pricing for all selected categories
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
      console.log("RESPONSE IS ",response);
      // Redirect to dashboard on successful profile creation
      if (response.success) {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      let message = "Failed to complete profile";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">Fill in your details to get started</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>

        <Card className="glass-modern hover-glow hover:scale-100">
          <CardHeader>
            <CardTitle>Artist Profile</CardTitle>
            <CardDescription>
              Provide information about yourself and your services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {error ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Completing profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
