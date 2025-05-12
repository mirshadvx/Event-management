import { CalendarDays, Heart, Users } from "lucide-react";
const EventCard = ({ event }) => {
    return (
        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl">
            <div className="relative">
                <img src={event.image} alt={event.title} className="w-full h-40 md:h-48 object-cover" loading="lazy" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-3 md:p-4">
                    <h3 className="text-base md:text-lg font-bold truncate">{event.title}</h3>
                </div>
            </div>
            <div className="p-3 md:p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center text-slate-300">
                        <CalendarDays size={14} className="mr-1" />
                        <span className="text-xs md:text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center text-slate-300">
                        <Users size={14} className="mr-1" />
                        <span className="text-xs md:text-sm">{event.attendees}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <button className="flex items-center text-slate-300 hover:text-red-400">
                        <Heart size={16} className="mr-1" />
                        <span className="text-sm">{event.likes}</span>
                    </button>
                    <button className="px-3 py-1 bg-green-400 text-slate-900 text-xs md:text-sm font-medium rounded-full hover:bg-green-500 transition-colors duration-300">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
