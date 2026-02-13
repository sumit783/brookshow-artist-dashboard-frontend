import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { Booking, CalendarBlock } from "../types";
import { useToast } from "../hooks/use-toast";
import { CalendarHeader } from "../components/calendar/CalendarHeader";
import { CalendarLegend } from "../components/calendar/CalendarLegend";
import { CalendarView } from "../components/calendar/CalendarView";
import { AddOfflineBookingDialog, ServiceOption, OfflineBookingData } from "../components/calendar/AddOfflineBookingDialog";
import { BookingDetailsDialog } from "../components/calendar/BookingDetailsDialog";

export default function CalendarPage() {
  const { user } = useAuth();
  const [calendarView, setCalendarView] = useState<string>("dayGridMonth");
  
  // Dialog states
  const [showOfflineBookingModal, setShowOfflineBookingModal] = useState(false);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  
  // Data states for dialogs
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Loading states
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const { toast } = useToast();

  // For artist users, use user.id as artistId if artistId is not set
  const artistId = user?.artistId || (user?.role === "artist" ? user.id : null);

  const { data: blocks = [], isLoading: isLoadingBlocks, refetch: refetchBlocks } = useQuery({
    queryKey: ["calendar-blocks", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      console.log("Loading calendar data for artistId:", artistId);
      return await apiClient.calendar.getByArtist(artistId);
    },
    enabled: !!artistId,
  });

  // Determine initial view based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCalendarView("timeGridDay");
      } else if (window.innerWidth < 1024) {
        setCalendarView("timeGridWeek");
      } else {
        setCalendarView("dayGridMonth");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const loadServices = async () => {
    try {
      console.log("=== loadServices START ===");
      setLoadingServices(true);
      const servicesData = await apiClient.services.getServicesAndId();
      setServices(servicesData);
      console.log("=== loadServices SUCCESS ===");
    } catch (error) {
      console.error("Failed to load services:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load services",
        variant: "destructive",
      });
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleDateClick = (info: any) => {
    console.log("handleDateClick called with date:", info.date);
    setSelectedDate(info.date);
    setShowOfflineBookingModal(true);
    console.log("Modal opened, loading services...");
    loadServices();
  };

  const handleEventClick = async (info: any) => {
    const eventId = info.event.id;
    const eventProps = info.event.extendedProps;
    console.log("Event clicked:", eventId, eventProps);
    
    let bookingId: string | null = null;
    
    // Check if this is a calendar block with a linked booking
    if (eventProps?.type === "block" && eventProps?.linkedBookingId) {
      bookingId = eventProps.linkedBookingId;
    } 
    // Or if it's a booking event directly
    else if (eventProps?.type === "booking" && eventProps?.bookingId) {
      bookingId = eventProps.bookingId;
    }
    
    if (bookingId) {
      try {
        setLoadingBooking(true);
        setShowBookingDetailsModal(true);
        const booking = await apiClient.bookings.getById(bookingId);
        setSelectedBooking(booking);
      } catch (error) {
        console.error("Failed to load booking details:", error);
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive",
        });
        setShowBookingDetailsModal(false);
      } finally {
        setLoadingBooking(false);
      }
    }
  };

  const handleCreateOfflineBooking = async (data: OfflineBookingData) => {
    const artistId = user?.artistId || (user?.role === "artist" ? user.id : null);
    if (!artistId || !selectedDate) return;

    try {
      // Format dates as YYYY-MM-DD (date only, no time)
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      // Format as YYYY-MM-DD
      const startAt = startDate.toISOString().split('T')[0];
      const endAt = endDate.toISOString().split('T')[0];

      // Create offline booking using the new endpoint
      await apiClient.bookings.createOffline({
        serviceId: data.serviceId,
        startAt: startAt,
        endAt: endAt,
        totalPrice: parseFloat(data.totalPrice),
      });

      // Reload calendar data to get the updated bookings and blocks
      await refetchBlocks();

      toast({
        title: "Offline booking created",
        description: "Successfully added to calendar",
      });

      setShowOfflineBookingModal(false);
      setServices([]); // Clear services when modal closes
    } catch (error) {
      console.error("Failed to create offline booking:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create offline booking",
        variant: "destructive",
      });
    }
  };

  const calendarEvents = useMemo(() => [
    ...blocks.map((block) => {
      let backgroundColor = "#8b5cf6"; // Default/Offline purple
      let classNames = "event-offline";
      let title = block.title;

      if (block.type === "busy") {
        backgroundColor = "#64748b"; // Slate
        classNames = "event-busy";
      } else if (block.type === "onlineBooking") {
        // Check if we have linked booking details to style it correctly
        const linkedBooking = typeof block.linkedBookingId === 'object' ? (block.linkedBookingId as any) : null;
        
        if (linkedBooking) {
            title = block.title || linkedBooking.serviceName || 'Service';
            
            if (linkedBooking.status === "confirmed") {
                backgroundColor = "#10b981"; // Emerald
                classNames = "event-confirmed";
            } else if (linkedBooking.status === "pending") {
                backgroundColor = "#f59e0b"; // Amber
                classNames = "event-pending";
            } else if (linkedBooking.status === "completed") {
                backgroundColor = "#6366f1"; // Indigo
                classNames = "event-completed";
            } else {
                backgroundColor = "#6b7280";
                classNames = "event-cancelled";
            }
        } else {
            // Fallback if no booking details but is online booking
            backgroundColor = "#10b981";
            classNames = "event-confirmed";
        }
      }
      
      return {
        id: block.id,
        title: title,
        start: block.start,
        end: block.end,
        backgroundColor,
        borderColor: backgroundColor,
        classNames: classNames,
        textColor: "#ffffff",
        extendedProps: {
          type: "block",
          blockId: block.id,
          linkedBookingId: typeof block.linkedBookingId === 'object' ? (block.linkedBookingId as any)._id : block.linkedBookingId,
          // Pass full booking object if available to avoid refetching if possible, but existing logic fetches by ID
          bookingDetails: typeof block.linkedBookingId === 'object' ? block.linkedBookingId : null
        },
      };
    }),
  ], [blocks]);

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-up">
      <CalendarHeader 
        onAddOfflineBooking={() => {
          /* Add button logic if uncommented in header */
        }} 
      />

      <CalendarLegend />

      <CalendarView 
        events={calendarEvents}
        view={calendarView}
        onViewChange={setCalendarView}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      <AddOfflineBookingDialog
        open={showOfflineBookingModal}
        onOpenChange={setShowOfflineBookingModal}
        services={services}
        loadingServices={loadingServices}
        onSubmit={handleCreateOfflineBooking}
      />

      <BookingDetailsDialog
        open={showBookingDetailsModal}
        onOpenChange={setShowBookingDetailsModal}
        booking={selectedBooking}
        loading={loadingBooking}
      />
    </div>
  );
}
