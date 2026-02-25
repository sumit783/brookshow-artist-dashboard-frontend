import { Card, CardContent } from "../ui/card";

interface DashboardStatsProps {
    profile: any | null;
}

export function DashboardStats({ profile }: DashboardStatsProps) {
    const mediaCount = profile?.stats?.mediaCount ?? (Array.isArray(profile?.media) ? profile.media.length : 0);
    const confirmedBookings = profile?.stats?.confirmedBookings ?? 0;
    const completedBookings = profile?.stats?.completedBookings ?? 0;

    const stats = [
        {
            label: "Confirmed Bookings",
            value: confirmedBookings.toString(),
            gradient: "bg-gradient-primary",
            borderColor: "border-primary/20",
        },
        {
            label: "Completed Bookings",
            value: completedBookings.toString(),
            gradient: "text-accent",
            borderColor: "border-accent/20",
            isAccent: true,
        },
        {
            label: "Media Count",
            value: mediaCount.toString(),
            gradient: "bg-gradient-accent",
            borderColor: "border-primary/20",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className={`glass-modern hover-glow ${stat.borderColor} overflow-hidden`}>
                    <CardContent className="pt-6">
                        <div className="text-center relative">
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/5 rounded-full blur-2xl" />
                            <p className={`text-4xl font-bold ${stat.isAccent ? stat.gradient + " drop-shadow-glow" : stat.gradient + " bg-clip-text text-transparent"}`}>
                                {stat.value}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wide">
                                {stat.label}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
