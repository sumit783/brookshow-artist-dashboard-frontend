import { Check, X, Clock, MessageCircle } from "lucide-react";
import { Booking } from "../types";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

interface BookingCardProps {
  booking: Booking;
  onComplete?: (id: string) => void;
  onWhatsApp?: (phone: string) => void;
  onClick?: () => void;
}

const statusColors = {
  pending: "default",
  confirmed: "success",
  completed: "accent",
  cancelled: "outline",
};

export function BookingCard({
  booking,
  onComplete,
  onWhatsApp,
  onClick,
}: BookingCardProps) {
  const startDate = new Date(booking.start);
  const endDate = new Date(booking.end);

  return (
    <Card
      className="transition-all hover:shadow-glow hover:-translate-y-1 cursor-pointer glass-modern"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{booking.clientName}</h3>
            <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusColors[booking.status] as any}>
              {booking.status}
            </Badge>
            <Badge variant="outline" className="text-[10px] py-0 h-4">
              {booking.source === "user" ? "Online" : booking.source === "offline" ? "Offline" : "Planner"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {format(startDate, "MMM dd, yyyy • h:mm a")} - {format(endDate, format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd") ? "h:mm a" : "MMM dd, h:mm a")}
            </span>
          </div>
          
          <div className="flex items-center justify-end">
            <span className="font-semibold">${booking.price}</span>
          </div>
        </div>

        {booking.syncStatus === "pending" && (
          <Badge variant="outline" className="w-full justify-center">
            Syncing...
          </Badge>
        )}

        {booking.status === "confirmed" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onComplete?.(booking.id);
              }}
            >
              Mark Completed
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp?.(booking.clientPhone);
              }}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
