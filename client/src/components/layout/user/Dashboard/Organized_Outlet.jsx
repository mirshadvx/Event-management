import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { Search, Calendar, ChevronDown, X, MapPin } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import api from "@/services/api";
import { toast } from "sonner";
import { HashLoader } from "react-spinners";
import { v4 as uuidv4 } from "uuid";
import { generateKitToken, createZegoInstance, joinRoomAsHost, destroyZegoInstance } from "@/services/ZegoService";

import OrganizedEventCard from "@/components/user/Dashboard/OrganizedEventCard";
import OngoingEventCard from "@/components/user/Dashboard/OngoingEventCard";
import DraftedEventCard from "@/components/user/Dashboard/DraftedEventCard";
const OrganizedModal = lazy(() => import("@/components/user/Dashboard/OrganizedModal"));
const OngoingModal = lazy(() => import("@/components/user/Dashboard/OngoingModal"));
const DraftedModal = lazy(() => import("@/components/user/Dashboard/DraftedModal"));

const Organized_Outlet = () => {
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
    const [filterType, setFilterType] = useState("organized");
    const observer = useRef();
    const [initialLoad, setInitialLoad] = useState(true);
    const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const liveStreamRef = useRef(null);
    const zegoInstanceRef = useRef(null);
    const [isStreamLive, setIsStreamLive] = useState(false);
    const [roomID, setRoomID] = useState("");
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [isOrganizedModalOpen, setIsOrganizedModalOpen] = useState(false);
    const [isOngoingModalOpen, setIsOngoingModalOpen] = useState(false);
    const [isDraftedModalOpen, setIsDraftedModalOpen] = useState(false);

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
                };

                if (filterType === "organized") {
                    params.organized = true;
                } else if (filterType === "ongoing") {
                    params.ongoing = true;
                } else if (filterType === "drafted") {
                    params.drafted = true;
                }

                const response = await api.get("organizer/organized-list/", { params });
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
        [searchQuery, category, timeFilter, customStartDate, customEndDate, filterType]
    );

    const checkStreamStatus = async (event) => {
        try {
            const response = await api.get(`event/stream/${event.id}/`);
            if (response.data && response.data.stream_status === "live") {
                setIsStreamLive(true);
                setRoomID(response.data.room_id);
                return response.data.room_id;
            } else {
                setIsStreamLive(false);
                setRoomID("");
            }
            return null;
        } catch (error) {
            console.error("Error checking stream status:", error);
            setIsStreamLive(false);
            return null;
        }
    };

    const startLiveStream = async (event, existingRoomID = null) => {
        try {
            const roomID = existingRoomID || `event_${event.id}_${uuidv4()}`;
            const userID = `organizer_${Math.random().toString(36).substring(2)}`;
            const userName = `Organizer_${event.organizer_name || "Host"}`;

            const kitToken = generateKitToken(roomID, userID, userName);

            const zp = createZegoInstance(kitToken);
            zegoInstanceRef.current = zp;

            joinRoomAsHost(zp, liveStreamRef.current, roomID);

            if (!existingRoomID) {
                await api.post("event/stream/create/", {
                    event_id: event.id,
                    room_id: roomID,
                    stream_status: "live",
                });
            }

            setIsStreamLive(true);
            setRoomID(roomID);
            toast.success("Live stream started successfully!");
        } catch (error) {
            console.error("Error starting live stream:", error);
            toast.error("Failed to start live stream");
        }
    };

    const endLiveStream = async () => {
        try {
            if (selectedEvent && zegoInstanceRef.current) {
                await api.put(`event/stream/${selectedEvent.id}/`, {
                    stream_status: "ended",
                });

                destroyZegoInstance(zegoInstanceRef.current);
                zegoInstanceRef.current = null;

                setIsStreamLive(false);
                setRoomID("");
                toast.success("Live stream ended successfully!");
            }
        } catch (error) {
            console.error("Error ending live stream:", error);
            toast.error("Failed to end live stream");
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
    }, [fetchEvents, searchQuery, category, timeFilter, customStartDate, customEndDate, filterType]);

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

    const handleFilterChange = (type) => {
        setFilterType(type);
        setPage(1);

        setIsStreamLive(false);
        setRoomID("");
        if (zegoInstanceRef.current) {
            cleanupStream();
        }
    };

    const handleGoLive = async (event) => {
        setSelectedEvent(event);
        setIsGoLiveModalOpen(true);

        setIsStreamLive(false);

        const existingRoomID = await checkStreamStatus(event);
        if (existingRoomID) {
            startLiveStream(event, existingRoomID);
        }
    };

    const confirmGoLive = () => {
        if (selectedEvent && !isStreamLive) {
            startLiveStream(selectedEvent);
        }
    };

    const handleModalClose = () => {
        if (!isStreamLive) {
            cleanupStream();
        }
        setIsGoLiveModalOpen(false);
        setSelectedEvent(null);
    };

    const handleOpenOrganizedModal = (eventId) => {
        setSelectedEventId(eventId);
        setIsOrganizedModalOpen(true);
    };

    const handleCloseOrganizedModal = () => {
        setIsOrganizedModalOpen(false);
    };

    const handleOpenOngoingModal = (eventId) => {
        setSelectedEventId(eventId);
        setIsOngoingModalOpen(true);
    };

    const handleCloseOngoingModal = () => {
        setIsOngoingModalOpen(false);
    };

    const handleOpenDraftedModal = () => {
        setIsDraftedModalOpen(true);
    };

    const handleCloseDraftedModal = () => {
        setIsDraftedModalOpen(false);
    };

    const handleEditEvent = (event) => {
        console.log("Edit event:", event);
    };

    const handlePublishEvent = async (event) => {
        try {
            await api.put(`event/${event.id}/publish/`);
            toast.success("Event published successfully!");

            fetchEvents(1, true);
        } catch (error) {
            console.error("Error publishing event:", error);
            toast.error("Failed to publish event");
        }
    };

    const renderEventCard = (event, index) => {
        const isLastElement = events.length === index + 1;
        const isExpanded = expandedEventId === event.id;

        const commonProps = {
            event,
            isExpanded,
            onToggleDetails: toggleEventDetails,
            isLastElement,
            lastEventElementRef,
        };

        switch (filterType) {
            case "organized":
                return (
                    <OrganizedEventCard
                        key={event.id}
                        {...commonProps}
                        onAnalyticsClick={() => handleOpenOrganizedModal(event.id)}
                        onGoLiveClick={handleGoLive}
                    />
                );
            case "ongoing":
                return (
                    <OngoingEventCard
                        key={event.id}
                        {...commonProps}
                        onAnalyticsClick={() => handleOpenOngoingModal(event.id)}
                        onGoLiveClick={handleGoLive}
                    />
                );
            case "drafted":
                return (
                    <DraftedEventCard
                        key={event.id}
                        {...commonProps}
                        onAnalyticsClick={handleOpenOngoingModal}
                        onGoLiveClick={handleGoLive}
                    />
                );
            default:
                return null;
        }
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
                    <div className="flex gap-1">
                        <Button
                            className={`${filterType === "organized" ? "bg-[#3b3b3b]" : "bg-[#2b2b2b]"} text-white`}
                            onClick={() => handleFilterChange("organized")}
                        >
                            Organized
                        </Button>
                        <Button
                            className={`${filterType === "ongoing" ? "bg-[#3b3b3b]" : "bg-[#2b2b2b]"} text-white`}
                            onClick={() => handleFilterChange("ongoing")}
                        >
                            Ongoing
                        </Button>
                        <Button
                            className={`${filterType === "drafted" ? "bg-[#3b3b3b]" : "bg-[#2b2b2b]"} text-white`}
                            onClick={() => handleFilterChange("drafted")}
                        >
                            Drafted
                        </Button>
                    </div>
                </div>

                {events.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {events.map((event, index) => renderEventCard(event, index))}
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
            </div>

            <Dialog open={isGoLiveModalOpen} onOpenChange={handleModalClose}>
                <DialogPortal>
                    <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                    <DialogContent className="bg-white text-black z-50">
                        <DialogHeader>
                            <DialogTitle>Go Live</DialogTitle>
                            <DialogDescription>
                                {isStreamLive
                                    ? "Your stream is live. You can end it below."
                                    : "Start the live stream for this event."}
                            </DialogDescription>
                        </DialogHeader>
                        <div ref={liveStreamRef} className="w-full h-96" />
                        <DialogFooter className="flex flex-row justify-end gap-2">
                            <Button variant="outline" onClick={handleModalClose}>
                                Cancel
                            </Button>
                            {isStreamLive ? (
                                <Button variant="destructive" onClick={endLiveStream}>
                                    End Stream
                                </Button>
                            ) : (
                                <Button onClick={confirmGoLive}>Start Stream</Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </DialogPortal>
            </Dialog>

            <Suspense fallback={<HashLoader color="#54c955" size={57} />}>
                <OrganizedModal
                    isOpen={isOrganizedModalOpen}
                    onClose={handleCloseOrganizedModal}
                    eventId={selectedEventId}
                />
                <OngoingModal isOpen={isOngoingModalOpen} onClose={handleCloseOngoingModal} eventId={selectedEventId} />
                <DraftedModal isOpen={isDraftedModalOpen} onClose={handleCloseDraftedModal} />
            </Suspense>
        </div>
    );
};

export default Organized_Outlet;
