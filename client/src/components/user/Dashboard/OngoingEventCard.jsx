import React from "react";
import { MapPin, X, Users, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiChevronDoubleUp } from "react-icons/hi";
import { format } from "date-fns";

const OngoingEventCard = ({
    event,
    isExpanded,
    onToggleDetails,
    onAnalyticsClick,
    onGoLiveClick,
    isLastElement,
    lastEventElementRef,
}) => {
    const formatEventDate = (dateStr) => {
        if (!dateStr) return "";
        return format(new Date(dateStr), "MMM dd, yyyy");
    };

    const formatEventTime = (timeStr) => {
        if (!timeStr) return "";
        return timeStr.substring(0, 5);
    };

    return (
        <div
            key={event.id}
            ref={isLastElement ? lastEventElementRef : null}
            className="relative rounded-md overflow-hidden shadow-lg border-2 border-green-500"
        >
            <div className="relative">
                <div
                    className="aspect-[3/4] bg-cover bg-center"
                    style={{
                        backgroundImage: event.event_banner
                            ? `url(${event.event_banner})`
                            : "url('/placeholder-event.jpg')",
                    }}
                >
                    {!event.event_banner && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <span className="text-gray-400">No Image</span>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-3 flex justify-end items-center">
                    <Button
                        variant="outline"
                        className="bg-[#2A2A2A]/90 border-none text-white rounded-t-md rounded-b-none justify-center gap-1 py-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleDetails(event.id);
                        }}
                    >
                        <HiChevronDoubleUp className="text-4xl" />
                    </Button>
                </div>

                <div
                    className={`absolute left-0 right-0 bottom-0 bg-[#2A2A2A] transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded ? "h-full" : "h-0"
                    }`}
                >
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">{event.event_type}</h3>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="group p-1"
                                onClick={() => onToggleDetails(event.id)}
                            >
                                <X size={20} className="text-white group-hover:text-black transition-colors duration-200" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-5">
                                <div>
                                    <p className="text-gray-400 text-sm flex items-center">Event Title</p>
                                    <p className="text-white">{event.event_title}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm flex items-center">
                                        <MapPin size={14} className="mr-1" /> Venue
                                    </p>
                                    <p className="text-white">{event.venue_name}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Started</p>
                                <p className="text-white flex items-center">
                                    <Clock size={16} className="mr-1 text-green-400" />
                                    {formatEventDate(event.start_date)} at {formatEventTime(event.start_time)}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-400 text-sm">Ends</p>
                                <p className="text-white">
                                    {formatEventDate(event.end_date)} at {formatEventTime(event.end_time)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <p className="text-gray-400 text-sm">Status</p>
                                    <p className="text-green-400 font-semibold">Ongoing</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Stream Quality</p>
                                    <p className="text-white">{event.stream_quality || "HD"}</p>
                                </div>
                            </div>

                            <div className="flex justify-between mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-black"
                                    onClick={onAnalyticsClick}
                                >
                                    Analytics
                                </Button>

                                <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg flex items-center gap-2 font-semibold"
                                    onClick={() => onGoLiveClick(event)}
                                >
                                    <Radio className="h-4 w-4" />
                                    Go Live
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OngoingEventCard;
