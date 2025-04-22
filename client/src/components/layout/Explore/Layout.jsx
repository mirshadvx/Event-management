import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, Menu, X, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import EventDetailModal from "@/components/user/Explore/EventDetailModal";
import { toast } from "sonner";
import { FcLike } from "react-icons/fc";
import { FaComment } from "react-icons/fa";

const eventFilters = {
    category: ["Music", "Education", "Gaming", "Sports", "Art", "Social"],
    location: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
    time: ["Today", "This Week", "This Month", "Upcoming"],
    type: ["Paid", "Free"],
    popularity: ["Most Liked", "Most Attended", "Trending"],
};

const Layout = () => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();
    const [geolocation, setGeolocation] = useState({
        latitude: null,
        longitude: null,
    });
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [locationSearch, setLocationSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState({
        category: null,
        time: null,
        type: null,
        popularity: null,
    });
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);

    useEffect(() => {
        function handleResize() {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth >= 1024 && mobileFiltersOpen) {
                setMobileFiltersOpen(false);
            }
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [mobileFiltersOpen]);

    const getlocation = useCallback(async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(gotLocation, error);
        } else {
            toast.error("Geolocation is not supported");
        }
    }, []);

    function gotLocation(position) {
        const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
        setGeolocation(newLocation);
    }

    function error(err) {
        switch (err.code) {
            case err.PERMISSION_DENIED:
                toast.error("Allow the get location permission.");
                break;
            case err.POSITION_UNAVAILABLE:
                toast.error("Location information is unavailable.");
                break;
            case err.TIMEOUT:
                toast.error("The request to get user location timed out.");
                break;
            default:
                toast.error("An unknown error occurred.");
        }
    }

    const EVENTS_PER_PAGE = 3;

    const fetchEvents = useCallback(
        async (pageNum) => {
            setLoading(true);
            try {
                const response = await api.get("event/preview-explore/", {
                    params: {
                        page: pageNum,
                        limit: EVENTS_PER_PAGE,
                        search: searchQuery,
                        location: locationSearch,
                        category: activeFilters.category || "",
                        time: activeFilters.time || "",
                        type: activeFilters.type || "",
                        sort: activeFilters.popularity || "",
                    },
                });
                const newEvents = response.data.results || response.data;
                setEvents((prevEvents) => {
                    if (pageNum === 1) return newEvents;
                    const existingIds = new Set(prevEvents.map((event) => event.id));
                    const uniqueNewEvents = newEvents.filter((event) => !existingIds.has(event.id));
                    return [...prevEvents, ...uniqueNewEvents];
                });
                setHasMore(response.data.next !== null);
            } catch (error) {
                console.error("Error fetching events:", error);
                toast.error("Failed to load events");
            } finally {
                setLoading(false);
            }
        },
        [searchQuery, locationSearch, activeFilters]
    );

    useEffect(() => {
        setPage(1);
        setEvents([]);
        fetchEvents(1);
    }, [fetchEvents, searchQuery, locationSearch, activeFilters]);

    useEffect(() => {
        getlocation();
    }, [getlocation]);

    const lastEventElementRef = useCallback(
        (node) => {
            if (loading || !hasMore) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    useEffect(() => {
        if (page > 1) {
            fetchEvents(page);
        }
    }, [page, fetchEvents]);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        setShowModal(false);
    };

    const handleEventUpdate = (updatedEvent) => {
        setEvents((prevEvents) => prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
    };

    const handleFilterChange = (type, value) => {
        setActiveFilters((prev) => ({ ...prev, [type]: value }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchEvents(1);
    };

    const toggleMobileFilters = () => {
        setMobileFiltersOpen(!mobileFiltersOpen);
    };

    const renderFilterSelect = (type, placeholder, width = "w-full") => (
        <Select onValueChange={(value) => handleFilterChange(type, value)} value={activeFilters[type] || undefined}>
            <SelectTrigger
                className={`${width} bg-[#2A2A2A] text-white border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500`}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
                <SelectItem value="all" className="hover:bg-gray-700 px-3 py-2 rounded-md">
                    All {placeholder}s
                </SelectItem>
                {eventFilters[type].map((item) => (
                    <SelectItem key={item} value={item} className="hover:bg-gray-700 px-3 py-2 rounded-md">
                        {item}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const isMobileView = windowWidth < 1024;

    return (
        <div className="bg-[#181717] py-3 px-4 sm:px-6 min-h-screen mx-2 md:mt-3 sm:mx-6 lg:mx-10 rounded-xl">
            <div className="max-w-[1400px] mx-auto">
                {isMobileView && (
                    <div className="flex lg:flex-row gap-1 justify-between">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-[38%] transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search Events"
                                className="pl-10 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <MapPin
                                className="absolute left-2 top-[38%] transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search Location"
                                className="w-full pl-7 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={toggleMobileFilters}
                                className="p-3 rounded-lg bg-[#2A2A2A] text-white hover:bg-gray-700 transition-colors"
                                aria-label="Toggle filters"
                            >
                                {mobileFiltersOpen ? <X size={23} /> : <Menu size={23} />}
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSearchSubmit} className="mb-4">
                    {!isMobileView && (
                        <div className="flex md:flex-col lg:flex-row gap-3 justify-between">
                            <div className="relative flex-grow">
                                <Search
                                    className="absolute left-3 top-[44%] transform -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search Events"
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative flex-grow lg:max-w-xs">
                                <MapPin
                                    className="absolute left-3 top-[44%] transform -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Search Location"
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-3 mb-4">
                                {renderFilterSelect("category", "Category", "w-36")}
                                {renderFilterSelect("time", "Time", "w-36")}
                                {renderFilterSelect("type", "Type", "w-32")}
                                {renderFilterSelect("popularity", "Popularity", "w-40")}
                            </div>
                        </div>
                    )}
                </form>

                {mobileFiltersOpen && (
                    <div className="bg-[#222] rounded-lg p-4 mb-4 space-y-3 animate-slideDown">
                        <h2 className="text-white text-lg font-semibold mb-2">Filters</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm">Category</label>
                                {renderFilterSelect("category", "Category")}
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm">Time</label>
                                {renderFilterSelect("time", "Time")}
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm">Type</label>
                                {renderFilterSelect("type", "Type")}
                            </div>
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm">Sort By</label>
                                {renderFilterSelect("popularity", "Popularity")}
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                onClick={toggleMobileFilters}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
                {Object.values(activeFilters).some(Boolean) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {Object.entries(activeFilters).map(([key, value]) =>
                            value && value !== "all" ? (
                                <div
                                    key={key}
                                    className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center"
                                >
                                    {value}
                                    <button className="ml-2 hover:text-white" onClick={() => handleFilterChange(key, null)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : null
                        )}
                        {Object.values(activeFilters).some(Boolean) && (
                            <button
                                className="text-gray-400 hover:text-white text-sm underline"
                                onClick={() =>
                                    setActiveFilters({ category: null, time: null, type: null, popularity: null })
                                }
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}
                {events.length > 0 ? (
                    <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                        {events.map((event, index) => {
                            const isLastElement = events.length === index + 1;
                            return (
                                <div
                                    key={event.id}
                                    ref={isLastElement ? lastEventElementRef : null}
                                    className="relative group cursor-pointer rounded-md overflow-hidden shadow-lg transition-transform hover:scale-105"
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div
                                        className="aspect-[3/4] sm:aspect-[3/5] bg-cover bg-center"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                                        <div className="flex items-center space-x-4 text-sm">
                                            <p className="text-white flex items-center">
                                                <FcLike size={36} />
                                                <span className="text-4xl">{event.like_count || 0}</span>
                                            </p>
                                            <p className="text-white flex items-center">
                                                <FaComment size={26} />
                                                <span className="pl-2 mr-1 text-4xl">{event.comment_count || 0}</span>
                                            </p>
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
                        <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : null}
                {loading && (
                    <div className="text-white text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
                        <p className="mt-2 text-gray-300">Loading events...</p>
                    </div>
                )}
                {!hasMore && events.length > 0 && (
                    <div className="text-gray-400 text-center py-8 border-t border-gray-800 mt-8">
                        You've reached the end of the list
                    </div>
                )}
            </div>

            {showModal && (
                <EventDetailModal id={selectedEvent?.id} onClose={handleCloseModal} onEventUpdate={handleEventUpdate} />
            )}
        </div>
    );
};

export default Layout;
