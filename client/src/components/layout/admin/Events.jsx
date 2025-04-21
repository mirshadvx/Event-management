import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Ticket, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/Separator";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, RefreshCw, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockEvents = [
    {
        id: 1,
        organizer: {
            username: "JohnDoe",
            email: "john@example.com",
            profile_picture: null,
        },
        event_title: "Web Development Conference 2025",
        event_type: "Conference",
        description: "Join us for a three-day conference on the latest web development technologies.",
        venue_name: "Tech Convention Center",
        address: "123 Tech Street",
        city: "San Francisco",
        start_date: "2025-05-15",
        end_date: "2025-05-17",
        start_time: "09:00:00",
        end_time: "17:00:00",
        capacity: 500,
        total_tickets_sold: 350,
    },
    {
        id: 2,
        organizer: {
            username: "JaneSmith",
            email: "jane@example.com",
            profile_picture: "/api/placeholder/100/100",
        },
        event_title: "UI/UX Design Workshop",
        event_type: "Workshop",
        description: "Hands-on workshop to learn practical UI/UX design skills.",
        venue_name: "Design Hub",
        address: "456 Creative Avenue",
        city: "New York",
        start_date: "2025-04-25",
        end_date: null,
        start_time: "10:00:00",
        end_time: "15:00:00",
        capacity: 50,
        total_tickets_sold: 42,
    },
    {
        id: 3,
        organizer: {
            username: "MusicPromo",
            email: "events@musicpromo.com",
            profile_picture: "/api/placeholder/100/100",
        },
        event_title: "Summer Music Festival",
        event_type: "Festival",
        description: "Annual summer music festival featuring top artists.",
        venue_name: "City Park Amphitheater",
        address: "789 Park Road",
        city: "Los Angeles",
        start_date: "2025-06-10",
        end_date: "2025-06-12",
        start_time: "12:00:00",
        end_time: "23:00:00",
        capacity: 2000,
        total_tickets_sold: 1250,
    },
    {
        id: 4,
        organizer: {
            username: "TechTalks",
            email: "info@techtalks.com",
            profile_picture: null,
        },
        event_title: "AI and Machine Learning Seminar",
        event_type: "Seminar",
        description: "Learn about the latest advancements in AI and ML.",
        venue_name: "Innovation Center",
        address: "321 Future Street",
        city: "Boston",
        start_date: "2025-05-05",
        end_date: null,
        start_time: "14:00:00",
        end_time: "17:30:00",
        capacity: 200,
        age_restriction: false,
        total_tickets_sold: 0,
    },
    {
        id: 5,
        organizer: {
            username: "ConcertPromoters",
            email: "bookings@concertpromoters.com",
            profile_picture: "/api/placeholder/100/100",
        },
        event_title: "Symphony Orchestra Night",
        event_type: "Concert",
        description: "A night of classical music performed by the Symphony Orchestra.",
        venue_name: "Grand Concert Hall",
        address: "555 Symphony Lane",
        city: "Chicago",
        start_date: "2025-05-20",
        end_date: null,
        start_time: "19:00:00",
        end_time: "22:00:00",
        visibility: "Public",
        total_tickets_sold: 560,
    },
    {
        id: 6,
        organizer: {
            username: "DevAcademy",
            email: "training@devacademy.com",
            profile_picture: "/api/placeholder/100/100",
        },
        event_title: "React & Next.js Bootcamp",
        event_type: "Workshop",
        description: "Intensive 2-day bootcamp for React and Next.js development.",
        venue_name: "Code Campus",
        address: "888 Developer Drive",
        city: "Seattle",
        start_date: "2025-04-30",
        end_date: "2025-05-01",
        start_time: "08:30:00",
        end_time: "16:30:00",
        capacity: 30,
        total_tickets_sold: 28,
    },
];

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setEvents(mockEvents);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const formatDateRange = (startDate, endDate) => {
        if (!endDate || startDate === endDate) {
            return format(new Date(startDate), "MMMM d, yyyy");
        }
        return `${format(new Date(startDate), "MMMM d")} - ${format(new Date(endDate), "MMMM d, yyyy")}`;
    };

    const formatTimeRange = (startTime, endTime) => {
        if (!endTime) {
            return format(new Date(`2000-01-01T${startTime}`), "h:mm a");
        }
        return `${format(new Date(`2000-01-01T${startTime}`), "h:mm a")} - ${format(
            new Date(`2000-01-01T${endTime}`),
            "h:mm a"
        )}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl font-semibold text-gray-200">Loading events...</div>
            </div>
        );
    }

    const resetFilters = () => {
        setSearchTerm("");
        setDateRange("all");
        setEventType("all");
        setStartDate("");
        setEndDate("");
    };

    const activeFilterCount = [dateRange !== "all", eventType !== "all", searchTerm !== ""].filter(Boolean).length;

    return (
        <div className="container mx-auto p-4 md:p-6 bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Events Dashboard</h1>

                <div className="flex flex-col w-full md:w-auto gap-3">
                    <div className="flex w-full gap-2 justify-between">
                        <div className="relative w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-10 w-full"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <Button variant="outline" className="relative" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                            <Button onClick={() => {}}>
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden md:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-medium text-white">Filter Options</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                            onClick={() => setShowFilters(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full border-gray-600 bg-gray-700 rounded-md px-3 py-2 text-gray-200"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Event Type</label>
                            <select
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value)}
                                className="w-full border-gray-600 bg-gray-700 rounded-md px-3 py-2 text-gray-200"
                            >
                                <option value="all">All Event Types</option>
                                <option value="Conference">Conference</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Seminar">Seminar</option>
                                <option value="Concert">Concert</option>
                                <option value="Festival">Festival</option>
                            </select>
                        </div>
                        
                    </div>
                    {dateRange === "custom" && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">Start Date</label>
                                <Input
                                    type="date"
                                    className="w-full bg-gray-700 text-gray-200"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">End Date</label>
                                <Input
                                    type="date"
                                    className="w-full bg-gray-700 text-gray-200"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            className="text-gray-300 border-gray-600 hover:bg-gray-700"
                            onClick={resetFilters}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Filters
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <Card
                        key={event.id}
                        className="pb-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <CardHeader>
                            <CardTitle className="text-xl text-white">{event.event_title}</CardTitle>
                            <CardDescription className="text-gray-400">ID: {event.id}</CardDescription>
                        </CardHeader>

                        <CardContent className="text-gray-300">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="w-10 h-10 border border-gray-600 rounded-full overflow-hidden">
                                    <img
                                        src={event.organizer.profile_picture || "/api/placeholder/100/100"}
                                        alt={event.organizer.username}
                                        className="w-full h-full object-cover"
                                    />
                                </Avatar>
                                <div>
                                    <p className="font-medium text-white">{event.organizer.username}</p>
                                    <p className="text-sm text-gray-400">{event.organizer.email}</p>
                                </div>
                                <div className="w-full flex justify-end">
                                    <Badge className="bg-gray-900 text-white p-2">{event.event_type}</Badge>
                                </div>
                            </div>

                            <Separator className="my-3 bg-gray-700" />

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{formatDateRange(event.start_date, event.end_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {event.venue_name}, {event.city}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <span>{event.capacity} capacity</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ticket className="h-4 w-4 text-gray-400" />
                                        <span>{event.total_tickets_sold} sold</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Show Details
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg">
                    <p className="text-xl text-gray-400 mb-4">No events found</p>
                    <Button className="bg-gray-700 hover:bg-gray-600">Create an Event</Button>
                </div>
            )}
        </div>
    );
};

export default Events;