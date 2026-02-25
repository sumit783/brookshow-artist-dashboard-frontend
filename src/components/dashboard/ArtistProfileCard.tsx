import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { User, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Artist } from "../../types";

interface ArtistProfileCardProps {
    profile: any | null;
    artist: Artist | null;
}

export function ArtistProfileCard({ profile, artist: propsArtist }: ArtistProfileCardProps) {
    const artist = profile || propsArtist;
    const email = artist?.email;
    const phone = artist?.phone;
    const location = artist?.city;
    const categories = artist?.categories || [];
    const bio = artist?.bio;
    const isVerified = artist?.verified;

    return (
        <Card className="glass-modern hover-glow h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Artist Profile</span>
                    {isVerified && (
                        <Badge variant="default" className="ml-2 bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                                <p className="font-medium break-all">{email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
                                <p className="font-medium">{phone}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                                <p className="font-medium">{location}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category: string) => (
                                    <Badge key={category} variant="accent" className="bg-primary/5 text-primary border-primary/10">
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {bio && (
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Bio</p>
                                <p className="text-sm text-balance leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-default">
                                    {bio}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
