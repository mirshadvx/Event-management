import React, { useState, useRef, useEffect } from "react";
import { X, Calendar, MapPin, Users, Share2, Heart, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { MdAccountCircle } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { setTicketCount } from "@/store/user/ticketSlicer";
import { useNavigate } from "react-router-dom";

function EventDetailModal({ id, onClose, onEventUpdate }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);
    const selectedTickets = useSelector((state) => state.tickets.selectedTickets[id] || {});

    const [activeTab, setActiveTab] = useState("details");
    const [ticketCounts, setTicketCounts] = useState({});
    const [currentSlide, setCurrentSlide] = useState(0);
    const [liked, setLiked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const modalRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [comments, setComments] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        if (event?.tickets) {
            const initialCounts = event.tickets.reduce((acc, ticket) => {
                acc[ticket.ticket_type] = 0;
                return acc;
            }, {});
            setTicketCounts(initialCounts);
        }
    }, [event]);

  
    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/event/preview-explore/${id}/`);
                setEvent(response.data);
                setComments(response.data.comments || []);
                const eventImages = [response.data?.event_banner, response.data?.promotional_image].filter(Boolean);
                setImages(eventImages);
                setLiked(response.data?.liked);
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEventDetails();
        }
    }, [id]);

   
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const calculateTotal = () => {
        if (!event?.tickets) return 0;
        return event.tickets.reduce((total, ticket) => {
            const count = selectedTickets[ticket.ticket_type] || 0;
            return total + count * parseFloat(ticket.price);
        }, 0);
    };

    const updateTicketCount = (type, operation) => {
        const currentCount = selectedTickets[type] || 0;
        const newCount = operation === "increase" ? currentCount + 1 : Math.max(0, currentCount - 1);

        dispatch(
            setTicketCount({
                eventId: id,
                ticketType: type,
                count: newCount,
            })
        );
    };

    if (!id) return null;
    if (loading) return <div className="text-white">Loading...</div>;

    
    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    const formatTime = (time) => {
        const date = new Date(`1970-01-01T${time}`);
        const time12 = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        return time12;
    };

    const Submit_Like = async () => {
        try {
            const response = await api.post(`event/interact/${id}/`, { action: "like" });
            if (response.status == 201) {
                setLiked(true);
                setEvent((prevEvent) => {
                    const updatedEvent = { ...prevEvent, like_count: prevEvent.like_count + 1 };
                    onEventUpdate(updatedEvent);
                    return updatedEvent;
                });
            } else if (response.status == 200) {
                setLiked(false);
                setEvent((prevEvent) => {
                    const updatedEvent = { ...prevEvent, like_count: prevEvent.like_count - 1 };
                    onEventUpdate(updatedEvent);
                    return updatedEvent;
                });
            }
        } catch (error) {
            console.log(error);
        }
    };

    const Submit_Comment = async (text) => {
        try {
            const response = await api.post(`event/interact/${id}/`, {
                action: "comment",
                text: text,
            });

            if (response.status === 201 || response.status === 200) {
                const newCommentObj = {
                    id: response.data?.id || Date.now(),
                    username: user.username,
                    text: text,
                    created_at: new Date().toISOString(),
                    profile_picture: user.profile_picture,
                };

                setComments((prevComments) => [...prevComments, newCommentObj]);
                setNewComment("");
                setEvent((prevEvent) => ({
                    ...prevEvent,
                    comment_count: prevEvent.comment_count + 1,
                }));
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px] overflow-y-auto"
        >
            <motion.div
                ref={modalRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 30, stiffness: 500 }}
                className="bg-[#121212] text-white w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl h-[98vh]"
            >
                <div className="flex h-full">
                    {/* Left Section (Carousel and Basic Event Details) */}
                    <div className="relative md:w-[45%] h-full  flex flex-col">
                        {/* Image Carousel */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full h-full"
                                >
                                    <img
                                        src={images[currentSlide]}
                                        alt={`${event.event_title} - image ${currentSlide + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            </AnimatePresence>
                            {/* Carousel Controls */}
                            <button
                                onClick={() => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                            >
                                <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.9 }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </motion.div>
                            </button>
                            <button
                                onClick={() => setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                            >
                                <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.9 }}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </motion.div>
                            </button>
                            {/* Carousel Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all",
                                            currentSlide === index ? "bg-white scale-110" : "bg-white/40"
                                        )}
                                    />
                                ))}
                            </div>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                            >
                                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                                    <X size={20} />
                                </motion.div>
                            </button>
                        </div>

                        {/* Basic Event Details */}
                        <div className="px-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-xl md:text-xl font-bold mb-1 text-white"
                            >
                                {event.event_title}
                            </motion.h1>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-xl md:text-xl mb-1 text-white"
                            >
                                {event.event_type}
                            </motion.h1>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-2 text-gray-300 mb-1"
                            >
                                <Calendar size={16} className="text-blue-400" />
                                <span>
                                    {formatDate(event.start_date)} • {formatTime(event.start_time)}
                                </span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-2 text-gray-300 mb-1"
                            >
                                <MapPin size={16} className="text-blue-400" />
                                <span>{`${event.venue_name}, ${event.address}, ${event.city}`}</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-2 text-gray-300 mb-5"
                            >
                                <Users size={16} className="text-blue-400" />
                                <span>{`${event.total_tickets_sold} / ${event.capacity} seats available`}</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="border-t border-gray-800 pt-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={event.organizer_profile_picture}
                                        alt={event.organizer_username}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-medium">{event.organizer_username}</p>
                                        <p className="text-sm text-gray-400">Organizer</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
                                    >
                                        <Share2 size={18} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        // onClick={toggleLike}
                                        onClick={() => Submit_Like()}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                            liked ? "bg-pink-600/20 text-pink-500" : "bg-gray-800 hover:bg-gray-700"
                                        }`}
                                    >
                                        <Heart size={18} fill={liked ? "#ec4899" : "none"} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Right Section (Event Details and Comments Tabs) */}
                    <div className="w-full md:w-[55%] flex flex-col bg-[#1a1a1a]">
                        {/* Tab Headers */}
                        <div className="flex border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={cn(
                                    "flex-1 py-4 text-center text-lg font-medium transition-colors relative",
                                    activeTab === "details"
                                        ? "text-white border-b-2 border-blue-500"
                                        : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                Event Details
                            </button>
                            <button
                                onClick={() => setActiveTab("comments")}
                                className={cn(
                                    "flex-1 py-4 text-center text-lg font-medium transition-colors relative",
                                    activeTab === "comments"
                                        ? "text-white border-b-2 border-blue-500"
                                        : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                Comments ({event.comment_count})
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-5 pt-4">
                            {activeTab === "details" ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-row shadow-lg">
                                        <div className="w-[60%]">
                                            <h2 className="text-xl md:text-2xl font-semibold text-white mb-3 tracking-tight">
                                                About this event
                                            </h2>
                                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                                                {event.description}
                                            </p>
                                        </div>
                                        <div className="flex-1 bg-gray-900 p-4 rounded-md">
                                            <div className="space-y-3">
                                                <p className="text-gray-200 text-sm md:text-base">
                                                    <span className="text-blue-400 font-medium">Start:</span>{" "}
                                                    {formatDate(event.start_date)} • {formatTime(event.start_time)}
                                                </p>
                                                <p className="text-gray-200 text-sm md:text-base">
                                                    <span className="text-blue-400 font-medium">End:</span>{" "}
                                                    {formatDate(event.end_date)} • {formatTime(event.end_time)}
                                                </p>
                                                <p
                                                    className={`text-sm md:text-base ${
                                                        event.age_restriction ? "text-red-400" : "text-green-400"
                                                    }`}
                                                >
                                                    {event.age_restriction ? "Only allowed 18+" : "Anyone can enter"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-semibold text-white mt-6">Tickets</h2>
                                    <div className="space-y-4">
                                        {event.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 flex justify-between items-center hover:bg-gray-700 transition-colors"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-lg text-white">
                                                        {ticket.ticket_type}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">{ticket.description}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-semibold text-white">
                                                        ₹{parseFloat(ticket.price).toFixed(2)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() =>
                                                                updateTicketCount(
                                                                    ticket.ticket_type,
                                                                    "decrease"
                                                                )
                                                            }
                                                            className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full text-white hover:bg-gray-600 transition-colors"
                                                        >
                                                            <span className="text-xl font-medium">-</span>
                                                        </motion.button>
                                                        <span className="w-8 text-center text-white">
                                                            {selectedTickets[ticket.ticket_type] || 0}
                                                        </span>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() =>
                                                                updateTicketCount(
                                                                    ticket.ticket_type,
                                                                    "increase"
                                                                )
                                                            }
                                                            className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full text-white hover:bg-gray-600 transition-colors"
                                                        >
                                                            <span className="text-xl font-medium">+</span>
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                        <div>
                                            <p className="text-gray-400 text-sm">Total</p>

                                            <p className="text-xl font-semibold text-white">
                                                {Object.values(selectedTickets).every((count) => count === 0)
                                                    ? "No tickets selected"
                                                    : `₹${calculateTotal().toFixed(2)}`}
                                            </p>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => navigate(`/checkout/${id}`)}
                                            className="bg-green-600 hover:bg-green-500 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                        >
                                            Proceed to Checkout
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col h-full" // Changed to flex column and full height
                                >
                                    {/* Scrollable comments area */}
                                    <div className="flex-1 overflow-y-auto space-y-4 p-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="flex items-start gap-2">
                                                <img
                                                    src={
                                                        comment.user?.profile_picture ||
                                                        comment.profile_picture ||
                                                        "https://i.pravatar.cc/100?img=33"
                                                    }
                                                    alt={comment.user?.username || comment.username}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium text-white">
                                                            {comment.user?.username || comment.username}
                                                        </h3>
                                                        <span className="text-gray-400 text-sm">
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-300 mt-1">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Fixed comment input at bottom */}
                                    <div className="border-t border-gray-700 p-4 bg-[#1a1a1a] sticky bottom-0">
                                        <div className="flex items-center gap-3">
                                            {user.profile_picture ? (
                                                <img
                                                    src={user.profile_picture}
                                                    alt="Your avatar"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <MdAccountCircle className="h-10 w-10" />
                                            )}
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Add a comment..."
                                                    className="w-full bg-gray-800 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="bg-green-600 rounded-full p-2 text-white hover:bg-green-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                disabled={!newComment.trim()}
                                                onClick={() => Submit_Comment(newComment)}
                                            >
                                                <Send size={18} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default EventDetailModal;