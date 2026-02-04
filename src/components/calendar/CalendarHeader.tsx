import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "../ui/button";

interface CalendarHeaderProps {
  onAddOfflineBooking?: () => void;
}

export function CalendarHeader({ onAddOfflineBooking }: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          Calendar
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your schedule and availability
        </p>
      </div>
      {/* 
      // Uncomment if you want to enable the button here, but for now it was commented out in original file
      {onAddOfflineBooking && (
        <Button onClick={onAddOfflineBooking}>
          <Plus className="h-4 w-4 mr-2" />
          Add Offline Booking
        </Button>
      )} 
      */}
    </div>
  );
}
