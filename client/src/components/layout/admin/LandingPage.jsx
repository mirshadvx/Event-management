import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from "chart.js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Filter, RefreshCw } from "lucide-react";
import { TbCurrencyRupee } from "react-icons/tb";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const LandingPage = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const colors = {
        primary: "#6366F1",
        secondary: "#10B981",
        accent1: "#F59E0B",
        accent2: "#EC4899",
        accent3: "#8B5CF6",
        background: "#111827",
        cardBg: "#1F2937",
        textPrimary: "#F9FAFB",
        textSecondary: "#D1D5DB",
    };

    const eventStats = {
        created: 120,
        ongoing: 45,
        contacted: 30,
    };

    const userStats = {
        normal: 500,
        organizers: 50,
        requestedOrganizers: 10,
    };

    const revenueByCategory = {
        categories: ["Conference", "Workshop", "Seminar", "Concert", "Festival"],
        revenue: [5000, 3000, 2000, 7000, 4000],
    };

    const ticketStats = {
        purchased: [120, 80, 60],
        canceled: [-50, -30, -100],
    };

    const ticketChartData = {
        labels: ["Regular", "VIP", "Gold"],
        datasets: [
            {
                label: "Purchased",
                data: ticketStats.purchased,
                backgroundColor: colors.secondary,
            },
            {
                label: "Canceled",
                data: ticketStats.canceled,
                backgroundColor: colors.accent2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: colors.textSecondary,
                    font: {
                        size: 12,
                    },
                    boxWidth: 12,
                },
            },
            tooltip: {
                backgroundColor: colors.cardBg,
                titleColor: colors.textPrimary,
                bodyColor: colors.textSecondary,
                borderColor: colors.primary,
                borderWidth: 1,
                padding: 10,
                titleFont: {
                    size: 14,
                    weight: "bold",
                },
                bodyFont: {
                    size: 12,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: colors.textSecondary,
                },
            },
            y: {
                grid: {
                    color: "rgba(255, 255, 255, 0.05)",
                    drawBorder: false,
                },
                ticks: {
                    color: colors.textSecondary,
                },
                beginAtZero: true,
            },
        },
    };

    const ticketOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            title: {
                display: true,
                text: "Tickets Overview",
                color: colors.textPrimary,
                font: {
                    size: 16,
                    weight: "bold",
                },
            },
        },
        scales: {
            ...chartOptions.scales,
            y: {
                ...chartOptions.scales.y,
                stacked: true,
            },
        },
    };

    const userChartData = {
        labels: ["Normal Users", "Organizers", "Requested Organizers"],
        datasets: [
            {
                label: "User Distribution",
                data: [userStats.normal, userStats.organizers, userStats.requestedOrganizers],
                backgroundColor: [colors.primary, colors.accent1, colors.accent3],
                borderColor: [colors.cardBg, colors.cardBg, colors.cardBg],
                borderWidth: 2,
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: colors.textSecondary,
                    font: {
                        size: 12,
                    },
                    boxWidth: 12,
                    padding: 16,
                },
            },
            tooltip: {
                backgroundColor: colors.cardBg,
                titleColor: colors.textPrimary,
                bodyColor: colors.textSecondary,
                borderColor: colors.primary,
                borderWidth: 1,
            },
        },
    };

    const revenueChartData = {
        labels: revenueByCategory.categories,
        datasets: [
            {
                label: "Revenue (₹)",
                data: revenueByCategory.revenue,
                backgroundColor: [colors.primary, colors.secondary, colors.accent1, colors.accent2, colors.accent3],
                borderRadius: 6,
            },
        ],
    };

    const eventChartData = {
        labels: ["Created", "Ongoing", "Contacted"],
        datasets: [
            {
                label: "Events",
                data: [eventStats.created, eventStats.ongoing, eventStats.contacted],
                backgroundColor: [colors.primary, colors.accent1, colors.secondary],
                borderRadius: 6,
            },
        ],
    };

    const totalEvents = 100;
    const totalUsers = 100;
    const totalRevenue = 100;
    const totalTickets = 100;
    const totalTicketsCancelled = 100;

    const resetFilters = () => {
        setDateRange("all");
        setEventType("all");
        setStartDate("");
        setEndDate("");
    };

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen">
            <div className="px-4 py-4">
                <div className="grid md:grid-cols-11 mb-4 gap-3">
                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-indigo-100 bg-opacity-10 p-3 mr-4">
                            <svg
                                className="w-6 h-6 text-indigo-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Events</p>
                            <p className="text-2xl font-bold">{totalEvents}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-green-100 bg-opacity-10 p-3 mr-4">
                            <svg
                                className="w-6 h-6 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold">{totalUsers}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-amber-100 bg-opacity-10 p-3 mr-4">
                            <svg
                                className="w-6 h-6 text-amber-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Tickets Buy</p>
                            <p className="text-2xl font-bold">{totalTickets}</p>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-amber-100 bg-opacity-10 p-3 mr-4">
                            <svg
                                className="w-6 h-6 text-amber-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Tickets Cancelled</p>
                            <p className="text-2xl font-bold">{totalTicketsCancelled}</p>
                        </div>
                    </div>

                    {/* <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-pink-100 bg-opacity-10 p-3 mr-4">
                            <svg
                                className="w-6 h-6 text-pink-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div> */}

                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-pink-100 bg-opacity-10 p-3 mr-4">
                            <TbCurrencyRupee className="text-pink-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold">{totalRevenue}</p>
                        </div>
                    </div>

                    <Button
                        className="col-span-1 w-full h-full bg-gray-800"
                        variant="outline"
                        onClick={() => setShowFilters(true)}
                    >
                        <div className="flex items-center justify-center gap-3  w-full h-full">
                            <Filter />
                            <span className="text-xl">Filters</span>
                        </div>
                    </Button>
                </div>

                <Dialog open={showFilters} onOpenChange={setShowFilters}>
                    <DialogContent className="bg-gray-800 text-gray-200 border-gray-700 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg text-left font-medium text-white">Filter Options</DialogTitle>
                        </DialogHeader>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">Date Range</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full border-gray-600 bg-gray-700 rounded-md px-3 py-2 text-gray-200"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="year">This Year</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-300">Event Type</label>
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    className="w-full border-gray-600 bg-gray-700 rounded-md px-3 py-2 text-gray-200"
                                >
                                    <option value="all">All Event Types</option>
                                    <option value="Conference">Conference</option>
                                    <option value="Workshop">Workshop</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="Concert">Concert</option>
                                    <option value="Festival">Festival</option>
                                </select>
                            </div>
                        </div>

                        {dateRange === "custom" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">Start Date</label>
                                    <Input
                                        type="date"
                                        className="w-full bg-gray-700 text-gray-200 border-gray-600"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-300">End Date</label>
                                    <Input
                                        type="date"
                                        className="w-full bg-gray-700 text-gray-200 border-gray-600"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                                    onClick={resetFilters}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reset Filters
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-black hover:bg-gray-700 bg-amber-50"
                                    onClick={() => setShowFilters(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid md:grid-cols-6 gap-3">
                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">Tickets Overview</h2>
                        <div className="h-64">
                            <Bar data={ticketChartData} options={ticketOptions} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-3 rounded-md">
                                <p className="text-sm text-gray-400">Total Purchased</p>
                                <p className="text-xl font-bold">{ticketStats.purchased.reduce((a, b) => a + b, 0)}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-md">
                                <p className="text-sm text-gray-400">Total Canceled</p>
                                <p className="text-xl font-bold text-pink-500">
                                    {ticketStats.canceled}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">Events Overview</h2>
                        <div className="h-64">
                            <Bar data={eventChartData} options={chartOptions} />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="bg-gray-900 p-2 rounded-md text-center">
                                <p className="text-xs text-gray-400">Created</p>
                                <p className="text-lg font-bold">{eventStats.created}</p>
                            </div>
                            <div className="bg-gray-900 p-2 rounded-md text-center">
                                <p className="text-xs text-gray-400">Ongoing</p>
                                <p className="text-lg font-bold">{eventStats.ongoing}</p>
                            </div>
                            <div className="bg-gray-900 p-2 rounded-md text-center">
                                <p className="text-xs text-gray-400">Contacted</p>
                                <p className="text-lg font-bold">{eventStats.contacted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">Users Analytics</h2>
                        <div className="h-64">
                            <Pie data={userChartData} options={pieOptions} />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-4">
                        <h2 className="text-lg font-semibold mb-4">Revenue by Event Categories</h2>
                        <div className="h-64">
                            <Bar data={revenueChartData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
