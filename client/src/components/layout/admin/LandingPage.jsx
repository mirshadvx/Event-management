import React, { useState, useEffect } from "react";
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
import api from "@/services/api";
import { HashLoader } from "react-spinners";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const LandingPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (filters = {}) => {
        setLoading(true);
        try {
            const queryParams = {};

            if (filters.dateRange && filters.dateRange !== "all") {
                queryParams.date_range = filters.dateRange;
            }

            if (filters.eventType && filters.eventType !== "all") {
                queryParams.event_type = filters.eventType;
            }

            if (filters.dateRange === "custom") {
                if (filters.startDate) {
                    queryParams.start_date = filters.startDate;
                }
                if (filters.endDate) {
                    queryParams.end_date = filters.endDate;
                }
            }

            const response = await api.get("admin/dashboard-data/", {
                params: queryParams,
            });

            setDashboardData(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        fetchDashboardData({
            dateRange,
            eventType,
            startDate: dateRange === "custom" ? startDate : "",
            endDate: dateRange === "custom" ? endDate : "",
        });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setDateRange("all");
        setEventType("all");
        setStartDate("");
        setEndDate("");
    };

    const generateTicketChartData = () => {
        if (!dashboardData) return null;

        const purchasedData = dashboardData.ticketStats.purchased.map((item) => item.quantity);
        const canceledData = dashboardData.ticketStats.canceled.map((item) => item.quantity);
        const labels = dashboardData.ticketStats.purchased.map((item) => item.ticket_type);

        return {
            labels,
            datasets: [
                {
                    label: "Purchased",
                    data: purchasedData,
                    backgroundColor: colors.secondary,
                },
                {
                    label: "Canceled",
                    data: canceledData,
                    backgroundColor: colors.accent2,
                },
            ],
        };
    };

    const generateUserChartData = () => {
        if (!dashboardData) return null;

        return {
            labels: ["Normal Users", "Organizers", "Requested Organizers"],
            datasets: [
                {
                    label: "User Distribution",
                    data: [
                        dashboardData.userStats.normal,
                        dashboardData.userStats.organizers,
                        dashboardData.userStats.requestedOrganizers,
                    ],
                    backgroundColor: [colors.primary, colors.accent1, colors.accent3],
                    borderColor: [colors.cardBg, colors.cardBg, colors.cardBg],
                    borderWidth: 2,
                },
            ],
        };
    };

    const generateRevenueChartData = () => {
        if (!dashboardData) return null;

        return {
            labels: dashboardData.revenueByCategory.categories,
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: dashboardData.revenueByCategory.revenue,
                    backgroundColor: [colors.primary, colors.secondary, colors.accent1, colors.accent2, colors.accent3],
                    borderRadius: 6,
                },
            ],
        };
    };

    const generateEventChartData = () => {
        if (!dashboardData) return null;

        return {
            labels: ["Created", "Ongoing", "Completed"],
            datasets: [
                {
                    label: "Events",
                    data: [
                        dashboardData.eventStats.created,
                        dashboardData.eventStats.ongoing,
                        dashboardData.eventStats.completed,
                    ],
                    backgroundColor: [colors.primary, colors.accent1, colors.secondary],
                    borderRadius: 6,
                },
            ],
        };
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

    if (loading) {
        return (
            <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <HashLoader color="#54c955" size={57} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
                    <p className="mb-4">{error}</p>
                    <Button onClick={() => fetchDashboardData()}>Try Again</Button>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return null;
    }

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
                            <p className="text-2xl font-bold">{dashboardData.totalEvents}</p>
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
                            <p className="text-2xl font-bold">{dashboardData.totalUsers}</p>
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
                            <p className="text-2xl font-bold">{dashboardData.totalTickets}</p>
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
                            <p className="text-2xl font-bold">{dashboardData.totalTicketsCancelled}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow flex items-center md:col-span-2">
                        <div className="rounded-full bg-pink-100 bg-opacity-10 p-3 mr-4">
                            <TbCurrencyRupee className="text-pink-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold">₹{dashboardData.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>

                    <Button
                        className="col-span-1 w-full h-full bg-gray-800"
                        variant="outline"
                        onClick={() => setShowFilters(true)}
                    >
                        <div className="flex items-center justify-center gap-3 w-full h-full">
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
                                    {dashboardData.revenueByCategory.categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
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
                            <div className="flex justify-between w-full">
                                <Button
                                    variant="outline"
                                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                                    onClick={resetFilters}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Reset Filters
                                </Button>
                                <div className="space-x-2">
                                    <Button
                                        variant="ghost"
                                        className="bg-gray-700 text-gray-200 hover:bg-gray-600"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-black hover:bg-amber-400 bg-amber-50"
                                        onClick={applyFilters}
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid md:grid-cols-6 gap-3">
                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">Tickets Overview</h2>
                        <div className="h-64">
                            <Bar data={generateTicketChartData()} options={ticketOptions} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-3 rounded-md">
                                <p className="text-sm text-gray-400">Total Purchased</p>
                                <p className="text-xl font-bold">{dashboardData.totalTickets}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-md">
                                <p className="text-sm text-gray-400">Total Canceled</p>
                                <p className="text-xl font-bold text-pink-500">{dashboardData.totalTicketsCancelled}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-3">
                        <h2 className="text-lg font-semibold mb-4">Events Overview</h2>
                        <div className="h-64">
                            <Bar data={generateEventChartData()} options={chartOptions} />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="bg-gray-900 p-3 rounded-md text-center">
                                <p className="text-xs text-gray-400">Created</p>
                                <p className="text-lg font-bold">{dashboardData.eventStats.created}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-md text-center">
                                <p className="text-xs text-gray-400">Ongoing</p>
                                <p className="text-lg font-bold">{dashboardData.eventStats.ongoing}</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-md text-center">
                                <p className="text-xs text-gray-400">Completed</p>
                                <p className="text-lg font-bold">{dashboardData.eventStats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-2">
                        <h2 className="text-lg font-semibold mb-4">Users Analytics</h2>
                        <div className="h-64">
                            <Pie data={generateUserChartData()} options={pieOptions} />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-4">
                        <h2 className="text-lg font-semibold mb-4">Revenue by Event Categories</h2>
                        <div className="h-64">
                            <Bar data={generateRevenueChartData()} options={chartOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
