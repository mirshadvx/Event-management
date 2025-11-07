import React, { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { Search, Calendar, ChevronDown, X, MapPin, Menu, Radio, Users, Video, VideoOff, Loader2 } from "lucide-react";
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
import WebRTCService from "@/services/WebRTCService";

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
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const observer = useRef();
    const [initialLoad, setInitialLoad] = useState(true);
    const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const liveStreamRef = useRef(null);
    const videoRef = useRef(null);
    const [streamReady, setStreamReady] = useState(false);
    const [isStreamLive, setIsStreamLive] = useState(false);
    const [roomID, setRoomID] = useState("");
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [participantCount, setParticipantCount] = useState(0);

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
            console.log("[Organized_Outlet] Starting live stream for event:", event.id);
            const roomID = existingRoomID || `event_${event.id}_${uuidv4()}`;
            console.log("[Organized_Outlet] Room ID:", roomID);

            if (!existingRoomID) {
                console.log("[Organized_Outlet] Creating stream record in backend");
                await api.post("event/stream/create/", {
                    event_id: event.id,
                    room_id: roomID,
                    stream_status: "live",
                });
                console.log("[Organized_Outlet] Stream record created");
            }

            setStreamReady(false);
            setIsStreamLive(true);
            setRoomID(roomID);

            await new Promise((resolve) => setTimeout(resolve, 100));

            if (!videoRef.current) {
                throw new Error("Video element not available");
            }

            console.log("[Organized_Outlet] Video element ready, joining as host");
            
            WebRTCService.setOnUserJoined((userId, userName) => {
                console.log(`[Organized_Outlet] User joined: ${userName} (${userId})`);
                setParticipantCount((prev) => prev + 1);
            });

            WebRTCService.setOnUserLeft((userId) => {
                console.log(`[Organized_Outlet] User left: ${userId}`);
                setParticipantCount((prev) => Math.max(0, prev - 1));
            });

            WebRTCService.setOnStreamEnded(() => {
                console.log("[Organized_Outlet] Stream ended callback triggered");
                setIsStreamLive(false);
                setRoomID("");
                setStreamReady(false);
                setParticipantCount(0);
                toast.info("Stream ended");
            });

            await WebRTCService.joinAsHost(roomID, videoRef.current);
            console.log("[Organized_Outlet] Successfully joined as host");
            const checkAndSetReady = () => {
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject;
                    const videoTracks = stream.getVideoTracks();
                    if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
                        console.log("[Organized_Outlet] Stream attached and ready");
                        setStreamReady(true);
                        return true;
                    }
                }
                return false;
            };

            const originalOnLoadedMetadata = videoRef.current.onloadedmetadata;
            videoRef.current.onloadedmetadata = () => {
                console.log("[Organized_Outlet] Video metadata loaded");
                if (originalOnLoadedMetadata) originalOnLoadedMetadata();
                checkAndSetReady();
            };

            if (checkAndSetReady()) {
            } else {
                const interval = setInterval(() => {
                    if (checkAndSetReady()) {
                        clearInterval(interval);
                    }
                }, 200);
                
                setTimeout(() => {
                    clearInterval(interval);
                    if (videoRef.current && videoRef.current.srcObject) {
                        setStreamReady(true);
                    }
                }, 5000);
            }

            toast.success("Live stream started successfully!");
        } catch (error) {
            console.error("[Organized_Outlet] Error starting live stream:", error);
            toast.error("Failed to start live stream: " + (error.message || "Unknown error"));
            setIsStreamLive(false);
            setStreamReady(false);
            cleanupStream();
        }
    };

    const endLiveStream = async () => {
        try {
            if (selectedEvent) {
                await api.put(`event/stream/${selectedEvent.id}/`, {
                    stream_status: "ended",
                });

                await WebRTCService.endStream();
                cleanupStream();

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
        console.log("[Organized_Outlet] Cleaning up stream");
        WebRTCService.cleanup();
        setStreamReady(false);
        setParticipantCount(0);
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
        setShowMobileFilters(false);

        setIsStreamLive(false);
        setRoomID("");
        cleanupStream();
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

    const toggleMobileFilters = () => {
        setShowMobileFilters(!showMobileFilters);
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
                        onAnalyticsClick={handleOpenDraftedModal}
                        onGoLiveClick={handleGoLive}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-[#444444] p-1 sm:p-3 min-h-screen mx-2 sm:mx-10 rounded-2xl mt-2 relative">
            {showMobileFilters && (
                <div className="md:hidden flex flex-col gap-3 p-4 bg-[#2A2A2A] rounded-lg absolute right-3 top-13 z-4">
                    <div className="flex flex-col gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#333333] text-white border-none hover:bg-[#444444] flex items-center gap-2 hover:text-white justify-between w-full"
                                >
                                    {category}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333] w-full">
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
                                    className="bg-[#333333] text-white border-none hover:bg-[#444444] flex items-center gap-2 hover:text-white justify-between w-full"
                                >
                                    {timeFilter}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333] w-full">
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
                            <div className="flex flex-col gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#333333] text-white border-none hover:bg-[#444444] flex items-center gap-2 w-full justify-start"
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
                                            className="bg-[#333333] text-white border-none hover:bg-[#444444] flex items-center gap-2 w-full justify-start"
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

                                <Button variant="ghost" onClick={handleCustomDateReset} className="text-gray-400 w-full">
                                    Reset Dates
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex items-center gap-4 justify-between">
                        <div className="relative flex-grow max-w-md">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Search Events"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <NavLink to="/dashboard/create-event/">
                                <Button className="bg-[#2b2b2b] text-white">Create Event</Button>
                            </NavLink>

                            <Button
                                variant="outline"
                                className="md:hidden bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2 hover:text-white"
                                onClick={toggleMobileFilters}
                            >
                                <Menu size={16} />
                                Filters
                            </Button>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-wrap gap-3">
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
                    <div className="flex gap-2">
                        <div className="hidden md:flex gap-2 bg-[#2A2A2A] rounded-lg p-1">
                            {["organized", "ongoing", "drafted"].map((type) => (
                                <Button
                                    key={type}
                                    className={`px-4 py-1.5 text-sm font-medium capitalize rounded-md transition-colors ${
                                        filterType === type
                                            ? "bg-blue-500 text-white"
                                            : "bg-[#2A2A2A] text-white hover:bg-[#333333]"
                                    }`}
                                    onClick={() => handleFilterChange(type)}
                                >
                                    {type}
                                </Button>
                            ))}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="md:hidden bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2 hover:text-white capitalize"
                                >
                                    {filterType}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333]">
                                {["organized", "ongoing", "drafted"].map((type) => (
                                    <DropdownMenuItem
                                        key={type}
                                        onSelect={() => handleFilterChange(type)}
                                        className="hover:bg-[#333333] focus:bg-[#333333] hover:text-white focus:text-white capitalize"
                                    >
                                        {type}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                    <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                    <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white z-50 border-gray-700 max-w-4xl">
                        <DialogHeader className="space-y-3">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    {isStreamLive ? (
                                        <>
                                            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                                            Live Stream
                                        </>
                                    ) : (
                                        <>
                                            <Video className="h-5 w-5" />
                                            Go Live
                                        </>
                                    )}
                                </DialogTitle>
                                {isStreamLive && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50">
                                            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold">LIVE</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/50">
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-medium">{participantCount} viewers</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogDescription className="text-gray-300">
                                {isStreamLive
                                    ? "Your stream is live and viewers can watch. Manage your stream below."
                                    : "Start broadcasting your event live to all registered participants."}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div ref={liveStreamRef} className="w-full h-[500px] bg-black rounded-xl overflow-hidden flex items-center justify-center relative border-2 border-gray-700 shadow-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted={false}
                                className="w-full h-full object-cover"
                                style={{ display: streamReady ? 'block' : 'none' }}
                            />
                            {!streamReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                    {isStreamLive ? (
                                        <>
                                            <Loader2 className="h-12 w-12 text-red-500 animate-spin mb-4" />
                                            <p className="text-white text-lg font-medium">Starting stream...</p>
                                            <p className="text-gray-400 text-sm mt-2">Please wait while we initialize your camera</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-gray-800/50 rounded-full p-6 mb-4 border-2 border-gray-700">
                                                <Video className="h-12 w-12 text-gray-400" />
                                            </div>
                                            <p className="text-white text-lg font-medium">Ready to go live</p>
                                            <p className="text-gray-400 text-sm mt-2">Your video preview will appear here</p>
                                        </>
                                    )}
                                </div>
                            )}
                            {streamReady && isStreamLive && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-semibold text-white">LIVE</span>
                                </div>
                            )}
                        </div>
                        
                        <DialogFooter className="flex flex-row justify-between items-center mt-4">
                            <div className="text-sm text-gray-400">
                                {selectedEvent && (
                                    <span>Event: <span className="text-white font-medium">{selectedEvent.event_title}</span></span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleModalClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                    {isStreamLive ? "Close" : "Cancel"}
                                </Button>
                                {isStreamLive ? (
                                    <Button 
                                        variant="destructive" 
                                        onClick={endLiveStream}
                                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                    >
                                        <VideoOff className="h-4 w-4" />
                                        End Stream
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={confirmGoLive}
                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center gap-2 shadow-lg"
                                    >
                                        <Radio className="h-4 w-4" />
                                        Start Live Stream
                                    </Button>
                                )}
                            </div>
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
