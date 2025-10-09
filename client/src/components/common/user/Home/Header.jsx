import React, { useState, useEffect, useRef } from "react";
import { IoMdChatbubbles, IoIosNotifications, IoMdMenu, IoMdClose } from "react-icons/io";
import { logout } from "@/services/api";
import { useDispatch, useSelector } from "react-redux";
import { logoutReducer, get_ProfileData } from "@/store/user/userSlice";
import { useNavigate } from "react-router-dom";
import NotificationPanel from "@/components/user/Home/notification/NotificationPanel";
import {
    fetchNotifications,
    deleteNotification,
    clearAllNotification,
} from "@/services/user/notification/notificationService";
import { connectWebSocket, removeListener, disconnectWebSocket } from "@/services/user/notification/webSocketManager";
import evenxo_logo from "@/assets/images/evenxo_logo.png";
import { IoPersonCircle } from "react-icons/io5";

const Header = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [scrollDir, setScrollDir] = useState("up");
    const [scrollPosition, setScrollPosition] = useState(0);
    const [visible, setVisible] = useState(true);
    const [headerBg, setHeaderBg] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const prevScrollY = useRef(0);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user, loading } = useSelector((state) => state.user);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollPosition(currentScrollY);

            if (currentScrollY > prevScrollY.current) {
                setScrollDir("down");
            } else {
                setScrollDir("up");
            }

            prevScrollY.current = currentScrollY;

            if (currentScrollY < 50) {
                setVisible(true);
                setHeaderBg(false);
            } else if (scrollDir === "up") {
                setVisible(true);
                setHeaderBg(true);
            } else if (scrollDir === "down" && currentScrollY > 100) {
                setVisible(false);
                setHeaderBg(true);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollDir]);

    useEffect(() => {
        if (!user && isAuthenticated && !loading) {
            dispatch(get_ProfileData());
        }
    }, [user, isAuthenticated, loading, dispatch]);

    useEffect(() => {
        if (isAuthenticated && user) {
            console.log("Header: Setting up WebSocket connection for user:", user.id);
            
            const handleNotification = (data) => {
                console.log("Header: Received notification data:", data);
                setNotifications((prevNotifications) => {
                    if (prevNotifications.some((notif) => notif.id === data.id)) {
                        console.log("Header: Duplicate notification, skipping");
                        return prevNotifications; 
                    }
                    console.log("Header: Adding new notification to list");
                    return [data, ...prevNotifications];
                });
                setUnreadCount((prevCount) => prevCount + 1);
            };

            connectWebSocket(user.id, handleNotification);

            fetchNotifications().then((data) => {
                setNotifications(data);
                setUnreadCount(data.length);
            });

            return () => {
                console.log("Header: Cleaning up WebSocket connection for user:", user.id);
                removeListener(handleNotification);
                disconnectWebSocket();
            };
        }
    }, [isAuthenticated, user]);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
        if (notificationOpen) setNotificationOpen(false);
    };

    const toggleNotification = () => {
        setNotificationOpen(!notificationOpen);
        if (dropdownOpen) setDropdownOpen(false);
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        if (
            mobileMenuRef.current &&
            !mobileMenuRef.current.contains(e.target) &&
            !e.target.closest(".mobile-menu-button")
        ) {
            setMobileMenuOpen(false);
        }
    };

    useEffect(() => {
        if (dropdownOpen || mobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen, mobileMenuOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            dispatch(logoutReducer());
            setMobileMenuOpen(false);
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
        setDropdownOpen(false);
        setNotificationOpen(false);
    };

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter((notification) => notification.id !== id));
            setUnreadCount((prevCount) => prevCount - 1);
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    const handleClearAllNotifications = async () => {
        try {
            await clearAllNotification();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to clear all notifications:", error);
        }
    };

    const isDesktop = windowWidth >= 768;

    return (
        <>
            <header
                className={`w-full px-4 lg:px-6 py-2 z-50 fixed left-0 right-0 transition-all duration-300 ease-in-out
          ${visible ? "top-0" : "-top-20"}
          ${headerBg ? "bg-[#1e1e1e]/10 backdrop-blur-md" : ""}`}
            >
                <div className="max-w-[1350px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 z-20">
                        <div className="w-13 h-13 flex items-center justify-center overflow-hidden">
                            <img src={evenxo_logo} alt="Evenxo Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-white text-lg lg:text-xl font-semibold">Evenxo</span>
                    </div>

                    {isAuthenticated && isDesktop && (
                        <>
                            <nav className="flex items-center space-x-6 ml-12 bg-[#1e1e1e]/40 backdrop-blur-sm px-6 py-2 rounded-full border border-[#b4b2a8]">
                                <a
                                    onClick={() => handleNavigation("/")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Home
                                </a>
                                <a
                                    onClick={() => handleNavigation("/explore")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Explore
                                </a>
                                <a
                                    onClick={() => handleNavigation("/profile/")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Profile
                                </a>
                                <a
                                    onClick={() => handleNavigation("/dashboard")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Dashboard
                                </a>
                            </nav>

                            <div className="flex items-center gap-4">
                                <div className="relative notification-icon">
                                    <div className="relative cursor-pointer" onClick={toggleNotification}>
                                        <IoIosNotifications
                                            className={`text-white w-6 h-6 ${notificationOpen ? "text-[#00FF82]" : ""}`}
                                        />
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    </div>
                                </div>

                                <IoMdChatbubbles
                                    className="text-white w-6 h-6 cursor-pointer"
                                    onClick={() => handleNavigation("/chat")}
                                />

                                <div className="relative" ref={dropdownRef}>
                                    <div
                                        className="flex items-center gap-2 bg-[#00FF82] px-3 py-1 rounded-lg cursor-pointer"
                                        onClick={toggleDropdown}
                                    >
                                        {user?.profile_picture ? (
                                            <img
                                                src={user.profile_picture}
                                                alt="Profile"
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <IoPersonCircle className="w-8 h-8 text-black" />
                                        )}
                                        <span className="text-black font-medium text-sm">{user?.username || "User"}</span>
                                    </div>

                                    <div
                                        className={`absolute right-0 mt-2 w-28 bg-[#1e1e1e] border border-[#b4b2a8] rounded-lg transition-all duration-300 ease-out transform ${
                                            dropdownOpen
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 -translate-y-2 pointer-events-none"
                                        }`}
                                    >
                                        <ul>
                                            <li
                                                onClick={() => handleNavigation("/profile/")}
                                                className="px-4 py-2 text-white/90 hover:bg-[#2e2e2e] cursor-pointer"
                                            >
                                                Profile
                                            </li>
                                            <li
                                                onClick={handleLogout}
                                                className="px-4 py-2 text-red-500 hover:bg-[#2e2e2e] cursor-pointer"
                                            >
                                                Logout
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!isAuthenticated && isDesktop && (
                        <>
                            <nav className="flex items-center space-x-6 ml-12 bg-[#1e1e1e]/40 backdrop-blur-sm px-6 py-2 rounded-full border border-[#b4b2a8]">
                                <a
                                    onClick={() => handleNavigation("/")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Home
                                </a>
                                <a
                                    onClick={() => handleNavigation("/explore")}
                                    className="text-white/90 hover:text-white cursor-pointer"
                                >
                                    Explore
                                </a>
                            </nav>
                            <div className="flex items-center gap-4">
                                <div className="relative" onClick={() => navigate("/login")}>
                                    <div className="flex items-center gap-2 bg-[#00FF82] px-4 py-1.5 rounded-lg cursor-pointer">
                                        <span className="text-black font-medium">Login</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {!isAuthenticated && !isDesktop && (
                        <>
                            <div className="flex items-center gap-4">
                                <div className="relative" onClick={() => navigate("/login")}>
                                    <div className="flex items-center gap-2 bg-[#00FF82] px-4 py-1.5 rounded-lg cursor-pointer">
                                        <span className="text-black font-medium">Login</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {isAuthenticated && !isDesktop && (
                        <div className="flex items-center gap-4">
                            <div className="notification-icon relative">
                                <div className="relative cursor-pointer" onClick={toggleNotification}>
                                    <IoIosNotifications
                                        className={`text-white w-6 h-6 ${notificationOpen ? "text-[#00FF82]" : ""}`}
                                    />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                </div>
                            </div>

                            <button className="text-white p-2 mobile-menu-button" onClick={toggleMobileMenu}>
                                {mobileMenuOpen ? <IoMdClose className="w-6 h-6" /> : <IoMdMenu className="w-6 h-6" />}
                            </button>
                        </div>
                    )}
                </div>

                {isAuthenticated && !isDesktop && (
                    <div
                        ref={mobileMenuRef}
                        className={`fixed top-0 right-0 h-full w-64 bg-[#1e1e1e] transform transition-transform duration-300 ease-in-out z-40 ${
                            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        <div className="p-4 flex flex-col h-full">
                            <div className="mt-10 mb-6 flex items-center gap-2">
                                <img
                                    src={user?.profile_picture || "/default-profile.png"}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full"
                                />
                                <span className="text-white font-medium">{user?.username || "User"}</span>
                            </div>

                            <nav className="flex-1 space-y-4">
                                <a
                                    onClick={() => handleNavigation("/")}
                                    className="text-white/90 hover:text-white text-lg block cursor-pointer"
                                >
                                    Home
                                </a>
                                <a
                                    onClick={() => handleNavigation("/explore")}
                                    className="text-white/90 hover:text-white text-lg block cursor-pointer"
                                >
                                    Explore
                                </a>
                                <a
                                    onClick={() => handleNavigation("/profile/")}
                                    className="text-white/90 hover:text-white text-lg block cursor-pointer"
                                >
                                    Profile
                                </a>
                                <a
                                    onClick={() => handleNavigation("/dashboard")}
                                    className="text-white/90 hover:text-white text-lg block cursor-pointer"
                                >
                                    Dashboard
                                </a>
                            </nav>

                            <div className="mt-auto mb-6 space-y-4">
                                <div
                                    className="flex items-center gap-4 cursor-pointer"
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        toggleNotification();
                                    }}
                                >
                                    <div className="relative">
                                        <IoIosNotifications className="text-white w-6 h-6" />
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    </div>
                                    <span className="text-white/90">Notifications</span>
                                </div>
                                <div
                                    className="flex items-center gap-4 cursor-pointer"
                                    onClick={() => handleNavigation("/chat")}
                                >
                                    <IoMdChatbubbles className="text-white w-6 h-6" />
                                    <span className="text-white/90">Messages</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2 text-red-500 hover:bg-[#2e2e2e] rounded-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <NotificationPanel
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
                notifications={notifications}
                setNotifications={setNotifications}
                handleDeleteNotification={handleDeleteNotification}
                handleClearAllNotifications={handleClearAllNotifications}
            />
        </>
    );
};

export default Header;
