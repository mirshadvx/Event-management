import { memo } from "react";
import { Calendar, MapPin, DoorOpen, Users } from "lucide-react";

function EventDetailsCard({ event }) {
  return (
    <div className="bg-[#131226] border border-white/10 rounded-2xl overflow-hidden">
      <div className="h-5 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#131226] via-[#131226]/40 to-transparent" />
        <span className="absolute top-3 left-3 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2.5 py-0.5">
          Assigned Event
        </span>
      </div>

      <div className="p-5">
        <h2 className="text-white font-semibold text-lg leading-tight">
          {event.name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">by {event.organizer}</p>

        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-gray-300">
            <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {new Date(event.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · {event.time}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{event.venue}</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <DoorOpen className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{event.gate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-300">
            <Users className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{event.ticketsSold} tickets sold</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EventDetailsCard);
