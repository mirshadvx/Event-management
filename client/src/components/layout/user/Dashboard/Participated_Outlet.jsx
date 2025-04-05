import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";

const EventCard = ({ image, title, location, date, time, price, participants, category }) => (
    <div className="relative bg-[#2A2A2A] rounded-xl overflow-hidden group cursor-pointer">
        <img src={image} alt={title} className="w-full h-[280px] object-cover" />
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            <div className="text-xs text-gray-400 mb-1">{category}</div>
            <h3 className="text-white font-medium mb-2">{title}</h3>
            <div className="space-y-1.5 text-gray-300 text-[13px]">
                <div className="flex items-center gap-2">
                    <span>📍</span> {location}
                </div>
                <div className="flex items-center gap-2">
                    <span>📅</span> {date}
                </div>
                <div className="flex items-center gap-2">
                    <span>⏰</span> {time}
                </div>
                <div className="flex items-center gap-2">
                    <span>💰</span> From {price}
                </div>
                <div className="flex items-center gap-2">
                    <span>👥</span> {participants} Participants
                </div>
            </div>
            <div className="absolute right-2 bottom-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/10 rounded-full p-1">
                    <ChevronDown className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    </div>
);

const Participated_Outlet = () => {
    const events = [
        {
            image: "/api/placeholder/400/320",
            category: "Edu & Hackathon",
            title: "Music in the Park: Summer Concert Series",
            location: "Central Park, New York City, United States",
            date: "Sunday, July 30, 2025",
            time: "06:00 PM",
            price: "299.00 ₹",
            participants: "1500",
        },
       
    ];
    return (
        <div className="bg-[#444444] p-6 min-h-screen h-[1500px] mx-10 rounded-2xl">
            <div className="max-w-[1400px] mx-auto pt-md">
               
                <div className="flex  lg:flex-row gap-4 justify-between mb-1.5">
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Events"
                            className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <NavLink
                            to="/dashboard/create-event/"
                            className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition"
                        >
                            Add event
                        </NavLink>
                        {["Category", "Type", "Custom", "Filter"].map((filter) => (
                            <button
                                key={filter}
                                className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition"
                            >
                                {filter}
                                <ChevronDown size={16} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-8">
                    <NavLink
                        to="/dashboard/participated"
                        className={({ isActive }) =>
                            `px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg ${
                                isActive ? "border-r-2 border-b-2" : "bg-gray-800 hover:bg-gray-700"
                            }`
                        }
                    >
                        Participated
                    </NavLink>
                    <NavLink
                        to="/dashboard/organized"
                        className={({ isActive }) =>
                            `px-4 py-1.5 bg-[#2A2A2A] text-white rounded-lg ${
                                isActive ? "border-r-2 border-b-2" : "bg-gray-800 hover:bg-gray-700"
                            }`
                        }
                    >
                        Organized
                    </NavLink>
                </div>

                {/* Events Grid */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div> */}
            </div>
        </div>
    );
};

export default Participated_Outlet;
