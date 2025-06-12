import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Ticket, Eye, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import adminApi from "@/services/adminApi";
import EventDataModal from "@/components/admin/EventDataModal";

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await adminApi.get("events/", {
                params: {
                    search: searchTerm || undefined,
                    event_type: eventType === "all" ? "" : eventType,
                    date_range: dateRange || undefined,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined,
                },
            });
            setEvents(response.data.events);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEvents();
    }, [searchTerm, dateRange, eventType, startDate, endDate]);

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

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
        setShowModal(false);
    };

    return (
        <div className="container mx-auto px-4 py-6 bg-gray-900 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Events Dashboard</h1>

                <div className="flex w-full sm:w-auto gap-3">
                    <div className="flex sm:flex-row w-full gap-2">
                        <div className="relative flex-grow mb-2 sm:mb-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-10"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="relative flex-grow sm:flex-grow-0"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                            <Button onClick={() => {}} className="flex-grow sm:flex-grow-0">
                                <RefreshCw className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
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

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                        </div>
                    )}

                    <div className="flex justify-end mt-4">
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {events.map((event) => (
                    <Card
                        key={event.id}
                        className="py-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <CardHeader className="px-4 pt-1">
                            <CardTitle className="text-lg md:text-xl text-white line-clamp-1">
                                {event.event_title}
                            </CardTitle>
                            <CardDescription className="text-gray-400">ID: {event.id}</CardDescription>
                        </CardHeader>

                        <CardContent className="text-gray-300 md:px-6 pt-0">
                            <div className="flex items-center gap-2 mb-4">
                                <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-gray-600 rounded-full overflow-hidden">
                                    <img
                                        src={event.organizer.profile_picture || "/api/placeholder/100/100"}
                                        alt={event.organizer.username}
                                        className="w-full h-full object-cover"
                                    />
                                </Avatar>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-medium text-sm md:text-base text-white truncate">
                                        {event.organizer.username}
                                    </p>
                                    <p className="text-xs md:text-sm text-gray-400 truncate">{event.organizer.email}</p>
                                </div>
                                <Badge className="bg-gray-900 text-white text-xs p-1 md:p-2">{event.event_type}</Badge>
                            </div>

                            <Separator className="my-3 bg-gray-700" />

                            <div className="space-y-2 text-xs md:text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{formatDateRange(event.start_date, event.end_date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{formatTimeRange(event.start_time, event.end_time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                        {event.venue_name}, {event.city}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span>{event.capacity} capacity</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ticket className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span>{event.total_tickets_sold} sold</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="md:px-6 pb-2">
                            <Button
                                variant="outline"
                                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"
                                onClick={() => handleEventClick(event)}
                            >
                                <Eye className="h-4 w-4" />
                                <span>Show Details</span>
                                <ArrowRight className="h-4 w-4 ml-auto" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {showModal && <EventDataModal id={selectedEvent?.id} onClose={handleCloseModal} />}

            {events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg p-6">
                    <p className="text-lg md:text-xl text-gray-400 mb-4 text-center">No events found</p>
                    <Button className="bg-gray-700 hover:bg-gray-600">Create an Event</Button>
                </div>
            )}
        </div>
    );
};

export default Events;
