import React, { useState, useRef, useEffect } from "react";
import { X, Calendar, MapPin, Users, Share2, Heart, Send, Image as ImageIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { MdAccountCircle } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { setTicketCount } from "@/store/user/ticketSlicer";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

function EventDetailModal({ id, onClose, onEventUpdate }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);
    const selectedTickets = useSelector((state) => state.tickets.selectedTickets[id] || {});

    const [activeTab, setActiveTab] = useState("details");
    const [ticketCounts, setTicketCounts] = useState({});
    const [currentSlide, setCurrentSlide] = useState(0);
    const [liked, setLiked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [showImageModal, setShowImageModal] = useState(false);
    const modalRef = useRef(null);
    const imageModalRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [comments, setComments] = useState([]);

    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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

    useEffect(() => {
        const handleImageModalClickOutside = (event) => {
            if (imageModalRef.current && !imageModalRef.current.contains(event.target)) {
                setShowImageModal(false);
            }
        };
        if (showImageModal) {
            document.addEventListener("mousedown", handleImageModalClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleImageModalClickOutside);
    }, [showImageModal]);

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
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const Submit_Like = async () => {
        try {
            const response = await api.post(`event/interact/${id}/`, { action: "like" });
            if (response.status === 201) {
                setLiked(true);
                setEvent((prevEvent) => {
                    const updatedEvent = { ...prevEvent, like_count: prevEvent.like_count + 1 };
                    onEventUpdate(updatedEvent);
                    return updatedEvent;
                });
            } else if (response.status === 200) {
                setLiked(false);
                setEvent((prevEvent) => {
                    const updatedEvent = { ...prevEvent, like_count: prevEvent.like_count - 1 };
                    onEventUpdate(updatedEvent);
                    return updatedEvent;
                });
            }
        } catch (error) {
            console.error("Error liking event:", error);
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

    const ImageModal = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        >
            <motion.div
                ref={imageModalRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative max-w-4xl max-h-[90vh] w-full mx-4"
            >
                <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                >
                    <X size={20} className="text-white" />
                </button>

                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentSlide}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            src={images[currentSlide]}
                            alt={`${event.event_title} - image ${currentSlide + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </AnimatePresence>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                            >
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
                                    className="text-white"
                                >
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                            >
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
                                    className="text-white"
                                >
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>

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
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px] p-2 md:p-4"
            >
                <motion.div
                    ref={modalRef}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 30, stiffness: 500 }}
                    className={cn(
                        "bg-[#121212] text-white w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col",
                        isMobile ? "max-w-sm h-[95vh]" : "max-w-5xl h-[90vh] md:flex-row"
                    )}
                >
                    {isMobile ? (
                        <ScrollArea className="flex flex-col overflow-y-auto ">
                            <div className="h-auto">
                                <div className="flex justify-between items-center p-4 border-b border-gray-800 flex-shrink-0">
                                    <h1 className="text-lg font-bold truncate pr-2">{event?.event_title}</h1>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-4 flex-shrink-0">
                                    <button
                                        onClick={() => setShowImageModal(true)}
                                        className="w-full aspect-[4/3] bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors relative overflow-hidden"
                                    >
                                        {images.length > 0 ? (
                                            <>
                                                <img
                                                    src={images[0]}
                                                    alt={event?.event_title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <div className="bg-black/50 rounded-full p-3">
                                                        <ImageIcon size={24} className="text-white" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <ImageIcon size={32} className="text-gray-400 mb-2 mx-auto" />
                                                <span className="text-gray-400">View Images</span>
                                            </div>
                                        )}
                                    </button>
                                </div>

                                <div className="px-4 pb-4 flex-shrink-0">
                                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-400 text-sm font-medium bg-blue-400/10 px-2 py-1 rounded-full">
                                                {event?.event_type}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={Submit_Like}
                                                    className={cn(
                                                        "p-2 rounded-full transition-colors",
                                                        liked
                                                            ? "bg-pink-600/20 text-pink-500"
                                                            : "bg-gray-800 hover:bg-gray-700"
                                                    )}
                                                >
                                                    <Heart size={16} fill={liked ? "#ec4899" : "none"} />
                                                </button>
                                                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Calendar size={16} className="text-blue-400" />
                                                <span className="text-sm">
                                                    {formatDate(event?.start_date)} • {formatTime(event?.start_time)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <MapPin size={16} className="text-blue-400" />
                                                <span className="text-sm">{`${event?.venue_name}, ${event?.city}`}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Users size={16} className="text-blue-400" />
                                                <span className="text-sm">{`${event?.total_tickets_sold} / ${event?.capacity} available`}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                                            <img
                                                src={event?.organizer_profile_picture}
                                                alt={event?.organizer_username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{event?.organizer_username}</p>
                                                <p className="text-xs text-gray-400">Organizer</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex border-b border-gray-700 bg-[#121212] flex-shrink-0">
                                    {["details", "tickets", "comments"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "flex-1 py-3 text-center text-sm font-medium transition-colors relative",
                                                activeTab === tab
                                                    ? "text-white border-b-2 border-blue-500"
                                                    : "text-gray-400 hover:text-gray-300"
                                            )}
                                        >
                                            {tab === "details" && "Details"}
                                            {tab === "tickets" && "Tickets"}
                                            {tab === "comments" && `Comments (${event?.comment_count || 0})`}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === "details" && (
                                            <motion.div
                                                key="details"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="p-4 space-y-4"
                                            >
                                                <div>
                                                    <h3 className="text-lg font-semibold mb-3">About This Event</h3>
                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {event?.description}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-900/50 rounded-lg p-4">
                                                    <h4 className="font-medium mb-3">Event Schedule</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-400">Start:</span>
                                                            <span>
                                                                {formatDate(event?.start_date)} •{" "}
                                                                {formatTime(event?.start_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-400">End:</span>
                                                            <span>
                                                                {formatDate(event?.end_date)} •{" "}
                                                                {formatTime(event?.end_time)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-blue-400">Age Limit:</span>
                                                            <span
                                                                className={
                                                                    event?.age_restriction
                                                                        ? "text-red-400"
                                                                        : "text-green-400"
                                                                }
                                                            >
                                                                {event?.age_restriction ? "18+ Only" : "All Ages"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-900/50 rounded-lg p-4">
                                                    <h4 className="font-medium mb-3">Venue Information</h4>
                                                    <div className="space-y-1 text-sm text-gray-300">
                                                        <p>{event?.venue_name}</p>
                                                        <p>{event?.address}</p>
                                                        <p>{event?.city}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === "tickets" && (
                                            <motion.div
                                                key="tickets"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex flex-col h-full"
                                            >
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                    <h3 className="text-lg font-semibold">Select Tickets</h3>

                                                    <div className="space-y-3">
                                                        {event?.tickets?.map((ticket) => (
                                                            <div key={ticket.id} className="bg-gray-800/50 rounded-lg p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-medium text-white">
                                                                            {ticket.ticket_type}
                                                                        </h4>
                                                                        <p className="text-gray-400 text-sm mt-1">
                                                                            {ticket.description}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-white font-semibold ml-2">
                                                                        ₹{parseFloat(ticket.price).toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            onClick={() =>
                                                                                updateTicketCount(
                                                                                    ticket.ticket_type,
                                                                                    "decrease"
                                                                                )
                                                                            }
                                                                            className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full text-white hover:bg-gray-600 transition-colors"
                                                                        >
                                                                            <span className="text-lg font-medium">-</span>
                                                                        </button>
                                                                        <span className="w-8 text-center text-white font-medium">
                                                                            {selectedTickets[ticket.ticket_type] || 0}
                                                                        </span>
                                                                        <button
                                                                            onClick={() =>
                                                                                updateTicketCount(
                                                                                    ticket.ticket_type,
                                                                                    "increase"
                                                                                )
                                                                            }
                                                                            className="w-8 h-8 bg-gray-700 flex items-center justify-center rounded-full text-white hover:bg-gray-600 transition-colors"
                                                                        >
                                                                            <span className="text-lg font-medium">+</span>
                                                                        </button>
                                                                    </div>

                                                                    {selectedTickets[ticket.ticket_type] > 0 && (
                                                                        <div className="text-right">
                                                                            <p className="text-sm text-gray-400">
                                                                                Subtotal
                                                                            </p>
                                                                            <p className="font-medium text-green-400">
                                                                                ₹
                                                                                {(
                                                                                    selectedTickets[ticket.ticket_type] *
                                                                                    parseFloat(ticket.price)
                                                                                ).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-gray-900/80 rounded-lg p-4 flex-shrink-0 border-t border-gray-700">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div>
                                                            <p className="text-gray-400 text-sm">Total Amount</p>
                                                            <p className="text-xl font-bold text-white">
                                                                {Object.values(selectedTickets).every(
                                                                    (count) => count === 0
                                                                )
                                                                    ? "₹0.00"
                                                                    : `₹${calculateTotal().toFixed(2)}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/checkout/${id}`)}
                                                            disabled={Object.values(selectedTickets).every(
                                                                (count) => count === 0
                                                            )}
                                                            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                                                        >
                                                            Checkout
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>

                                                    {Object.values(selectedTickets).some((count) => count > 0) && (
                                                        <div className="text-xs text-gray-400 mt-2">
                                                            {Object.entries(selectedTickets)
                                                                .filter(([_, count]) => count > 0)
                                                                .map(([type, count]) => `${count} × ${type}`)
                                                                .join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === "comments" && (
                                            <motion.div
                                                key="comments"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex flex-col h-full"
                                            >
                                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                                    {comments.length === 0 ? (
                                                        <div className="text-center py-8">
                                                            <p className="text-gray-400">
                                                                No comments yet. Be the first to comment!
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        comments.map((comment) => (
                                                            <div key={comment.id} className="flex items-start gap-3">
                                                                <img
                                                                    src={
                                                                        comment.user?.profile_picture ||
                                                                        comment.profile_picture ||
                                                                        "https://i.pravatar.cc/100?img=33"
                                                                    }
                                                                    alt={comment.user?.username || comment.username}
                                                                    className="w-8 h-8 rounded-full object-cover"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-medium text-white text-sm">
                                                                            {comment.user?.username || comment.username}
                                                                        </h4>
                                                                        <span className="text-gray-400 text-xs">
                                                                            {new Date(
                                                                                comment.created_at
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-300 text-sm mt-1">
                                                                        {comment.text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                <div className="border-t border-gray-700 p-4 bg-[#1a1a1a] flex-shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        {user.profile_picture ? (
                                                            <img
                                                                src={user.profile_picture}
                                                                alt="Your avatar"
                                                                className="w-8 h-8 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <MdAccountCircle className="h-8 w-8 text-gray-400" />
                                                        )}
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                placeholder="Add a comment..."
                                                                className="w-full bg-gray-800 rounded-full px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={newComment}
                                                                onChange={(e) => setNewComment(e.target.value)}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === "Enter" && newComment.trim()) {
                                                                        Submit_Comment(newComment);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <button
                                                            className="bg-green-600 rounded-full p-2 text-white hover:bg-green-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                            disabled={!newComment.trim()}
                                                            onClick={() => Submit_Comment(newComment)}
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex h-full">
                            <div className="relative md:w-[45%] h-full flex flex-col">
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

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                                                }
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
                                                onClick={() =>
                                                    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                                                }
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
                                        </>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                                    >
                                        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                                            <X size={20} />
                                        </motion.div>
                                    </button>
                                </div>

                                <div className="px-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <motion.h1
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-xl md:text-2xl font-bold mb-1 text-white"
                                        >
                                            {event.event_title}
                                        </motion.h1>
                                        <motion.h2
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="text-lg md:text-xl mb-2 text-blue-400"
                                        >
                                            {event.event_type}
                                        </motion.h2>
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
                                    </div>
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
                                                onClick={Submit_Like}
                                                className={cn(
                                                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                                    liked ? "bg-pink-600/20 text-pink-500" : "bg-gray-800 hover:bg-gray-700"
                                                )}
                                            >
                                                <Heart size={18} fill={liked ? "#ec4899" : "none"} />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="w-full md:w-[55%] flex flex-col bg-[#1a1a1a]">
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
                                                            className={cn(
                                                                "text-sm md:text-base",
                                                                event.age_restriction ? "text-red-400" : "text-green-400"
                                                            )}
                                                        >
                                                            {event.age_restriction
                                                                ? "Only allowed 18+"
                                                                : "Anyone can enter"}
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
                                                                        updateTicketCount(ticket.ticket_type, "decrease")
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
                                                                        updateTicketCount(ticket.ticket_type, "increase")
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
                                                    disabled={Object.values(selectedTickets).every((count) => count === 0)}
                                                    className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
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
                                        >
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

                                            <div className="border-t border-gray-700 p-4 bg-[#1a1a1a] flex-shrink-0">
                                                <div className="flex items-center gap-3">
                                                    {user.profile_picture ? (
                                                        <img
                                                            src={user.profile_picture}
                                                            alt="Your avatar"
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <MdAccountCircle className="h-10 w-10 text-gray-400" />
                                                    )}
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Add a comment..."
                                                            className="w-full bg-gray-800 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={newComment}
                                                            onChange={(e) => setNewComment(e.target.value)}
                                                            onKeyPress={(e) => {
                                                                if (e.key === "Enter" && newComment.trim()) {
                                                                    Submit_Comment(newComment);
                                                                }
                                                            }}
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
                    )}
                </motion.div>
            </motion.div>

            {showImageModal && <ImageModal />}
        </>
    );
}

export default EventDetailModal;
