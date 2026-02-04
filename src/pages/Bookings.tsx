import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { Booking, BookingStatus } from "../types";
import { BookingCard } from "../components/BookingCard";
import { BookingDetailModal } from "../components/BookingDetailModal";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

export function Bookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const { toast } = useToast();

  const { data: bookings = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      return apiClient.bookings.getBookings();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      return apiClient.bookings.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({ title: "Booking updated", description: `Booking ${status}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    }
  };

  const handleComplete = (id: string) => {
    setBookingToComplete(id);
  };

  const confirmComplete = async () => {
    if (bookingToComplete) {
      await handleUpdateStatus(bookingToComplete, "completed");
      setBookingToComplete(null);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const message = encodeURIComponent("Hello! This is regarding your booking with BrookShow.");
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const filteredBookings = bookings.filter((booking) =>
    filter === "all" ? true : booking.status === filter
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-modern p-6 rounded-lg">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Use default export at the end if preferred, or keep as named. 
  // Most pages seem to use default export.
  // I'll change it to default export to match original.

  return (
    <div className="space-y-6 slide-in-up">
      <div className="glass-modern p-6 rounded-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage your event bookings</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className={isFetching ? "animate-spin" : ""}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onComplete={handleComplete}
              onWhatsApp={handleWhatsApp}
              onClick={() => setSelectedBooking(booking)}
            />
          ))}
        </div>
      )}

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onBlockCalendar={(booking) => {
          toast({
            title: "Calendar block created",
            description: "This booking has been blocked on your calendar",
          });
          setSelectedBooking(null);
        }}
      />

      <AlertDialog open={!!bookingToComplete} onOpenChange={(open) => !open && setBookingToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this booking as completed? This action will update the booking status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmComplete} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Bookings;
