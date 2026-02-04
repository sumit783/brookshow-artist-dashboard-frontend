import React, { useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface CalendarViewProps {
  events: any[];
  view: string;
  onViewChange: (view: string) => void;
  onDateClick: (info: any) => void;
  onEventClick: (info: any) => void;
}

export function CalendarView({
  events,
  view,
  onViewChange,
  onDateClick,
  onEventClick,
}: CalendarViewProps) {
  // Handle view change based on prop update if needed, 
  // but FullCalendar handles internal state. 
  // We need to make sure the prop passed to initialView or api.changeView works.
  
  // Note: FullCalendar's `initialView` only works on mount. 
  // To change view dynamically, we'd need a ref to the calendar API, 
  // but for simple reactive view switching (like on resize), `key` prop can be used to remount 
  // OR we can just rely on the parent to handle the resize logic and pass the correct view name
  // to a ref-based effect. 
  
  // However, the original code used `initialView={calendarView}` and forced re-render or trusted it.
  // Actually, changing `initialView` prop doesn't change the view after mount.
  // We should use a ref to change it properly.
  
  const calendarRef = React.useRef<FullCalendar>(null);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  }, [view]);

  return (
    <div className="relative rounded-xl border border-border/50 shadow-strong overflow-hidden backdrop-blur-xl bg-gradient-to-br from-card via-card/95 to-card/90">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none z-0"></div>
      <div className="relative z-10 p-3 sm:p-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          height="auto"
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          views={{
            dayGridMonth: {
              titleFormat: { year: "numeric", month: "long" },
              dayHeaderFormat: { weekday: "short" },
            },
            timeGridWeek: {
              titleFormat: { year: "numeric", month: "short", day: "numeric" },
              dayHeaderFormat: { weekday: "short", day: "numeric" },
            },
            timeGridDay: {
              titleFormat: { year: "numeric", month: "short", day: "numeric" },
            },
          }}
          dayMaxEvents={3}
          moreLinkClick="popover"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={true}
          firstDay={1}
          weekends={true}
          editable={false}
          selectable={true}
          selectMirror={true}
          eventMaxStack={3}
          // Hook into datesSet to update parent state if user manually changes view
          datesSet={(arg) => {
             // Avoid infinite loop if view is the same
             if (arg.view.type !== view) {
                onViewChange(arg.view.type);
             }
          }}
        />
      </div>
    </div>
  );
}
