import React, { useState, useMemo, useEffect } from "react";
import { Calendar, MapPin, Users, Eye } from "lucide-react";
import { FaHeart } from "react-icons/fa";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { GiTicket } from "react-icons/gi";
import EventDetailModal from "@/components/user/Explore/EventDetailModal";
import api from "@/services/api";
import { MdGroups } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Show_coupons from "@/components/common/user/Profile/Event/Show_coupons";

const EventOutlet = () => {
    const [activeTab, setActiveTab] = useState("joined");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [joinedBookings, setJoinedBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCouponsModal, setShowCouponsModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);

    const fetchJoinedBookings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/users/my-events/");
            setJoinedBookings(response.data);
        } catch (err) {
            setError("Failed to fetch bookings");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJoinedBookings();
    }, []);

    const organizedEventsData = useMemo(() => [], []);

    const handleEventClick = (booking) => {
        setSelectedEvent(booking.event);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        setShowModal(false);
    };

    const handleShowCoupons = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowCouponsModal(true);
    };

    const handleCloseCoupons = () => {
        setSelectedBookingId(null);
        setShowCouponsModal(false);
    };

    const handleEventUpdate = (updatedEvent) => {
        setSelectedEvent(updatedEvent);
        if (activeTab === "joined") {
            setJoinedBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking.event.id === updatedEvent.id ? { ...booking, event: updatedEvent } : booking
                )
            );
        }
    };

    const formatDate = (startDate, endDate, startTime, endTime) => {
        const start = new Date(startDate);
        const options = { year: "numeric", month: "short", day: "numeric" };
        let dateStr = start.toLocaleDateString(undefined, options);

        if (endDate && endDate !== startDate) {
            const end = new Date(endDate);
            dateStr += ` - ${end.toLocaleDateString(undefined, options)}`;
        }

        if (startTime) dateStr += ` • ${startTime.slice(0, 5)}${endTime ? ` - ${endTime.slice(0, 5)}` : ""}`;
        return dateStr;
    };

    const getDaysRemaining = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const filteredEvents = useMemo(() => {
        const itemsToFilter = activeTab === "joined" ? joinedBookings : organizedEventsData;
        return itemsToFilter.filter(
            (item) =>
                (item.event.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.event.venue_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (!filterType || item.event.event_type === filterType)
        );
    }, [activeTab, searchQuery, filterType, joinedBookings]);

    const allEvents = useMemo(() => [...joinedBookings.map((b) => b.event), ...organizedEventsData], [joinedBookings]);
    const eventTypes = useMemo(() => [...new Set(allEvents.map((event) => event.event_type))], [allEvents]);

    const EventCard = ({ item }) => {
        const isOrganized = activeTab === "organized";
        const event = isOrganized ? item : item.event;
        const daysRemaining = getDaysRemaining(event.start_date);
        const totalTickets = isOrganized ? 0 : item.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
        const [cancelQuantities, setCancelQuantities] = useState({});

        useEffect(() => {
            if (!isOrganized && item.tickets) {
                const initialQuantities = {};
                item.tickets.forEach((ticket) => {
                    initialQuantities[ticket.id] = 0;
                });
                setCancelQuantities(initialQuantities);
            }
        }, [item.tickets, isOrganized]);

        const handleIncrement = (ticketId, maxQuantity) => {
            setCancelQuantities((prev) => ({
                ...prev,
                [ticketId]: Math.min(prev[ticketId] + 1, maxQuantity),
            }));
        };

        const handleDecrement = (ticketId) => {
            setCancelQuantities((prev) => ({
                ...prev,
                [ticketId]: Math.max(prev[ticketId] - 1, 0),
            }));
        };

        const handleCancelTickets = async () => {
            const ticketsToCancel = Object.entries(cancelQuantities)
                .filter(([, quantity]) => quantity > 0)
                .map(([ticketId, quantity]) => ({
                    ticket_id: parseInt(ticketId),
                    quantity: quantity,
                }));

            if (ticketsToCancel.length === 0) {
                toast.warning("Please select tickets to cancel.");
                return;
            }

            const cancellationData = {
                event_id: event.id,
                booking_id: item.booking_id,
                tickets: ticketsToCancel,
            };

            try {
                const response = await api.post(`users/cancel-ticket/`, cancellationData);
                if (response.data.total_refund) {
                    toast.info(`Refund credited: ${response.data.total_refund}`);
                }
                fetchJoinedBookings();
                setCancelQuantities({});
            } catch (error) {
                toast.error(error.response?.data?.error || "Failed to cancel tickets. Please try again.");
                console.error("Failed to cancel tickets:", error);
            }
        };

        return (
            <div className="bg-[#2d2d42] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center p-4 space-x-6">
                <div className="relative w-48 h-60 flex-shrink-0">
                    <img
                        src={event.event_banner}
                        alt={event.event_title}
                        className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {event.event_type}
                    </div>
                    {daysRemaining > 0 && daysRemaining <= 7 && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Upcoming
                        </div>
                    )}
                </div>

                <div className="flex-grow space-y-3">
                    <div className="flex justify-between items-start">
                        <h3 className="text-xl font-semibold text-white line-clamp-2 max-w-[70%]">{event.event_title}</h3>
                        <div className="flex items-center space-x-3 text-gray-400">
                            <div className="flex items-center">
                                <FaHeart className={`w-5 h-5 mr-1 ${event.liked ? "text-red-600" : "text-gray-400"}`} />
                                <span>{event.like_count || 0}</span>
                            </div>
                            <div className="flex items-center">
                                <Eye size={14} className="mr-1" />
                                <span>{event.visibility}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 text-gray-300 text-sm">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
                            <span>{formatDate(event.start_date, event.end_date, event.start_time, event.end_time)}</span>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
                            <span>
                                {event.city}, {event.address}, {event.venue_name}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <MdGroups className="w-6 h-6 mr-2 text-blue-400 flex-shrink-0" />
                            <span>{event.capacity}</span>
                        </div>
                        {!isOrganized && (
                            <div className="flex items-center">
                                <GiTicket className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
                                <span>
                                    {totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                        {isOrganized && (
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
                                <span>
                                    {event.total_tickets_sold || 0} / {event.capacity || 0} attendees
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            Created by <span className="text-blue-400">{event.organizer_username}</span>
                        </div>
                        <div className="flex gap-2">
                            {isOrganized && (
                                <button className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300">
                                    Analyze
                                </button>
                            )}
                            {!isOrganized && (
                                <button
                                    className="px-3 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
                                    aria-label="View Ticket"
                                    onClick={() => handleShowCoupons(item.booking_id)}
                                >
                                    <GiTicket className="w-6 h-6" />
                                </button>
                            )}
                            {!isOrganized && item.tickets && item.tickets.length > 0 && event.cancel_ticket && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2d2d42] text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
                                        >
                                            Cancel Ticket
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[400px] w-md bg-[#2d2d42] text-gray-200 border-gray-700">
                                        <DialogHeader>
                                            <DialogTitle className="text-white">Cancel Event Tickets</DialogTitle>
                                            <DialogDescription className="text-gray-400">
                                                Select the number of tickets to cancel for {event.event_title}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-4">
                                                <Label className="text-gray-300">Ticket Types to Cancel</Label>
                                                <div className="space-y-3">
                                                    {item.tickets.map((ticket) => (
                                                        <div key={ticket.id} className="flex items-center justify-between">
                                                            <Label
                                                                htmlFor={`${event.id}-${ticket.id}`}
                                                                className="text-gray-300"
                                                            >
                                                                {ticket.ticket_type} Ticket ({ticket.quantity} booked)
                                                            </Label>
                                                            <div className="flex">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8 h-8 bg-gray-700 text-white border-gray-600"
                                                                    onClick={() => handleDecrement(ticket.id)}
                                                                >
                                                                    -
                                                                </Button>
                                                                <span className="w-12 text-center">
                                                                    {cancelQuantities[ticket.id] || 0}
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-8 h-8 bg-gray-700 text-white border-gray-600"
                                                                    onClick={() =>
                                                                        handleIncrement(ticket.id, ticket.quantity)
                                                                    }
                                                                >
                                                                    +
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter className="flex justify-between">
                                            <Button
                                                type="submit"
                                                className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                onClick={handleCancelTickets}
                                            >
                                                Cancel Selected Tickets
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                            <button
                                onClick={() => handleEventClick(item)}
                                className="px-1 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
                                aria-label="View Details"
                            >
                                <MdKeyboardDoubleArrowRight className="w-6 h-10" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#1e1e2f] rounded-2xl p-6 shadow-xl">
            <div className="flex md:flex-row gap-4 mb-8 justify-between">
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search events by title, city, or venue..."
                            className="w-full bg-[#2d2d42] text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg
                            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <select
                        className="bg-[#2d2d42] text-gray-200 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="">All Event Types</option>
                        {eventTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {activeTab === "joined" && loading ? (
                <div className="text-gray-400 text-center">Loading bookings...</div>
            ) : activeTab === "joined" && error ? (
                <div className="text-red-400 text-center">{error}</div>
            ) : (
                <>
                    <div className="text-gray-400 mb-6">
                        Showing {filteredEvents.length} {filteredEvents.length === 1 ? "booking" : "bookings"}
                    </div>

                    {filteredEvents.length > 0 ? (
                        <div className="space-y-6">
                            {filteredEvents.map((item) => (
                                <EventCard key={item.booking_id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#2d2d42] rounded-xl">
                            <div className="text-gray-400 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <h3 className="text-xl font-medium mb-1">No bookings found</h3>
                                <p className="text-gray-500">
                                    {searchQuery || filterType
                                        ? "Try adjusting your search or filters"
                                        : `You haven't ${activeTab === "joined" ? "joined" : "organized"} any events yet`}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {showModal && selectedEvent && (
                <EventDetailModal id={selectedEvent.id} onClose={handleCloseModal} onEventUpdate={handleEventUpdate} />
            )}
            {showCouponsModal && <Show_coupons bookingId={selectedBookingId} onClose={handleCloseCoupons} />}
        </div>
    );
};

export default EventOutlet;

// import React, { useState, useMemo, useEffect } from "react";
// import { Calendar, MapPin, Users, Eye } from "lucide-react";
// import { FaHeart } from "react-icons/fa";
// import { MdKeyboardDoubleArrowRight } from "react-icons/md";
// import { GiTicket } from "react-icons/gi";
// import EventDetailModal from "@/components/user/Explore/EventDetailModal";
// import api from "@/services/api";
// import { MdGroups } from "react-icons/md";
// import { Button } from "@/components/ui/button";
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
//     DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";
// import Show_coupons from "@/components/common/user/Profile/Event/Show_coupons";

// const EventOutlet = () => {
//     const [activeTab, setActiveTab] = useState("joined");
//     const [searchQuery, setSearchQuery] = useState("");
//     const [filterType, setFilterType] = useState("");
//     const [showModal, setShowModal] = useState(false);
//     const [selectedEvent, setSelectedEvent] = useState(null);
//     const [joinedEvents, setJoinedEvents] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [showCouponsModal, setShowCouponsModal] = useState(false);
//     const [selectedBookingId, setSelectedBookingId] = useState(null);

//     const fetchJoinedEvents = async () => {
//         try {
//             setLoading(true);
//             const response = await api.get("/users/my-events/");
//             setJoinedEvents(response.data);
//         } catch (err) {
//             setError("Failed to fetch events");
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchJoinedEvents();
//     }, []);

//     const organizedEventsData = useMemo(
//         () => [
//             {
//                 id: 3,
//                 event_title: "AI Workshop 2025",
//                 event_type: "Workshop",
//                 event_banner: "https://picsum.photos/300/500",
//                 start_date: "2025-06-10",
//                 end_date: "2025-06-10",
//                 start_time: "10:00",
//                 end_time: "16:00",
//                 venue_name: "Tech Hub",
//                 city: "Berlin",
//                 address: "45 Innovation Blvd",
//                 description: "Hands-on AI workshop.",
//                 capacity: 50,
//                 visibility: "Private",
//                 age_restriction: false,
//                 total_tickets_sold: 48,
//                 created_at: "2025-03-01",
//                 organizer_username: "AIExperts",
//                 like_count: 32,
//                 comment_count: 8,
//             },
//             {
//                 id: 4,
//                 event_title: "Blockchain Seminar 2025",
//                 event_type: "Seminar",
//                 event_banner: "https://picsum.photos/300/500",
//                 start_date: "2025-07-25",
//                 end_date: "2025-07-25",
//                 start_time: "14:00",
//                 end_time: "18:00",
//                 venue_name: "Innovation Center",
//                 city: "London",
//                 address: "78 Tech Square",
//                 description: "Learn about blockchain.",
//                 capacity: 100,
//                 visibility: "Public",
//                 age_restriction: false,
//                 total_tickets_sold: 87,
//                 created_at: "2025-02-28",
//                 organizer_username: "BlockchainHub",
//                 like_count: 29,
//                 comment_count: 15,
//             },
//         ],
//         []
//     );

//     const handleEventClick = (event) => {
//         setSelectedEvent(event);
//         setShowModal(true);
//     };

//     const handleCloseModal = () => {
//         setSelectedEvent(null);
//         setShowModal(false);
//     };

//     const handleShowCoupons = (bookingId) => {
//         setSelectedBookingId(bookingId);
//         setShowCouponsModal(true);
//     }

//     const handleCloseCoupons = () => {
//         setSelectedBookingId(null);
//         setShowCouponsModal(false)
//     }

//     const handleEventUpdate = (updatedEvent) => {
//         setSelectedEvent(updatedEvent);
//         if (activeTab === "joined") {
//             setJoinedEvents((prevEvents) =>
//                 prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
//             );
//         }
//     };

//     const formatDate = (startDate, endDate, startTime, endTime) => {
//         const start = new Date(startDate);
//         const options = { year: "numeric", month: "short", day: "numeric" };
//         let dateStr = start.toLocaleDateString(undefined, options);

//         if (endDate && endDate !== startDate) {
//             const end = new Date(endDate);
//             dateStr += ` - ${end.toLocaleDateString(undefined, options)}`;
//         }

//         if (startTime) dateStr += ` • ${startTime.slice(0, 5)}${endTime ? ` - ${endTime.slice(0, 5)}` : ""}`;
//         return dateStr;
//     };

//     const getDaysRemaining = (dateString) => {
//         const eventDate = new Date(dateString);
//         const today = new Date();
//         const diffTime = eventDate - today;
//         return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     };

//     const filteredEvents = useMemo(() => {
//         const eventsToFilter = activeTab === "joined" ? joinedEvents : organizedEventsData;
//         return eventsToFilter.filter(
//             (event) =>
//                 (event.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                     event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                     event.venue_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
//                 (!filterType || event.event_type === filterType)
//         );
//     }, [activeTab, searchQuery, filterType, joinedEvents]);

//     const allEvents = useMemo(() => [...joinedEvents, ...organizedEventsData], [joinedEvents]);
//     const eventTypes = useMemo(() => [...new Set(allEvents.map((event) => event.event_type))], [allEvents]);

//     const EventCard = ({ event }) => {
//         const daysRemaining = getDaysRemaining(event.start_date);
//         const isOrganized = activeTab === "organized";
//         const totalTickets = event.tickets?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
//         const [cancelQuantities, setCancelQuantities] = useState({});

//         useEffect(() => {
//             if (event.tickets) {
//                 const initialQuantities = {};
//                 event.tickets.forEach((ticket) => {
//                     initialQuantities[ticket.id] = 0;
//                 });
//                 setCancelQuantities(initialQuantities);
//             }
//         }, [event.tickets]);

//         const handleIncrement = (ticketId, maxQuantity) => {
//             setCancelQuantities((prev) => ({
//                 ...prev,
//                 [ticketId]: Math.min(prev[ticketId] + 1, maxQuantity),
//             }));
//         };

//         const handleDecrement = (ticketId) => {
//             setCancelQuantities((prev) => ({
//                 ...prev,
//                 [ticketId]: Math.max(prev[ticketId] - 1, 0),
//             }));
//         };

//         const handleCancelTickets = async () => {
//             const ticketsToCancel = Object.entries(cancelQuantities)
//                 .filter(([, quantity]) => quantity > 0)
//                 .map(([ticketId, quantity]) => ({
//                     ticket_id: parseInt(ticketId),
//                     quantity: quantity,
//                 }));

//             if (ticketsToCancel.length === 0){
//                 toast.warning("Please select tickets to cancel.")
//             }

//             if (ticketsToCancel.length > 0) {
//                 const cancellationData = {
//                     event_id: event.id,
//                     booking_id: event.booking_id,
//                     tickets: ticketsToCancel,
//                 };
//                 console.log("cancel ticket datas : ", cancellationData);

//                 try {
//                     const response = await api.post(`users/cancel-ticket/`, cancellationData);
//                     if (response.data.total_refund) {
//                         toast.info(`Refund credited: ${response.data.total_refund}`);
//                     }
//                     fetchJoinedEvents()
//                     setCancelQuantities({});
//                 } catch (error) {
//                     toast.error( error.response?.data?.error|| "Failed to cancel tickets. Please try again.");
//                     console.error("Failed to cancel tickets:", error);
//                 }
//             }
//         };

//         return (
//             <div className="bg-[#2d2d42] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center p-4 space-x-6">
//                 <div className="relative w-48 h-60 flex-shrink-0">
//                     <img
//                         src={event.event_banner}
//                         alt={event.event_title}
//                         className="w-full h-full object-cover rounded-lg"
//                     />
//                     <div className="absolute top-2 left-2 bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-medium">
//                         {event.event_type}
//                     </div>
//                     {daysRemaining > 0 && daysRemaining <= 7 && (
//                         <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
//                             Upcoming
//                         </div>
//                     )}
//                 </div>

//                 <div className="flex-grow space-y-3">
//                     <div className="flex justify-between items-start">
//                         <h3 className="text-xl font-semibold text-white line-clamp-2 max-w-[70%]">{event.event_title}</h3>
//                         <div className="flex items-center space-x-3 text-gray-400">
//                             <div className="flex items-center">
//                                 <FaHeart className={`w-5 h-5 mr-1 ${event.liked ? "text-red-600" : "text-gray-400"}`} />
//                                 <span>{event.like_count || 0}</span>
//                             </div>
//                             <div className="flex items-center">
//                                 <Eye size={14} className="mr-1" />
//                                 <span>{event.visibility}</span>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="space-y-2 text-gray-300 text-sm">
//                         <div className="flex items-center">
//                             <Calendar className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                             <span>{formatDate(event.start_date, event.end_date, event.start_time, event.end_time)}</span>
//                         </div>
//                         <div className="flex items-center">
//                             <MapPin className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                             <span>
//                                 {event.city}, {event.address}, {event.venue_name}
//                             </span>
//                         </div>
//                         <div className="flex items-center">
//                             <MdGroups className="w-6 h-6 mr-2 text-blue-400 flex-shrink-0" />
//                             <span>{event.capacity}</span>
//                         </div>
//                         {!isOrganized && event.tickets && (
//                             <div className="flex items-center">
//                                 <GiTicket className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                                 <span>
//                                     {totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}
//                                 </span>
//                             </div>
//                         )}
//                         {isOrganized && (
//                             <div className="flex items-center">
//                                 <Users className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                                 <span>
//                                     {event.total_tickets_sold || 0} / {event.capacity || 0} attendees
//                                 </span>
//                             </div>
//                         )}
//                     </div>

//                     <div className="flex justify-between items-center">
//                         <div className="text-sm text-gray-400">
//                             Created by <span className="text-blue-400">{event.organizer_username}</span>
//                         </div>
//                         <div className="flex gap-2">
//                             {isOrganized && (
//                                 <button className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300">
//                                     Analyze
//                                 </button>
//                             )}

//                             {!isOrganized && (
//                                 <button
//                                     className="px-3 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
//                                     aria-label="View Ticket"
//                                     onClick={() => handleShowCoupons(event.booking_id)}
//                                 >
//                                     <GiTicket className="w-6 h-6" />
//                                 </button>
//                             )}

//                             {!isOrganized && event.tickets && event.tickets.length > 0 && (
//                                 <Dialog>
//                                     <DialogTrigger asChild>
//                                         <Button
//                                             variant="outline"
//                                             className="bg-[#2d2d42] text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
//                                         >
//                                             Cancel Ticket
//                                         </Button>
//                                     </DialogTrigger>
//                                     <DialogContent className="sm:max-w-[400px] w-md bg-[#2d2d42] text-gray-200 border-gray-700">
//                                         <DialogHeader>
//                                             <DialogTitle className="text-white">Cancel Event Tickets</DialogTitle>
//                                             <DialogDescription className="text-gray-400">
//                                                 Select the number of tickets to cancel for {event.event_title}
//                                             </DialogDescription>
//                                         </DialogHeader>
//                                         <div className="grid gap-4 py-4">
//                                             <div className="space-y-4">
//                                                 <Label className="text-gray-300">Ticket Types to Cancel</Label>
//                                                 <div className="space-y-3">
//                                                     {event.tickets.map((ticket) => (
//                                                         <div key={ticket.id} className="flex items-center justify-between">
//                                                             <Label
//                                                                 htmlFor={`${event.id}-${ticket.id}`}
//                                                                 className="text-gray-300"
//                                                             >
//                                                                 {ticket.ticket_type} Ticket ({ticket.quantity} booked)
//                                                             </Label>
//                                                             <div className="flex">
//                                                                 <Button
//                                                                     variant="outline"
//                                                                     size="sm"
//                                                                     className="w-8 h-8 bg-gray-700 text-white border-gray-600"
//                                                                     onClick={() => handleDecrement(ticket.id)}
//                                                                 >
//                                                                     -
//                                                                 </Button>
//                                                                 <span className="w-12 text-center">
//                                                                     {cancelQuantities[ticket.id] || 0}
//                                                                 </span>
//                                                                 <Button
//                                                                     variant="outline"
//                                                                     size="sm"
//                                                                     className="w-8 h-8 bg-gray-700 text-white border-gray-600"
//                                                                     onClick={() =>
//                                                                         handleIncrement(ticket.id, ticket.quantity)
//                                                                     }
//                                                                 >
//                                                                     +
//                                                                 </Button>
//                                                             </div>
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <DialogFooter className="flex justify-between">
//                                             <Button
//                                                 type="submit"
//                                                 className="bg-red-600 text-white hover:bg-red-700 transition-colors"
//                                                 onClick={handleCancelTickets}
//                                             >
//                                                 Cancel Selected Tickets
//                                             </Button>
//                                         </DialogFooter>
//                                     </DialogContent>
//                                 </Dialog>
//                             )}
//                             <button
//                                 onClick={() => handleEventClick(event)}
//                                 className="px-1 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
//                                 aria-label="View Details"
//                             >
//                                 <MdKeyboardDoubleArrowRight className="w-6 h-10" />
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <div className="min-h-screen bg-[#1e1e2f] rounded-2xl p-6 shadow-xl">
//             <div className="flex md:flex-row gap-4 mb-8 justify-between">
//                 <div className="flex gap-2">
//                     <div className="relative">
//                         <input
//                             type="text"
//                             placeholder="Search events by title, city, or venue..."
//                             className="w-full bg-[#2d2d42] text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                         />
//                         <svg
//                             className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
//                             xmlns="http://www.w3.org/2000/svg"
//                             viewBox="0 0 20 20"
//                             fill="currentColor"
//                         >
//                             <path
//                                 fillRule="evenodd"
//                                 d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
//                                 clipRule="evenodd"
//                             />
//                         </svg>
//                     </div>
//                     <select
//                         className="bg-[#2d2d42] text-gray-200 px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         value={filterType}
//                         onChange={(e) => setFilterType(e.target.value)}
//                     >
//                         <option value="">All Event Types</option>
//                         {eventTypes.map((type) => (
//                             <option key={type} value={type}>
//                                 {type}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <div className="flex gap-2">
//                     <button
//                         className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
//                             activeTab === "joined"
//                                 ? "bg-[#00EF93] text-black shadow-md"
//                                 : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//                         }`}
//                         onClick={() => setActiveTab("joined")}
//                     >
//                         Joined Events
//                     </button>
//                     <button
//                         className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 ${
//                             activeTab === "organized"
//                                 ? "bg-[#00EF93] text-black shadow-md"
//                                 : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//                         }`}
//                         onClick={() => setActiveTab("organized")}
//                     >
//                         Organized Events
//                     </button>
//                 </div>
//             </div>

//             {activeTab === "joined" && loading ? (
//                 <div className="text-gray-400 text-center">Loading events...</div>
//             ) : activeTab === "joined" && error ? (
//                 <div className="text-red-400 text-center">{error}</div>
//             ) : (
//                 <>
//                     <div className="text-gray-400 mb-6">
//                         Showing {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
//                     </div>

//                     {filteredEvents.length > 0 ? (
//                         <div className="space-y-6">
//                             {filteredEvents.map((event) => (
//                                 <EventCard key={event.id} event={event} />
//                             ))}
//                         </div>
//                     ) : (
//                         <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#2d2d42] rounded-xl">
//                             <div className="text-gray-400 text-center">
//                                 <svg
//                                     className="mx-auto h-12 w-12 mb-4"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     viewBox="0 0 24 24"
//                                 >
//                                     <path
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         strokeWidth={1.5}
//                                         d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                                     />
//                                 </svg>
//                                 <h3 className="text-xl font-medium mb-1">No events found</h3>
//                                 <p className="text-gray-500">
//                                     {searchQuery || filterType
//                                         ? "Try adjusting your search or filters"
//                                         : `You haven't ${activeTab === "joined" ? "joined" : "organized"} any events yet`}
//                                 </p>
//                             </div>
//                         </div>
//                     )}
//                 </>
//             )}

//             {showModal && selectedEvent && (
//                 <EventDetailModal id={selectedEvent.id} onClose={handleCloseModal} onEventUpdate={handleEventUpdate} />
//             )}
//             {showCouponsModal && (
//                 <Show_coupons bookingId={selectedBookingId} onClose={handleCloseCoupons} />
//             )}
//         </div>
//     );
// };

// export default EventOutlet;
