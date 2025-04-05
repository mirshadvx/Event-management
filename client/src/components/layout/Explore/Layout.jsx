import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import EventDetailModal from "@/components/user/Explore/EventDetailModal";
import { toast } from "sonner";

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
        alert(`Latitude: ${newLocation.latitude}, Longitude: ${newLocation.longitude}`);
    }
    function error(err) {
        switch (err.code) {
            case err.PERMISSION_DENIED:
                toast.error("Allow the get location permissoin.");
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

    const fetchEvents = useCallback(async (pageNum) => {
        setLoading(true);
        try {
            const response = await api.get("event/preview-explore/", {
                params: {
                    page: pageNum,
                    limit: EVENTS_PER_PAGE,
                },
            });
            const newEvents = response.data.results || response.data;
            setEvents((prevEvents) => {
                const existingIds = new Set(prevEvents.map((event) => event.id));
                const uniqueNewEvents = newEvents.filter((event) => !existingIds.has(event.id));
                return [...prevEvents, ...uniqueNewEvents];
            });
            setHasMore(response.data.next !== null);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setEvents([]);
        fetchEvents(1);
        getlocation();
    }, [fetchEvents, getlocation]);

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

    return (
        <div className="bg-[#181717] pt-2 pl-6 pr-6 min-h-screen mx-10 rounded-2xl">
            <div className="max-w-[1400px] mx-auto pt-4">
                {/* Search and Filters */}
                <div className="flex lg:flex-row gap-4 justify-between mb-1.5">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Accounts or Events"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-grow max-w-md">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search Location"
                                className="w-[200px] h-10 pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none"
                            />
                        </div>
                        <Select>
                            <SelectTrigger className="w-[100px] bg-[#2A2A2A] text-white border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
                                {eventFilters.category.map((item) => (
                                    <SelectItem key={item} value={item} className="hover:bg-gray-700 px-3 py-2 rounded-md">
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[80px] bg-[#2A2A2A] text-white border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500">
                                <SelectValue placeholder="Time" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
                                {eventFilters.time.map((item) => (
                                    <SelectItem key={item} value={item} className="hover:bg-gray-700 px-3 py-2 rounded-md">
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[80px] bg-[#2A2A2A] text-white border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
                                {eventFilters.type.map((item) => (
                                    <SelectItem key={item} value={item} className="hover:bg-gray-700 px-3 py-2 rounded-md">
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select>
                            <SelectTrigger className="w-[108px] bg-[#2A2A2A] text-white border border-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500">
                                <SelectValue placeholder="Popularity" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
                                {eventFilters.popularity.map((item) => (
                                    <SelectItem key={item} value={item} className="hover:bg-gray-700 px-3 py-2 rounded-md">
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="w-full grid grid-cols-4 gap-0.5 px-20 pt-2">
                    {events.map((event, index) => {
                        const isLastElement = events.length === index + 1;
                        return (
                            <div
                                key={event.id}
                                ref={isLastElement ? lastEventElementRef : null}
                                className="relative group cursor-pointer"
                                onClick={() => handleEventClick(event)}
                            >
                                <div
                                    className="aspect-[3/5] bg-cover bg-center bg-gray-200"
                                    style={{
                                        backgroundImage: event.event_banner ? `url(${event.event_banner})` : "none",
                                    }}
                                ></div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                    {/* <p className="text-lg font-semibold drop-shadow-lg">{event.like_count} Likes</p>
                                    <p className="text-md drop-shadow-lg">{event.comment_count} Comments</p> */}
                                    <p className="text-lg font-semibold drop-shadow-lg">{event.like_count} Likes</p>
                                    <p className="text-md drop-shadow-lg">{event.comment_count} Comments</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <div className="text-white text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
                        <span className="ml-2">Loading more events...</span>
                    </div>
                )}

                {!hasMore && events.length > 0 && <div className="text-white text-center py-4">No more events to load</div>}
            </div>
            {/* {showModal && <EventDetailModal id={selectedEvent?.id} onClose={handleCloseModal} />} */}
            {showModal && (
                <EventDetailModal id={selectedEvent?.id} onClose={handleCloseModal} onEventUpdate={handleEventUpdate} />
            )}
        </div>
    );
};

export default Layout;