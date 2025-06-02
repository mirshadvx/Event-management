import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, Calendar, ChevronDown, MapPin, Star, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import api from "@/services/api";
import { toast } from "sonner";
import { HiChevronDoubleUp } from "react-icons/hi";
import { HashLoader } from "react-spinners";
import { v4 as uuidv4 } from "uuid";
import { generateKitToken, createZegoInstance, joinRoomAsAudience, destroyZegoInstance } from "@/services/ZegoService";
import ReviewModal from "@/components/user/Dashboard/ReviewModal";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogPortal,
    DialogOverlay,
} from "@/components/ui/dialog";

const Participated_Outlet = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [timeFilter, setTimeFilter] = useState("All");
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const observer = useRef();
    const [initialLoad, setInitialLoad] = useState(true);
    const [isWatchLiveModalOpen, setIsWatchLiveModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const liveStreamRef = useRef(null);
    const zegoInstanceRef = useRef(null);

    const categories = ["Conference", "Workshop", "Seminar"];
    const timeFilters = ["All", "Today", "Week", "Month", "Custom"];

    const handleCustomDateReset = () => {
        setCustomStartDate(null);
        setCustomEndDate(null);
        setTimeFilter("All");
    };

    const EVENTS_PER_PAGE = 3;

    const fetchEvents = useCallback(
        async (pageNum, reset = false) => {
            setLoading(true);
            try {
                const params = {
                    page: pageNum,
                    limit: EVENTS_PER_PAGE,
                    search: searchQuery,
                    time_filter: timeFilter === "Custom" ? null : timeFilter,
                    category: category === "All Categories" ? null : category,
                    start_date: customStartDate ? format(customStartDate, "yyyy-MM-dd") : null,
                    end_date: customEndDate ? format(customEndDate, "yyyy-MM-dd") : null,
                    participated: true,
                };

                const response = await api.get("organizer/participated-list/", { params });
                const newEvents = response.data.results || response.data;

                setEvents((prevEvents) => {
                    if (reset || pageNum === 1) return newEvents;
                    const existingIds = new Set(prevEvents.map((event) => event.id));
                    const uniqueNewEvents = newEvents.filter((event) => !existingIds.has(event.id));
                    return [...prevEvents, ...uniqueNewEvents];
                });

                setHasMore(response.data.next !== null);
            } catch (error) {
                console.error("Error fetching events:", error);
                if (error.response?.status !== 404) {
                    toast.error("Failed to load events");
                }
            } finally {
                setLoading(false);
                setInitialLoad(false);
            }
        },
        [searchQuery, category, timeFilter, customStartDate, customEndDate]
    );

    const watchLiveStream = async (event) => {
        try {
            const response = await api.get(`event/stream/${event.id}/`);
            const { room_id } = response.data;

            const userID = `participant_${Math.random().toString(36).substring(2)}`;
            const userName = `Participant_${Math.random().toString(36).substring(2)}`;

            const kitToken = generateKitToken(room_id, userID, userName);

            const zp = createZegoInstance(kitToken);
            zegoInstanceRef.current = zp;

            joinRoomAsAudience(zp, liveStreamRef.current);

            toast.success("Joined live stream successfully!");
        } catch (error) {
            console.error("Error joining live stream:", error);
            toast.error("Failed to join live stream");
            if (liveStreamRef.current) {
                liveStreamRef.current.innerHTML = '<p class="text-red-500">No active stream available</p>';
            }
        }
    };

    const cleanupStream = () => {
        destroyZegoInstance(zegoInstanceRef.current);
        zegoInstanceRef.current = null;
    };

    useEffect(() => {
        setPage(1);
        setEvents([]);
        setHasMore(true);
        fetchEvents(1, true);
    }, [fetchEvents, searchQuery, category, timeFilter, customStartDate, customEndDate]);

    useEffect(() => {
        if (page > 1 && !initialLoad) {
            fetchEvents(page);
        }
    }, [page, fetchEvents, initialLoad]);

    useEffect(() => {
        return () => {
            cleanupStream();
        };
    }, []);

    const lastEventElementRef = useCallback(
        (node) => {
            if (loading || !hasMore || initialLoad) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !loading) {
                    setPage((prev) => prev + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore, initialLoad]
    );

    const toggleEventDetails = (eventId) => {
        setExpandedEventId(expandedEventId === eventId ? null : eventId);
    };

    const formatEventDate = (dateStr) => {
        if (!dateStr) return "";
        return format(new Date(dateStr), "MMM dd, yyyy");
    };

    const formatEventTime = (timeStr) => {
        if (!timeStr) return "";
        return timeStr.substring(0, 5);
    };

    const handleWatchLive = (event) => {
        setSelectedEvent(event);
        setIsWatchLiveModalOpen(true);
        watchLiveStream(event);
    };

    const handleReviewEvent = (event) => {
        setSelectedEvent(event);
        setIsReviewModalOpen(true);
    };

    const handleModalClose = () => {
        cleanupStream();
        setIsWatchLiveModalOpen(false);
        setSelectedEvent(null);
    };

    const handleReviewModalClose = () => {
        setIsReviewModalOpen(false);
        setSelectedEvent(null);
    };

    const handleReviewSubmitted = () => {
        fetchEvents(1, true);
    };

    return (
        <div className="bg-[#444444] p-1 sm:p-3 min-h-screen mx-2 sm:mx-10 rounded-2xl mt-2">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex sm:flex-row gap-4 justify-between mb-2">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search Events"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <NavLink to="/dashboard/create-event/">
                            <Button className="bg-[#2b2b2b] text-white">Create Event</Button>
                        </NavLink>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2 hover:text-white"
                                >
                                    {category}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333]">
                                <DropdownMenuItem
                                    onSelect={() => setCategory("All Categories")}
                                    className="hover:bg-[#333333] focus:bg-[#333333] hover:text-white focus:text-white"
                                >
                                    All Categories
                                </DropdownMenuItem>
                                {categories.map((cat) => (
                                    <DropdownMenuItem
                                        key={cat}
                                        onSelect={() => setCategory(cat)}
                                        className="hover:bg-[#333333] focus:bg-[#333333] hover:text-white focus:text-white"
                                    >
                                        {cat}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2 hover:text-white"
                                >
                                    {timeFilter}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333]">
                                {timeFilters.map((time) => (
                                    <DropdownMenuItem
                                        key={time}
                                        onSelect={() => setTimeFilter(time)}
                                        className="hover:bg-[#333333] focus:bg-[#333333] hover:text-white focus:text-white"
                                    >
                                        {time}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {timeFilter === "Custom" && (
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                        >
                                            <Calendar size={16} />
                                            {customStartDate ? format(customStartDate, "PPP") : "Start Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#2A2A2A] border-[#333333]">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customStartDate}
                                            onSelect={setCustomStartDate}
                                            className="rounded-md border-[#333333] bg-[#2A2A2A] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                        >
                                            <Calendar size={16} />
                                            {customEndDate ? format(customEndDate, "PPP") : "End Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#2A2A2A] border-[#333333]">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customEndDate}
                                            onSelect={setCustomEndDate}
                                            className="rounded-md border-[#333333] bg-[#2A2A2A] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    variant="ghost"
                                    onClick={handleCustomDateReset}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Reset
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-3 flex flex-row justify-between">
                    <div className="flex gap-3">
                        <NavLink
                            to="/dashboard/participated"
                            className={({ isActive }) =>
                                `px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg ${
                                    isActive ? "border-r-2 border-b-2" : "bg-gray-800 hover:bg-gray-700"
                                }`
                            }
                        >
                            Participated
                        </NavLink>
                        <NavLink
                            to="/dashboard/organized"
                            className={({ isActive }) =>
                                `px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg ${
                                    isActive ? "border-r-2 border-b-2" : "bg-gray-800 hover:bg-gray-700"
                                }`
                            }
                        >
                            Organized
                        </NavLink>
                    </div>
                </div>

                {events.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {events.map((event, index) => {
                            const isLastElement = events.length === index + 1;
                            const isExpanded = expandedEventId === event.id;

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
                                                    toggleEventDetails(event.id);
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
                                                        onClick={() => toggleEventDetails(event.id)}
                                                    >
                                                        <X
                                                            size={20}
                                                            className="text-white group-hover:text-black transition-colors duration-200"
                                                        />
                                                    </Button>
                                                </div>

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

                                                    <div>
                                                        <p className="text-gray-400 text-sm">Start</p>
                                                        <p className="text-white">
                                                            {formatEventDate(event.start_date)} at{" "}
                                                            {formatEventTime(event.start_time)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-gray-400 text-sm">End</p>
                                                        <p className="text-white">
                                                            {formatEventDate(event.end_date)} at{" "}
                                                            {formatEventTime(event.end_time)}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-2 mt-4">
                                                        <div className="flex gap-2">
                                                            <Dialog
                                                                open={isWatchLiveModalOpen}
                                                                onOpenChange={handleModalClose}
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="border-gray-600 text-black flex-1"
                                                                        onClick={() => handleWatchLive(event)}
                                                                    >
                                                                        Watch live
                                                                    </Button>
                                                                </DialogTrigger>

                                                                <DialogPortal>
                                                                    <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                                                                    <DialogContent className="bg-white text-black z-50">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Watch Live Stream</DialogTitle>
                                                                            <DialogDescription>
                                                                                Join the live stream for this event.
                                                                            </DialogDescription>
                                                                        </DialogHeader>
                                                                        <div
                                                                            ref={liveStreamRef}
                                                                            className="w-full h-[400px]"
                                                                        />
                                                                        <DialogFooter>
                                                                            <Button
                                                                                variant="outline"
                                                                                onClick={handleModalClose}
                                                                            >
                                                                                Close
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </DialogPortal>
                                                            </Dialog>

                                                            <Button
                                                                size="sm"
                                                                className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1 flex items-center gap-2"
                                                                onClick={() => handleReviewEvent(event)}
                                                            >
                                                                <Star size={16} />
                                                                Review Event
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : !loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="bg-gray-800 rounded-full p-6 mb-4">
                            <Search size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-white text-xl font-semibold">No events found</h3>
                        <p className="text-gray-400 mt-2">Try adjusting your search</p>
                    </div>
                ) : null}

                {loading && (
                    <div className="text-white text-center pt-2 md:pt-27 flex justify-center">
                        <HashLoader color="#54c955" size={57} />
                    </div>
                )}

                {!hasMore && events.length > 0 && (
                    <div className="text-gray-400 text-center py-8 border-t border-gray-800 mt-8">
                        You've reached the end of the list
                    </div>
                )}

                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={handleReviewModalClose}
                    event={selectedEvent}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            </div>
        </div>
    );
};

export default Participated_Outlet;
