// import React, { useState, useMemo, useEffect } from "react";
// import { Calendar, MapPin, Users, Eye } from "lucide-react";
// import { FaHeart } from "react-icons/fa";
// import { MdKeyboardDoubleArrowRight } from "react-icons/md";
// import { GiTicket } from "react-icons/gi";
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
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";

// const EventCard = ({ event }) => {
//     const getDaysRemaining = (dateString) => {
//         const eventDate = new Date(dateString);
//         const today = new Date();
//         const diffTime = eventDate - today;
//         return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     };

//     const daysRemaining = getDaysRemaining(event.start_date);
//     const isOrganized = activeTab === "organized";
//     const totalTickets = event.tickets?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
//     const [cancelQuantities, setCancelQuantities] = useState({});

//     useEffect(() => {
//         if (event.tickets) {
//             const initialQuantities = {};
//             event.tickets.forEach((ticket) => {
//                 initialQuantities[ticket.id] = 0;
//             });
//             setCancelQuantities(initialQuantities);
//         }
//     }, [event.tickets]);

//     const handleIncrement = (ticketId, maxQuantity) => {
//         setCancelQuantities((prev) => ({
//             ...prev,
//             [ticketId]: Math.min(prev[ticketId] + 1, maxQuantity),
//         }));
//     };

//     const handleDecrement = (ticketId) => {
//         setCancelQuantities((prev) => ({
//             ...prev,
//             [ticketId]: Math.max(prev[ticketId] - 1, 0),
//         }));
//     };

//     const handleCancelTickets = async () => {
//         const ticketsToCancel = Object.entries(cancelQuantities)
//             .filter(([, quantity]) => quantity > 0)
//             .map(([ticketId, quantity]) => ({
//                 ticket_id: parseInt(ticketId),
//                 quantity: quantity,
//             }));

//         if (ticketsToCancel.length === 0) {
//             toast.warning("Please select tickets to cancel.");
//         }

//         if (ticketsToCancel.length > 0) {
//             const cancellationData = {
//                 event_id: event.id,
//                 booking_id: event.booking_id,
//                 tickets: ticketsToCancel,
//             };
//             console.log("cancel ticket datas : ", cancellationData);

//             try {
//                 const response = await api.post(`users/cancel-ticket/`, cancellationData);
//                 if (response.data.total_refund) {
//                     toast.info(`Refund credited: ${response.data.total_refund}`);
//                 }
//                 fetchJoinedEvents();
//                 setCancelQuantities({});
//             } catch (error) {
//                 toast.error(error.response?.data?.error || "Failed to cancel tickets. Please try again.");
//                 console.error("Failed to cancel tickets:", error);
//             }
//         }
//     };

//     return (
//         <div className="bg-[#2d2d42] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center p-4 space-x-6">
//             <div className="relative w-48 h-60 flex-shrink-0">
//                 <img src={event.event_banner} alt={event.event_title} className="w-full h-full object-cover rounded-lg" />
//                 <div className="absolute top-2 left-2 bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-medium">
//                     {event.event_type}
//                 </div>
//                 {daysRemaining > 0 && daysRemaining <= 7 && (
//                     <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
//                         Upcoming
//                     </div>
//                 )}
//             </div>

//             <div className="flex-grow space-y-3">
//                 <div className="flex justify-between items-start">
//                     <h3 className="text-xl font-semibold text-white line-clamp-2 max-w-[70%]">{event.event_title}</h3>
//                     <div className="flex items-center space-x-3 text-gray-400">
//                         <div className="flex items-center">
//                             <FaHeart className={`w-5 h-5 mr-1 ${event.liked ? "text-red-600" : "text-gray-400"}`} />
//                             <span>{event.like_count || 0}</span>
//                         </div>
//                         <div className="flex items-center">
//                             <Eye size={14} className="mr-1" />
//                             <span>{event.visibility}</span>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="space-y-2 text-gray-300 text-sm">
//                     <div className="flex items-center">
//                         <Calendar className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                         <span>{formatDate(event.start_date, event.end_date, event.start_time, event.end_time)}</span>
//                     </div>
//                     <div className="flex items-center">
//                         <MapPin className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                         <span>
//                             {event.city}, {event.address}, {event.venue_name}
//                         </span>
//                     </div>
//                     <div className="flex items-center">
//                         <MdGroups className="w-6 h-6 mr-2 text-blue-400 flex-shrink-0" />
//                         <span>{event.capacity}</span>
//                     </div>
//                     {!isOrganized && event.tickets && (
//                         <div className="flex items-center">
//                             <GiTicket className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                             <span>
//                                 {totalTickets} Ticket{totalTickets !== 1 ? "s" : ""}
//                             </span>
//                         </div>
//                     )}
//                     {isOrganized && (
//                         <div className="flex items-center">
//                             <Users className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />
//                             <span>
//                                 {event.total_tickets_sold || 0} / {event.capacity || 0} attendees
//                             </span>
//                         </div>
//                     )}
//                 </div>

