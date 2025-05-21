import React, { useState, useEffect, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { MdNotificationsOff } from "react-icons/md";
import { FiTrash2, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const NotificationPanel = ({ isOpen, onClose, notifications, setNotifications, handleDeleteNotification, handleClearAllNotifications }) => {
    const panelRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showScrollShadow, setShowScrollShadow] = useState(false);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return "Just now";
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const days = Math.floor(diffInHours / 24);
            return days === 1 ? "Yesterday" : `${days} days ago`;
        }
    };

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop } = scrollContainerRef.current;
            setScrollPosition(scrollTop);
            setShowScrollShadow(scrollTop > 5);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                !event.target.closest(".notification-icon")
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", handleScroll);
            return () => scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, []);

    const handlePanelClick = (e) => {
        e.stopPropagation();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-end pt-16 px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        ref={panelRef}
                        className="w-full max-w-sm bg-[#121212] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden"
                        onClick={handlePanelClick}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a] bg-[#121212] relative z-10">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <FiBell className="text-[#00FF82]" />
                                Notifications
                            </h3>
                            <div className="flex gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearAllNotifications}
                                        className="text-white/70 hover:text-[#00FF82] transition-colors flex items-center gap-1 text-xs"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Clear all</span>
                                    </button>
                                )}
                                <button onClick={onClose} className="text-white/70 hover:text-white">
                                    <IoMdClose className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className={`relative ${showScrollShadow ? "shadow-scroll" : ""}`}>
                            {showScrollShadow && (
                                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#121212] to-transparent z-10"></div>
                            )}

                            <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    <ul>
                                        {notifications.map((notification) => (
                                            <motion.li
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 border-b border-[#232323] hover:bg-[#191919] transition-colors flex justify-between relative overflow-hidden"
                                            >
                                                <div className="pl-2">
                                                    <p className="text-sm text-white font-medium">{notification.message}</p>
                                                    <span className="text-white/50 text-xs">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                                                    className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0 h-fit p-1"
                                                >
                                                    <IoMdClose className="w-4 h-4" />
                                                </button>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-[#1a1a1a] rounded-full p-4 mb-3">
                                            <MdNotificationsOff className="text-white/30 w-8 h-8" />
                                        </div>
                                        <p className="text-white/50 font-medium">No notifications</p>
                                        <p className="text-white/30 text-sm max-w-xs mt-1">
                                            You'll see new notifications here when there's activity on your events.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#121212] to-transparent"></div>
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-[#121212] border-t border-[#2a2a2a] text-center">
                                <button onClick={handleClearAllNotifications} className="text-[#00FF82] text-sm hover:underline">Clear all</button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const style = document.createElement("style");
style.textContent = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);

export default NotificationPanel;
