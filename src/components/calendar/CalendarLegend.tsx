import React from "react";

export function CalendarLegend() {
  return (
    <div className="relative flex flex-wrap items-center gap-4 p-4 rounded-lg border border-border/50 overflow-hidden bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>
      <div className="relative z-10 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 via-green-500 to-green-600 shadow-lg shadow-green-500/50"></div>
          <span className="text-sm font-medium">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/50"></div>
          <span className="text-sm font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 via-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/50"></div>
          <span className="text-sm font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-slate-500 via-slate-500 to-slate-600 shadow-lg shadow-slate-500/50"></div>
          <span className="text-sm font-medium">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 via-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"></div>
          <span className="text-sm font-medium">Offline Booking</span>
        </div>
      </div>
    </div>
  );
}
