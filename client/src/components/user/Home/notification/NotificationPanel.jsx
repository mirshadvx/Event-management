import React, { useState, useEffect, useRef } from "react";
import { IoMdClose } from "react-icons/io";
import { MdNotificationsOff } from "react-icons/md";
import { FiTrash2, FiBell, FiUserPlus, FiCheck, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const NotificationPanel = ({
    isOpen,
    onClose,
    notifications,
    setNotifications,
    handleDeleteNotification,
    handleClearAllNotifications,
    handleAcceptFollowRequest,
    handleRejectFollowRequest,
    handleClearAllFollowRequests,
}) => {
    const panelRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [showScrollShadow, setShowScrollShadow] = useState(false);
    const [activeTab, setActiveTab] = useState("notifications");

    const followRequests = [
        {
            id: "req_001",
            username: "sarah_wilson",
            created_at: "2025-05-28T10:30:00Z",
        },
        {
            id: "req_002",
            username: "mike_jones",
            created_at: "2025-05-28T09:15:00Z",
        },
        {
            id: "req_003",
            username: "emma_davis",
            created_at: "2025-05-28T08:45:00Z",
        },
        {
            id: "req_004",
            username: "alex_thompson",
            created_at: "2025-05-27T22:30:00Z",
        },
        {
            id: "req_005",
            username: "jessica_brown",
            created_at: "2025-05-27T18:20:00Z",
        },
        {
            id: "req_006",
            username: "david_miller",
            created_at: "2025-05-27T15:10:00Z",
        },
        {
            id: "req_007",
            username: "sophia_garcia",
            created_at: "2025-05-26T20:45:00Z",
        },
        {
            id: "req_008",
            username: "ryan_martinez",
            created_at: "2025-05-26T14:30:00Z",
        },
        {
            id: "req_009",
            username: "olivia_lee",
            created_at: "2025-05-25T16:20:00Z",
        },
        {
            id: "req_010",
            username: "noah_taylor",
            created_at: "2025-05-24T12:15:00Z",
        },
    ];

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

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setScrollPosition(0);
        setShowScrollShadow(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    };

    const handleAcceptRequest = (requestId, e) => {
        e.stopPropagation();
        if (handleAcceptFollowRequest) {
            handleAcceptFollowRequest(requestId);
        }
    };

    const handleRejectRequest = (requestId, e) => {
        e.stopPropagation();
        if (handleRejectFollowRequest) {
            handleRejectFollowRequest(requestId);
        }
    };

    const renderNotifications = () => (
        <>
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
                                <span className="text-white/50 text-xs">{formatTime(notification.created_at)}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteNotification(notification.id)}
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
        </>
    );

    const renderFollowRequests = () => (
        <>
            {followRequests.length > 0 ? (
                <ul>
                    {followRequests.map((request) => (
                        <motion.li
                            key={request.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 border-b border-[#232323] hover:bg-[#191919] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#00FF82] to-[#00CC6A] rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-black font-semibold text-sm">
                                        {request.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">@{request.username}</p>
                                    <span className="text-white/50 text-xs">{formatTime(request.created_at)}</span>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => handleAcceptRequest(request.id, e)}
                                        className="bg-[#00FF82] hover:bg-[#00CC6A] text-black px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={(e) => handleRejectRequest(request.id, e)}
                                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white/70 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-[#1a1a1a] rounded-full p-4 mb-3">
                        <FiUserPlus className="text-white/30 w-8 h-8" />
                    </div>
                    <p className="text-white/50 font-medium">No follow requests</p>
                    <p className="text-white/30 text-sm max-w-xs mt-1">
                        You'll see new follow requests here when people want to follow you.
                    </p>
                </div>
            )}
        </>
    );

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
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a] bg-[#121212] relative z-10">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                {activeTab === "notifications" ? (
                                    <>
                                        <FiBell className="text-[#00FF82]" />
                                        Notifications
                                    </>
                                ) : (
                                    <>
                                        <FiUserPlus className="text-[#00FF82]" />
                                        Follow Requests
                                    </>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                {((activeTab === "notifications" && notifications.length > 0) ||
                                    (activeTab === "requests" && followRequests.length > 0)) && (
                                    <button
                                        onClick={
                                            activeTab === "notifications"
                                                ? handleClearAllNotifications
                                                : handleClearAllFollowRequests
                                        }
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

                        <div className="flex bg-[#1a1a1a] border-b border-[#2a2a2a]">
                            <button
                                onClick={() => handleTabChange("notifications")}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                                    activeTab === "notifications"
                                        ? "text-[#00FF82] bg-[#121212]"
                                        : "text-white/60 hover:text-white/80"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <FiBell className="w-4 h-4" />
                                    Notifications
                                    {notifications.length > 0 && (
                                        <span className="bg-[#00FF82] text-black text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </div>
                                {activeTab === "notifications" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF82]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange("requests")}
                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                                    activeTab === "requests"
                                        ? "text-[#00FF82] bg-[#121212]"
                                        : "text-white/60 hover:text-white/80"
                                }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <FiUserPlus className="w-4 h-4" />
                                    Requests
                                    {followRequests.length > 0 && (
                                        <span className="bg-[#00FF82] text-black text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                                            {followRequests.length}
                                        </span>
                                    )}
                                </div>
                                {activeTab === "requests" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00FF82]"></div>
                                )}
                            </button>
                        </div>

                        <div className={`relative ${showScrollShadow ? "shadow-scroll" : ""}`}>
                            {showScrollShadow && (
                                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#121212] to-transparent z-10"></div>
                            )}

                            <div ref={scrollContainerRef} className="max-h-96 overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {activeTab === "notifications" ? renderNotifications() : renderFollowRequests()}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#121212] to-transparent"></div>
                        </div>

                        {((activeTab === "notifications" && notifications.length > 0) ||
                            (activeTab === "requests" && followRequests.length > 0)) && (
                            <div className="p-3 bg-[#121212] border-t border-[#2a2a2a] text-center">
                                <button
                                    onClick={
                                        activeTab === "notifications"
                                            ? handleClearAllNotifications
                                            : handleClearAllFollowRequests
                                    }
                                    className="text-[#00FF82] text-sm hover:underline"
                                >
                                    Clear all {activeTab === "notifications" ? "notifications" : "requests"}
                                </button>
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
