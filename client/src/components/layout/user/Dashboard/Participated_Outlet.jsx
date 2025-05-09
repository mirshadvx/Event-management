import React, { useState } from "react";
import { Search, Calendar, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

const Participated_Outlet = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [timeFilter, setTimeFilter] = useState("All Time");
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);

    const categories = ["All Categories", "Tech", "Music", "Sports", "Art", "Business"];
    const timeFilters = ["All Time", "Today", "Week", "Month", "Custom"];

    const handleCustomDateReset = () => {
        setCustomStartDate(null);
        setCustomEndDate(null);
        setTimeFilter("All Time");
    };

    return (
        <div className="bg-[#444444] p-1 sm:p-3 min-h-screen mx-2 sm:mx-10 rounded-2xl mt-2">
            <div className="max-w-[1400px] mx-auto">
                {/* Search and Filters */}
                <div className="flex sm:flex-row gap-4 justify-between mb-2">
                    {/* Search Input */}
                    <div className="relative flex-grow max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search Events"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border-none text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 rounded-lg"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        {/* Add Event Button */}
                        <NavLink to="/dashboard/create-event/">
                            <Button className="bg-[#2b2b2b] text-white">Create Event</Button>
                        </NavLink>

                        {/* Category Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                >
                                    {category}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333]">
                                {categories.map((cat) => (
                                    <DropdownMenuItem
                                        key={cat}
                                        onSelect={() => setCategory(cat)}
                                        className="hover:bg-[#333333] focus:bg-[#333333]"
                                    >
                                        {cat}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Time Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                >
                                    {timeFilter}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#2A2A2A] text-white border-[#333333]">
                                {timeFilters.map((time) => (
                                    <DropdownMenuItem
                                        key={time}
                                        onSelect={() => setTimeFilter(time)}
                                        className="hover:bg-[#333333] focus:bg-[#333333]"
                                    >
                                        {time}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {timeFilter === "Custom" && (
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                        >
                                            <Calendar size={16} />
                                            {customStartDate ? format(customStartDate, "PPP") : "Start Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#2A2A2A] border-[#333333]">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customStartDate}
                                            onSelect={setCustomStartDate}
                                            className="rounded-md border-[#333333] bg-[#2A2A2A] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2A2A2A] text-white border-none hover:bg-[#333333] flex items-center gap-2"
                                        >
                                            <Calendar size={16} />
                                            {customEndDate ? format(customEndDate, "PPP") : "End Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#2A2A2A] border-[#333333]">
                                        <CalendarComponent
                                            mode="single"
                                            selected={customEndDate}
                                            onSelect={setCustomEndDate}
                                            className="rounded-md border-[#333333] bg-[#2A2A2A] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <Button
                                    variant="ghost"
                                    onClick={handleCustomDateReset}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Reset
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* <div className="flex gap-3 mb-8">
          <NavLink
            to="/dashboard/participated"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-white ${
                isActive
                  ? "bg-blue-600 border-r-2 border-b-2 border-blue-800"
                  : "bg-[#2A2A2A] hover:bg-[#333333]"
              }`
            }
          >
            Participated
          </NavLink>
          <NavLink
            to="/dashboard/organized"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-white ${
                isActive
                  ? "bg-blue-600 border-r-2 border-b-2 border-blue-800"
                  : "bg-[#2A2A2A] hover:bg-[#333333]"
              }`
            }
          >
            Organized
          </NavLink>
        </div> */}
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

                {/* Events Grid Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Replace with actual EventCard components */}
                    <div className="bg-[#2A2A2A] p-4 rounded-lg text-white">Event Card Placeholder</div>
                    <div className="bg-[#2A2A2A] p-4 rounded-lg text-white">Event Card Placeholder</div>
                    <div className="bg-[#2A2A2A] p Dedent p-4 rounded-lg text-white">Event Card Placeholder</div>
                    <div className="bg-[#2A2A2A] p-4 rounded-lg text-white">Event Card Placeholder</div>
                </div>
            </div>
        </div>
    );
};

export default Participated_Outlet;
