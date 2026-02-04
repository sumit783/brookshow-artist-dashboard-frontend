import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Booking } from "@/types";
import { Calendar as CalendarIcon, Clock, DollarSign, Phone, User } from "lucide-react";

interface BookingDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  loading: boolean;
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  booking,
  loading,
}: BookingDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            View detailed information about this booking
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse">Loading booking details...</div>
          </div>
        ) : booking ? (
          <div className="space-y-6 py-4">
            {/* Status and Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge
                  variant={booking.status === "confirmed" ? "default" : "secondary"}
                  className={
                    booking.status === "confirmed"
                      ? "bg-green-500"
                      : booking.status === "pending"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                  }
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Price:</span>
                <span className="text-lg font-bold">₹{booking.price}</span>
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Service
              </Label>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{booking.serviceName}</p>
              </div>
            </div>

            {/* Client Information */}
            {(booking.clientName && booking.clientName !== "Unknown Client") && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client Information
                </Label>
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="font-medium">{booking.clientName}</p>
                  {booking.clientPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{booking.clientPhoneMasked || booking.clientPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Date & Time
                </Label>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    {new Date(booking.start).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.start).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  End Date & Time
                </Label>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    {new Date(booking.end).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.end).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Booking Source</Label>
              <div className="p-3 rounded-lg bg-muted/50">
                <Badge variant="outline">
                  {booking.source === "user" ? "Direct Booking" : "Event Planner"}
                </Badge>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Notes</Label>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Created/Updated Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(booking.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(booking.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No booking data available</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
