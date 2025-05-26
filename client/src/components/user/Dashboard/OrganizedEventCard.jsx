import React, { useState, useEffect } from "react";
import { MapPin, X, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HiChevronDoubleUp } from "react-icons/hi";
import { format } from "date-fns";
import { getRevenueDetails } from "@/services/user/dashboard/dashboardService";

const OrganizedEventCard = ({
    event,
    isExpanded,
    onToggleDetails,
    onAnalyticsClick,
    onGoLiveClick,
    isLastElement,
    lastEventElementRef,
}) => {
    const [revenueDetails, setRevenueDetails] = useState(null);
    const [loadingRevenue, setLoadingRevenue] = useState(false);

    const formatEventDate = (dateStr) => {
        if (!dateStr) return "";
        return format(new Date(dateStr), "MMM dd, yyyy");
    };

    const formatEventTime = (timeStr) => {
        if (!timeStr) return "";
        return timeStr.substring(0, 5);
    };

    const formatDistributedDate = (dateStr) => {
        if (!dateStr) return "Not distributed";
        return format(new Date(dateStr), "MMM dd, yyyy 'at' HH:mm");
    };

    useEffect(() => {
        const fetchRevenueDetails = async () => {
            if (isExpanded && !revenueDetails && !loadingRevenue) {
                setLoadingRevenue(true);
                try {
                    const data = await getRevenueDetails(event.id);
                    setRevenueDetails(data);
                } catch (error) {
                    console.error("Failed to fetch revenue details:", error);
                } finally {
                    setLoadingRevenue(false);
                }
            }
        };

        fetchRevenueDetails();
    }, [isExpanded, event.id, revenueDetails, loadingRevenue]);

    const getStatusColor = () => {
        if (event.is_published) {
            return revenueDetails?.is_distributed ? "text-green-400" : "text-yellow-400";
        }
        return "text-gray-400";
    };

    const getStatusText = () => {
        if (!event.is_published) return "Draft";
        return revenueDetails?.is_distributed ? "Revenue Distributed" : "Published";
    };

    return (
        <div
            key={event.id}
            ref={isLastElement ? lastEventElementRef : null}
            className="relative rounded-md overflow-hidden shadow-lg"
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
                    <div className="p-4 h-full overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">{event.event_type}</h3>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="group p-1"
                                onClick={() => onToggleDetails(event.id)}
                            >
                                <X
                                    size={20}
                                    className="text-white group-hover:text-gray-300 transition-colors duration-200"
                                />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex gap-5">
                                    <div>
                                        <p className="text-gray-400 text-sm flex items-center">
                                            Event Title
                                        </p>
                                        <p className="text-white">{event.event_title}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm flex items-center">
                                            <MapPin size={14} className="mr-1" /> Venue
                                        </p>
                                        <p className="text-white">{event.venue_name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400 text-sm flex items-center">
                                            <Calendar size={14} className="mr-1" /> Start
                                        </p>
                                        <p className="text-white text-sm">{formatEventDate(event.start_date)}</p>
                                        <p className="text-white text-sm">{formatEventTime(event.start_time)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm flex items-center">
                                            <Calendar size={14} className="mr-1" /> End
                                        </p>
                                        <p className="text-white text-sm">{formatEventDate(event.end_date)}</p>
                                        <p className="text-white text-sm">{formatEventTime(event.end_time)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm">Status</p>
                                    <p className={`font-medium ${getStatusColor()}`}>{getStatusText()}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-600 pt-4">
                                <h4 className="text-white font-semibold mb-3 flex items-center">
                                    <TrendingUp size={16} className="mr-2" />
                                    Revenue Details
                                </h4>

                                {loadingRevenue ? (
                                    <div className="text-gray-400 text-sm">Loading revenue details...</div>
                                ) : revenueDetails ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-700/50 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs flex items-center">
                                                    <Users size={12} className="mr-1" /> Participants
                                                </p>
                                                <p className="text-white font-bold text-lg">
                                                    {revenueDetails.total_participants?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                            <div className="bg-gray-700/50 rounded-lg p-3">
                                                <p className="text-gray-400 text-xs flex items-center">Total Revenue</p>
                                                <p className="text-green-400 font-bold text-lg">
                                                    {revenueDetails.total_revenue}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">Your Share</span>
                                                <span className="text-green-400 font-semibold">
                                                    {revenueDetails.organizer_amount}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">
                                                    Platform Fee ({revenueDetails.admin_percentage}%)
                                                </span>
                                                <span className="text-red-400 font-semibold">
                                                    -{revenueDetails.admin_amount}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-700/30 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-400 text-sm">Distribution Status</span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        revenueDetails.is_distributed
                                                            ? "bg-green-600 text-green-100"
                                                            : "bg-yellow-600 text-yellow-100"
                                                    }`}
                                                >
                                                    {revenueDetails.is_distributed ? "Distributed" : "Pending"}
                                                </span>
                                            </div>
                                            {revenueDetails.is_distributed && (
                                                <p className="text-gray-300 text-xs">
                                                    Distributed on {formatDistributedDate(revenueDetails.distributed_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm">Revenue details not available</div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {/* <div className="flex justify-between mt-6 pt-4 border-t border-gray-600">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-white hover:bg-gray-700"
                                    onClick={() => onAnalyticsClick(event)}
                                >
                                    <TrendingUp size={14} className="mr-1" />
                                    Analytics
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-white hover:bg-gray-700"
                                    onClick={() => onGoLiveClick(event)}
                                >
                                    Go Live
                                </Button>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizedEventCard;
