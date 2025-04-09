import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { GoGraph } from "react-icons/go";
import { Users, BarChart, CreditCard, Settings } from "lucide-react";
import { FaUserCog } from "react-icons/fa";
import { TicketPercent, TicketX } from "lucide-react";
import { MdEvent } from "react-icons/md";
import { BsBank2 } from "react-icons/bs";
import { ScrollArea } from "@/components/ui/scroll-area";

const Sidebar = ({ collapsed, setCollapsed }) => {
    const [financeOpen, setFinanceOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", icon: <GoGraph className="w-6 h-6" />, path: "dashboard" },
        { name: "Users", icon: <Users className="w-6 h-6" />, path: "users" },
        { name: "Oranizer Requests", icon: <FaUserCog className="w-6 h-6" />, path: "oranizer-requests" },
        { name: "Events", icon: <MdEvent className="w-6 h-6" />, path: "events" },
        { name: "Coupons", icon: <TicketPercent className="w-6 h-6" />, path: "coupons" },
        { name: "Achievements", icon: <BarChart className="w-6 h-6" />, path: "achievements" },
        { name: "Ticket purchases", icon: <TicketX className="w-6 h-6" />, path: "ticket-purchase" },
    ];

    const financeItems = [
        { name: "Revenue Overview", path: "finance/revenue" },
        { name: "Transaction History", path: "finance/transactions-history" },
        { name: "Refund History", path: "finance/refunds-history" },
    ];

    const additionalItems = [
        { name: "Subscription", icon: <CreditCard className="w-6 h-6" />, path: "subscription" },
        { name: "Settings", icon: <Settings className="w-6 h-6" />, path: "settings" },
    ];

    return (
        <div
            className={`h-full flex flex-col bg-white dark:bg-gray-900 border-r shadow-sm dark:border-gray-700 transition-all duration-300 ease-in-out ${
                collapsed ? "w-16" : "w-64"
            }`}
        >
            {/* Header */}
            <div
                className={`p-4 flex items-center ${collapsed ? "justify-center" : "gap-2"} border-b dark:border-gray-700`}
            >
                {!collapsed && <h1 className="font-bold text-xl text-gray-900 dark:text-white">Evenxo</h1>}
            </div>

            {/* Navigation with ScrollArea */}
            <ScrollArea className="flex-1 h-0">
                <nav className="grid gap-1 px-2 py-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={`/admin/${item.path}`}
                            className={({ isActive }) =>
                                `flex items-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                    isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                                } ${collapsed ? "justify-center" : "justify-start"}`
                            }
                            title={collapsed ? item.name : undefined}
                        >
                            {item.icon}
                            {!collapsed && <span className="ml-3 text-lg">{item.name}</span>}
                        </NavLink>
                    ))}

                    {/* Finance Management Section */}
                    <div>
                        <button
                            onClick={() => !collapsed && setFinanceOpen(!financeOpen)}
                            className={`w-full flex items-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                collapsed ? "justify-center" : "justify-between"
                            }`}
                        >
                            <div className="flex items-center">
                                <BsBank2 className="w-6 h-6" />
                                {!collapsed && <span className="ml-3">Finance Management</span>}
                            </div>
                            {!collapsed && (
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${financeOpen ? "rotate-180" : ""}`}
                                />
                            )}
                        </button>

                        {!collapsed && financeOpen && (
                            <div className="ml-6 mt-1 space-y-1">
                                {financeItems.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={`/admin/${item.path}`}
                                        className={({ isActive }) =>
                                            `block p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm ${
                                                isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    {additionalItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={`/admin/${item.path}`}
                            className={({ isActive }) =>
                                `flex items-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                    isActive ? "bg-gray-200 dark:bg-gray-700" : ""
                                } ${collapsed ? "justify-center" : "justify-start"}`
                            }
                            title={collapsed ? item.name : undefined}
                        >
                            {item.icon}
                            {!collapsed && <span className="ml-3 text-lg">{item.name}</span>}
                        </NavLink>
                    ))}
                </nav>
            </ScrollArea>

            {/* Collapse Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute right-0 top-20 transform translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm rounded-full p-2 hidden md:flex hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* User Profile (Commented out as in your code) */}
            <div className={`border-t border-gray-200 dark:border-gray-700 mt-auto ${collapsed ? "p-2" : "p-4"}`}>
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                    <img src="/api/placeholder/32/32" alt="User" className="w-8 h-8 rounded-full object-cover" />
                    {!collapsed && (
                        <>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@example.com</p>
                            </div>
                            <div className="relative">
                                <button className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg hidden group-hover:block">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        <div className="px-4 py-2 font-medium">My Account</div>
                                        <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            Profile
                                        </div>
                                        <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            Settings
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                                        <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            Logout
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
