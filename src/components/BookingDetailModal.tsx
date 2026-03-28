import { Booking } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, User, Phone, DollarSign, FileText, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

interface BookingDetailModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onBlockCalendar?: (booking: Booking) => void;
}

export function BookingDetailModal({
  booking,
  open,
  onClose,
  onBlockCalendar,
}: BookingDetailModalProps) {
  // Fetch detailed booking when modal is open and we have a booking id
  const { data, isLoading } = useQuery({
    queryKey: ["bookingDetail", booking?.id || booking?._id],
    queryFn: async () => {
      const id = booking?.id || booking?._id;
      if (!id) return null;
      
      try {
        // Fetch detailed data from the artist endpoints
        const detailedData = await apiClient.bookings.getById(id as string);
        return detailedData;
      } catch (error) {
        console.error("Failed to fetch detailed booking:", error);
        return null; // Fallback to basic booking data if detailed fetch fails
      }
    },
    enabled: open && !!(booking?.id || booking?._id),
  });

  if (!open) return null;

  // Use detailed data if available, fallback to the basic booking prop
  // Note: apiClient returns mapped detailed Booking mapped data, but we can access raw fields 
  // if they exist, or just use `data` directly if we merged the raw response details
  const displayData: any = data || booking;
  if (!displayData) return null;

  // Parse dates properly considering both detailed and basic models
  const startDate = new Date(displayData.startAt || displayData.start);
  const endDate = new Date(displayData.endAt || displayData.end);

  // Extract client details based on the structure (detailed vs basic)
  const clientName = displayData.clientName || displayData.clientId?.displayName || "Unknown Client";
  const clientPhone = displayData.clientPhone || displayData.clientPhoneNumber || displayData.clientId?.phone || "Unknown Phone";
  const clientEmail = displayData.clientEmail || displayData.clientId?.email || "";
  
  const fullClientAddress = [
    displayData.clientAddress || displayData.clientId?.address,
    displayData.clientCity || displayData.clientId?.city,
    displayData.clientState || displayData.clientId?.state,
    displayData.clientCountry || displayData.clientId?.country,
    displayData.clientPincode || displayData.clientId?.pincode
  ].filter(Boolean).join(", ");
  
  // Extract service details
  const serviceName = displayData.serviceId?.category || displayData.serviceName || "Service";
  
  // Extract pricing info
  const totalPrice = displayData.totalPrice || displayData.price || 0;
  const advancePaid = displayData.advanceAmount || displayData.paidAmount || 0;
  const pendingAmount = Math.max(0, totalPrice - advancePaid);
  
  // Event details (from the new detailed model)
  const eventName = displayData.eventName;
  const eventAddress = [
    displayData.eventAddress,
    displayData.eventCity,
    displayData.eventState,
    displayData.eventPincode
  ].filter(Boolean).join(", ");
  
  const mapQuery = (displayData.eventLat && displayData.eventLng)
    ? `${displayData.eventLat},${displayData.eventLng}`
    : eventAddress;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Booking Details
            <Badge className={`status-${displayData.status || "pending"}`}>
              {displayData.status || "Pending"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            #{displayData._id || displayData.id}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Client Info</p>
                <p className="text-sm text-foreground">{clientName}</p>
                {clientEmail && <p className="text-xs text-muted-foreground">{clientEmail}</p>}
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" /> {clientPhone}
                </p>
                {fullClientAddress && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> <span className="flex-1">{fullClientAddress}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Service Details</p>
                <p className="text-sm text-foreground">{serviceName}</p>
                {eventName && <p className="text-xs text-muted-foreground border border-border inline-block px-1.5 py-0.5 rounded mt-1 bg-muted/50">{eventName}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Schedule</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>
                    <span className="font-medium text-foreground">From:</span> {format(startDate, "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">To:</span> {format(endDate, "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {eventAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="w-full pr-4">
                  <p className="text-sm font-medium">Venue Address</p>
                  <p className="text-sm text-muted-foreground mt-1">{eventAddress}</p>
                  <div className="mt-3 w-full rounded-md overflow-hidden border border-border bg-muted/20">
                    <iframe
                      width="100%"
                      height="200"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Payment Summarry</p>
                <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Price</span>
                    <span className="font-semibold">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  {displayData.commissionAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span className="font-medium">₹{displayData.commissionAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advance Paid</span>
                    <span className="text-green-600 font-medium">+ ₹{advancePaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="font-medium">Pending Amount</span>
                    <span className="font-bold text-orange-600">
                      ₹{pendingAmount.toFixed(2)}
                    </span>
                  </div>
                  {displayData.paymentStatus && (
                    <div className="pt-2 flex justify-end">
                      <Badge variant="outline" className="text-xs uppercase px-2 py-0 border-primary/20 text-primary">
                        {displayData.paymentStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {displayData.source && (
              <div className="rounded-lg bg-primary/10 p-3 mt-4 border border-primary/20">
                <p className="text-xs text-primary font-medium flex items-center justify-between">
                  <span>Booking Source:</span>
                  <span className="capitalize">{displayData.source}</span>
                </p>
              </div>
            )}
            
            {displayData.razorpayOrderId && (
              <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
                Order ID: {displayData.razorpayOrderId}
              </p>
            )}
          </div>
        )}
        <Button variant="default" onClick={onClose} className="w-full mt-2">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
