import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { ChevronLeft, Menu, X, LogOut } from "lucide-react";
import { AiFillHome } from "react-icons/ai";
import { FaCodeMerge } from "react-icons/fa6";
import { IoWallet } from "react-icons/io5";
import { FaUserAlt } from "react-icons/fa";
import { FaCreditCard } from "react-icons/fa";


const Layout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMenuActive, setIsMenuActive] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const sidebarRef = useRef(null);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const toggleMenu = () => {
        setIsMenuActive(!isMenuActive);
    };

    useEffect(()=> {

    })

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);

            if (mobile) {
                setIsCollapsed(false);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!sidebarRef.current) return;

        if (isMobile) {
            if (isMenuActive) {
                sidebarRef.current.style.height = `${sidebarRef.current.scrollHeight}px`;
            } else {
                sidebarRef.current.style.height = "56px";
            }
        } else {
            sidebarRef.current.style.height = "calc(100vh - 32px)";
        }
    }, [isMenuActive, isMobile]);

    const navItems = [
        { icon: <AiFillHome size={22} />, label: "Home", path: "/" },
        { icon: <FaUserAlt size={22} />, label: "Profile", path: "/profile", exact: true },
        { icon: <FaCodeMerge size={22} />, label: "My events", path: "/profile/events" },
        { icon: <FaCreditCard size={22} />, label: "Subscription", path: "/profile/subscription" },        
        { icon: <IoWallet size={22} />, label: "Wallet", path: "/profile/wallet" },
    ];

    const secondaryNavItems = [{ icon: <LogOut size={22} />, label: "Logout", path: "/logout" }];

    return (
        <div className="flex min-h-screen bg-[#3D4A5F]">
            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`
          fixed top-0 left-0 m-4 rounded-2xl bg-[#151A2D] transition-all duration-400
          ${isCollapsed ? "w-[85px]" : "w-[270px]"}
          ${isMobile ? "w-[calc(100%-26px)] m-3" : ""}
          ${isMobile && isMenuActive ? "overflow-y-auto" : isMobile ? "overflow-y-hidden" : ""}
        `}
            >
                <header
                    className={`
          flex items-center justify-between p-6
          ${isMobile ? "p-2 sticky top-0 z-20 bg-[#151A2D]" : ""}
        `}
                >
                    <NavLink to="/" className="header-logo">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className={`object-contain ${isMobile ? "h-10 w-10" : "h-12 w-12"}`}
                        />
                    </NavLink>

                    {/* Desktop Sidebar Toggle Button */}
                    <button
                        className={`
              h-9 w-9 flex items-center justify-center bg-white text-[#151A2D] rounded-lg cursor-pointer hover:bg-[#dde4fb]
              ${isCollapsed ? "transform -translate-x-1 translate-y-16" : ""} 
              ${isMobile ? "hidden" : "absolute right-5"}
            `}
                        onClick={toggleSidebar}
                    >
                        <ChevronLeft
                            className={`transition-transform duration-400 ${isCollapsed ? "rotate-180" : ""}`}
                            size={28}
                        />
                    </button>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className={`
              h-8 w-8 items-center justify-center bg-white text-[#151A2D] rounded-lg cursor-pointer
              ${isMobile ? "flex" : "hidden"}
            `}
                        onClick={toggleMenu}
                    >
                        {isMenuActive ? <X size={21} /> : <Menu size={21} />}
                    </button>
                </header>

                <nav className="sidebar-nav">
                    {/* Primary Navigation */}
                    <ul
                        className={`
            list-none flex flex-col gap-1 px-4 transition-transform duration-400
            ${isCollapsed ? "translate-y-16" : "translate-y-4"}
            ${isMobile ? "px-3" : ""}
          `}
                    >
                        {navItems.map((item, index) => (
                            <li key={index} className="relative group">
                                <NavLink
                                    to={item.path}
                                    end={item.exact}
                                    className={({ isActive }) => `
                    text-white flex gap-3 whitespace-nowrap rounded-lg p-3 items-center no-underline
                    hover:text-[#151A2D] hover:bg-white
                    ${isActive ? "bg-[#00EF93] text-[#151A2D]" : ""}
                  `}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span
                                        className={`transition-opacity duration-300 ${
                                            isCollapsed ? "opacity-0 pointer-events-none" : ""
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </NavLink>

                                {/* Tooltip for collapsed sidebar (desktop only) */}
                                {!isMobile && (
                                    <div
                                        className={`
                    absolute top-0 left-full ml-6 px-3 py-2 bg-white text-[#151A2D] rounded-lg whitespace-nowrap
                    opacity-0 pointer-events-none z-50
                    group-hover:opacity-100 group-hover:pointer-events-auto
                    transition-opacity duration-300
                    ${!isCollapsed && "hidden"}
                  `}
                                    >
                                        {item.label}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Secondary Navigation (bottom) */}
                    <ul
                        className={`
            list-none flex flex-col gap-1 px-4 w-full transition-all
            ${isMobile ? "relative my-10 mb-8 px-3" : "absolute bottom-8"}
          `}
                    >
                        {secondaryNavItems.map((item, index) => (
                            <li key={index} className="relative group">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => `
                    text-white flex gap-3 whitespace-nowrap rounded-lg p-3 items-center no-underline
                    hover:text-[#151A2D] hover:bg-white
                    ${isActive ? "bg-white text-[#151A2D]" : ""}
                  `}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span
                                        className={`transition-opacity duration-300 ${
                                            isCollapsed ? "opacity-0 pointer-events-none" : ""
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </NavLink>

                                {/* Tooltip for collapsed sidebar (desktop only) */}
                                {!isMobile && (
                                    <div
                                        className={`
                    absolute top-0 left-full ml-6 px-3 py-2 bg-white text-[#151A2D] rounded-lg whitespace-nowrap
                    opacity-0 pointer-events-none z-50
                    group-hover:opacity-100 group-hover:pointer-events-auto
                    transition-opacity duration-300
                    ${!isCollapsed && "hidden"}
                  `}
                                    >
                                        {item.label}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main
                className={`
        flex-1 pt-4 pr-4 pb-4 transition-all duration-400
        ${isMobile ? "ml-0 mt-[70px]" : isCollapsed ? "ml-[117px]" : "ml-[302px]"}
      `}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;