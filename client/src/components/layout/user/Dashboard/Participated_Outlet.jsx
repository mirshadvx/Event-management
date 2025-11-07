import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, Calendar, ChevronDown, MapPin, Star, X, Menu, Radio, Users, Loader2, Wifi, WifiOff } from "lucide-react";
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
import WebRTCService from "@/services/WebRTCService";
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
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const observer = useRef();
    const [initialLoad, setInitialLoad] = useState(true);
    const [isWatchLiveModalOpen, setIsWatchLiveModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const liveStreamRef = useRef(null);
    const videoRef = useRef(null);
    const [streamReady, setStreamReady] = useState(false);
    const streamStartedRef = useRef(false);
    const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected

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
            console.log("[Participated_Outlet] Watching live stream for event:", event.id);
            
            let retries = 0;
            const maxRetries = 10;
            while (!videoRef.current && retries < maxRetries) {
                console.log(`[Participated_Outlet] Waiting for video element... (attempt ${retries + 1}/${maxRetries})`);
                await new Promise((resolve) => setTimeout(resolve, 100));
                retries++;
            }

            if (!videoRef.current) {
                throw new Error("Video element not available after waiting");
            }

            console.log("[Participated_Outlet] Video element ready, fetching stream info");
            const response = await api.get(`event/stream/${event.id}/`);
            const { room_id } = response.data;
            console.log("[Participated_Outlet] Room ID:", room_id);

            setStreamReady(false);

            console.log("[Participated_Outlet] Video element ready, joining as participant");

            setConnectionStatus("connecting");
            WebRTCService.setOnRemoteStream((stream, userId) => {
                console.log("[Participated_Outlet] Remote stream received from:", userId);
                if (videoRef.current && videoRef.current.srcObject !== stream) {
                    videoRef.current.srcObject = stream;
                    const playPromise = videoRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log("[Participated_Outlet] Remote stream playing");
                                setStreamReady(true);
                                setConnectionStatus("connected");
                            })
                            .catch(err => {
                                if (err.name !== 'AbortError') {
                                    console.error("[Participated_Outlet] Error playing video:", err);
                                } else {
                                    setStreamReady(true);
                                    setConnectionStatus("connected");
                                }
                            });
                    } else {
                        setStreamReady(true);
                        setConnectionStatus("connected");
                    }
                }
            });

            WebRTCService.setOnStreamEnded(() => {
                console.log("[Participated_Outlet] Stream ended callback triggered");
                toast.info("Stream ended by host");
                setStreamReady(false);
                setConnectionStatus("disconnected");
                cleanupStream();
            });

            await WebRTCService.joinAsParticipant(room_id, videoRef.current);
            console.log("[Participated_Outlet] Successfully joined as participant");

            toast.success("Joined live stream successfully!");
        } catch (error) {
            console.error("[Participated_Outlet] Error joining live stream:", error);
            toast.error("Failed to join live stream: " + (error.message || "Unknown error"));
            setStreamReady(false);
            cleanupStream();
        }
    };

    const cleanupStream = () => {
        console.log("[Participated_Outlet] Cleaning up stream");
        WebRTCService.cleanup();
        setStreamReady(false);
        setConnectionStatus("disconnected");
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
        if (isWatchLiveModalOpen && selectedEvent && !streamStartedRef.current) {
            console.log("[Participated_Outlet] Dialog opened, waiting for video element");
            streamStartedRef.current = true;
            
            const checkVideoElement = () => {
                if (videoRef.current) {
                    console.log("[Participated_Outlet] Video element available, starting stream");
                    watchLiveStream(selectedEvent);
                    return true;
                }
                return false;
            };

            if (checkVideoElement()) {
                return;
            }

            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                attempts++;
                if (checkVideoElement() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts && !videoRef.current) {
                        console.error("[Participated_Outlet] Video element not available after polling");
                        toast.error("Failed to initialize video element");
                        streamStartedRef.current = false;
                    }
                }
            }, 100);

            return () => {
                clearInterval(interval);
            };
        } else if (!isWatchLiveModalOpen) {
            streamStartedRef.current = false;
        }
    }, [isWatchLiveModalOpen, selectedEvent]);

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
        // Don't call watchLiveStream here - wait for dialog to open via useEffect
    };

    const handleReviewEvent = (event) => {
        setSelectedEvent(event);
        setIsReviewModalOpen(true);
    };

    const handleModalClose = () => {
        console.log("[Participated_Outlet] Closing modal, cleaning up stream");
        cleanupStream();
        streamStartedRef.current = false;
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

    const toggleMobileFilters = () => {
        setShowMobileFilters(!showMobileFilters);
    };

    return (
        <div className="bg-[#444444] p-1 sm:p-3 min-h-screen mx-2 sm:mx-10 rounded-2xl mt-2 relative">
            {showMobileFilters && (
                <div className="md:hidden flex flex-col gap-3 p-4 bg-[#2A2A2A] rounded-lg absolute right-3 top-13">
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

                                <Button variant="ghost" onClick={handleCustomDateReset} className="text-gray-400  w-full">
                                    Reset Dates
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="max-w-[1400px] mx-auto">
                {/* Header Section */}
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
                                                                onOpenChange={(open) => {
                                                                    if (!open) {
                                                                        handleModalClose();
                                                                    }
                                                                }}
                                                            >
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg flex-1 flex items-center gap-2 font-semibold"
                                                                        onClick={() => handleWatchLive(event)}
                                                                    >
                                                                        <Radio className="h-4 w-4" />
                                                                        Watch Live
                                                                    </Button>
                                                                </DialogTrigger>

                                                                {isWatchLiveModalOpen && (
                                                                    <DialogPortal>
                                                                        <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
                                                                        <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white z-50 border-gray-700 max-w-5xl">
                                                                            <DialogHeader className="space-y-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                                                                        <Radio className="h-5 w-5 text-red-500" />
                                                                                        Live Stream
                                                                                    </DialogTitle>
                                                                                    {connectionStatus === "connected" && (
                                                                                        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50">
                                                                                            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                                                                                            <span className="text-sm font-semibold">LIVE</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <DialogDescription className="text-gray-300">
                                                                                    {selectedEvent && (
                                                                                        <span>Watching: <span className="text-white font-medium">{selectedEvent.event_title}</span></span>
                                                                                    )}
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <div
                                                                                ref={liveStreamRef}
                                                                                className="w-full h-[500px] bg-black rounded-xl overflow-hidden flex items-center justify-center relative border-2 border-gray-700 shadow-2xl"
                                                                            >
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
                                                                                        {connectionStatus === "connecting" ? (
                                                                                            <>
                                                                                                <Loader2 className="h-12 w-12 text-red-500 animate-spin mb-4" />
                                                                                                <p className="text-white text-lg font-medium">Connecting to stream...</p>
                                                                                                <p className="text-gray-400 text-sm mt-2">Please wait while we establish the connection</p>
                                                                                                <div className="mt-4 flex items-center gap-2 text-gray-500">
                                                                                                    <Wifi className="h-4 w-4" />
                                                                                                    <span className="text-xs">Establishing connection</span>
                                                                                                </div>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <div className="bg-gray-800/50 rounded-full p-6 mb-4 border-2 border-gray-700">
                                                                                                    <Radio className="h-12 w-12 text-gray-400" />
                                                                                                </div>
                                                                                                <p className="text-white text-lg font-medium">Waiting for stream</p>
                                                                                                <p className="text-gray-400 text-sm mt-2">The stream will appear here when available</p>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                {streamReady && connectionStatus === "connected" && (
                                                                                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                                                                                        <span className="text-xs font-semibold text-white">LIVE</span>
                                                                                    </div>
                                                                                )}
                                                                                {connectionStatus === "connected" && (
                                                                                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                                                        <Wifi className="h-3 w-3 text-green-400" />
                                                                                        <span className="text-xs font-medium text-white">Connected</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <DialogFooter className="flex flex-row justify-end mt-4">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    onClick={handleModalClose}
                                                                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                                                >
                                                                                    Close
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </DialogPortal>
                                                                )}
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
