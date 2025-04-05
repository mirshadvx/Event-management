import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { GoGraph } from "react-icons/go";
import {
  LayoutGrid,
  Users,
  Package,
  ShoppingCart,
  BarChart,
  DollarSign,
  CreditCard,
  Settings,
} from "lucide-react";
import { FaUserCog } from "react-icons/fa";
import { TicketPercent } from 'lucide-react';
import { TicketX } from 'lucide-react';

import { MdEvent } from "react-icons/md";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navItems = [
    { name: "Dashboard", icon: <GoGraph className="w-6 h-6" />, path: "dashboard" },
    { name: "Users", icon: <Users className="w-6 h-6" />, path: "users" },
    { name: "Oranizer Requests", icon: <FaUserCog className="w-6 h-6" />, path: "oranizer-requests" },
    { name: "Events", icon: <MdEvent className="w-6 h-6" />, path: "events" },
    // { name: "Coupons", icon: <ShoppingCart className="w-6 h-6" />, path: "coupons" },
    { name: "Coupons", icon: <TicketPercent className="w-6 h-6" />, path: "coupons" },
    { name: "Achievements", icon: <BarChart className="w-6 h-6" />, path: "achievements" },
    { name: "Refund", icon: <TicketX className="w-6 h-6" />, path: "refund" },
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

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-1">
        <nav className="grid gap-1 px-2">
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
        </nav>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-0 top-20 transform translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm rounded-full p-2 hidden md:flex hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* User Profile */}
      <div
        className={`border-t border-gray-200 dark:border-gray-700 mt-auto ${collapsed ? "p-2" : "p-4"}`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <img
            src="/api/placeholder/32/32"
            alt="User"
            className="w-8 h-8 rounded-full object-cover"
          />
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