//                 <div className="flex justify-between items-center">
//                     <div className="text-sm text-gray-400">
//                         Created by <span className="text-blue-400">{event.organizer_username}</span>
//                     </div>
//                     <div className="flex gap-2">
//                         {isOrganized && (
//                             <button className="px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300">
//                                 Analyze
//                             </button>
//                         )}

//                         {!isOrganized && (
//                             <button
//                                 className="px-3 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
//                                 aria-label="View Ticket"
//                             >
//                                 <GiTicket className="w-6 h-6" />
//                             </button>
//                         )}

//                         {!isOrganized && event.tickets && event.tickets.length > 0 && (
//                             <Dialog>
//                                 <DialogTrigger asChild>
//                                     <Button
//                                         variant="outline"
//                                         className="bg-[#2d2d42] text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
//                                     >
//                                         Cancel Ticket
//                                     </Button>
//                                 </DialogTrigger>
//                                 <DialogContent className="sm:max-w-[400px] w-md bg-[#2d2d42] text-gray-200 border-gray-700">
//                                     <DialogHeader>
//                                         <DialogTitle className="text-white">Cancel Event Tickets</DialogTitle>
//                                         <DialogDescription className="text-gray-400">
//                                             Select the number of tickets to cancel for {event.event_title}
//                                         </DialogDescription>
//                                     </DialogHeader>
//                                     <div className="grid gap-4 py-4">
//                                         <div className="space-y-4">
//                                             <Label className="text-gray-300">Ticket Types to Cancel</Label>
//                                             <div className="space-y-3">
//                                                 {event.tickets.map((ticket) => (
//                                                     <div key={ticket.id} className="flex items-center justify-between">
//                                                         <Label
//                                                             htmlFor={`${event.id}-${ticket.id}`}
//                                                             className="text-gray-300"
//                                                         >
//                                                             {ticket.ticket_type} Ticket ({ticket.quantity} booked)
//                                                         </Label>
//                                                         <div className="flex">
//                                                             <Button
//                                                                 variant="outline"
//                                                                 size="sm"
//                                                                 className="w-8 h-8 bg-gray-700 text-white border-gray-600"
//                                                                 onClick={() => handleDecrement(ticket.id)}
//                                                             >
//                                                                 -
//                                                             </Button>
//                                                             <span className="w-12 text-center">
//                                                                 {cancelQuantities[ticket.id] || 0}
//                                                             </span>
//                                                             <Button
//                                                                 variant="outline"
//                                                                 size="sm"
//                                                                 className="w-8 h-8 bg-gray-700 text-white border-gray-600"
//                                                                 onClick={() => handleIncrement(ticket.id, ticket.quantity)}
//                                                             >
//                                                                 +
//                                                             </Button>
//                                                         </div>
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <DialogFooter className="flex justify-between">
//                                         <Button
//                                             type="submit"
//                                             className="bg-red-600 text-white hover:bg-red-700 transition-colors"
//                                             onClick={handleCancelTickets}
//                                         >
//                                             Cancel Selected Tickets
//                                         </Button>
//                                     </DialogFooter>
//                                 </DialogContent>
//                             </Dialog>
//                         )}
//                         <button
//                             onClick={() => handleEventClick(event)}
//                             className="px-1 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-300"
//                             aria-label="View Details"
//                         >
//                             <MdKeyboardDoubleArrowRight className="w-6 h-10" />
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EventCard;
