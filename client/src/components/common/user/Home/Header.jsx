import React, { useState, useEffect, useRef } from "react";
import { IoMdChatbubbles, IoIosNotifications } from "react-icons/io";
import { logout } from "../../../../services/api";
import { useDispatch, useSelector } from "react-redux";
import { setAuthenticated, logoutReducer } from "../../../../store/user/userSlice";
import { useNavigate } from "react-router-dom";
import { get_ProfileData } from "../../../../store/user/userSlice";

const Header = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user, loading } = useSelector((state) => state.user);

    const [userData, setUserData] = useState({
        name: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        profilePicture: "",
    });

    useEffect(() => {
        if (!user && !loading && isAuthenticated) {
            dispatch(get_ProfileData());
        }

        if (user) {
            setUserData({
                name: user.username || "",
                title: user.title || "",
                email: user.email || "",
                phone: user.phone || "",
                location: user.location || "",
                bio: user.bio || "",
                profilePicture: user.profile_picture || "",
            });
        }
    }, [user, loading, dispatch, isAuthenticated]);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setDropdownOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            dispatch(logoutReducer());
        } catch (error) {
            console.log("logout failed ", error);
        }
    };

    useEffect(() => {
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    return (
        <div className="relative z-10">
            <header className="w-full px-6 py-1.5">
                <div className="max-w-[1350px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-6 bg-[#134638] rounded-sm"></div>
                        <span className="text-white text-lg">Evenxo</span>
                    </div>

                    {isAuthenticated ? (
                        <>
                            <nav className="bg-[#1e1e1e]/40 backdrop-blur-sm px-6 py-2 rounded-full border-2 border-[#b4b2a8] ml-24">
                                <ul className="flex space-x-8">
                                    <li>
                                        <a
                                            onClick={() => navigate("/")}
                                            className="text-white/90 hover:text-white transition-colors text-lg cursor-pointer"
                                        >
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            onClick={() => navigate("/explore")}
                                            className="text-white/90 hover:text-white transition-colors text-lg cursor-pointer"
                                        >
                                            Explore
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            onClick={() => navigate("/profile/")}
                                            className="text-white/90 hover:text-white transition-colors text-lg cursor-pointer"
                                        >
                                            Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            onClick={() => navigate("/dashboard")}
                                            className="text-white/90 hover:text-white transition-colors text-lg cursor-pointer"
                                        >
                                            Dashboard
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                            <div className="flex items-center gap-4">
                                <IoIosNotifications className="text-white w-7 h-7 cursor-pointer" />
                                <IoMdChatbubbles className="text-white w-7 h-7 cursor-pointer" />
                                {loading ? (
                                    <div>Loading...</div> 
                                ) : user ? (
                                    <div className="relative" ref={dropdownRef}>
                                        <div
                                            className="flex items-center gap-2 bg-[#00FF82] px-4 py-1.5 rounded-lg cursor-pointer"
                                            onClick={toggleDropdown}
                                        >
                                            <img
                                                src={user.profile_picture || "/default-profile.png"} 
                                                alt="Profile"
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className="text-black font-medium">{user.username || "User"}</span>
                                        </div>
                                        <div
                                            className={`absolute right-0 mt-2 w-28 bg-[#1e1e1e] border border-[#b4b2a8] rounded-lg shadow-lg overflow-hidden 
                                                transition-all duration-300 ease-out transform ${
                                                    dropdownOpen
                                                        ? "opacity-100 translate-y-0"
                                                        : "opacity-0 translate-y-[-10px] pointer-events-none"
                                                }`}
                                        >
                                            <ul className="flex flex-col items-center">
                                                <li
                                                    onClick={() => navigate("/profile/")}
                                                    className="w-full px-4 pt-1 text-white/90 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer text-center"
                                                >
                                                    Profile
                                                </li>
                                                <li
                                                    className="w-full px-4 pb-1 text-red-500 hover:bg-[#2e2e2e] transition-colors cursor-pointer text-center"
                                                    onClick={handleLogout}
                                                >
                                                    Logout
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div>No user data</div> 
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <nav className="bg-[#1e1e1e]/40 backdrop-blur-sm px-6 py-2 rounded-full border-2 border-[#b4b2a8]">
                                <ul className="flex space-x-8">
                                    <li>
                                        <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                            Explore
                                        </a>
                                    </li>
                                </ul>
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
                </div>
            </header>
        </div>
    );
};

export default Header;
