import React, { useState, useEffect } from "react";
import {
    Search,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminApi from "@/services/adminApi";

const Revenue_Overview = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [revenueData, setRevenueData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchRevenueSummary = async () => {
        try {
            const params = {
                search: searchTerm || undefined,
                date_range: dateRange !== "all" ? dateRange : undefined,
                event_type: eventType !== "all" ? eventType : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            };

            const response = await adminApi.get('revenue-summary/', { params });
            setTotalRevenue(parseFloat(response.data.total_revenue));
            setTodayRevenue(parseFloat(response.data.today_revenue));
            setMonthlyRevenue(parseFloat(response.data.monthly_revenue));
        } catch (error) {
            console.error('Error fetching revenue summary:', error);
        }
    };

    const fetchRevenueData = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                page_size: itemsPerPage,
                search: searchTerm || undefined,
                date_range: dateRange !== "all" ? dateRange : undefined,
                event_type: eventType !== "all" ? eventType : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            };

            const response = await adminApi.get('revenue-distributions/', { params });
            const data = response.data.results || response.data;
            
            setRevenueData(data);
            setTotalItems(response.data.count || data.length);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenueSummary();
        fetchRevenueData();
    }, [currentPage, itemsPerPage, searchTerm, dateRange, eventType, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm("");
        setDateRange("all");
        setEventType("all");
        setCurrentPage(1);
        setStartDate("");
        setEndDate("");
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Today's Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Monthly Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monthlyRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        className="pl-10 w-full"
                        placeholder="Search by event name or organizer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom</option>
                </select>
                {dateRange === "custom" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Start:</label>
                            <Input
                                type="date"
                                className="w-[150px] bg-white dark:bg-gray-700"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 dark:text-gray-300">End:</label>
                            <Input
                                type="date"
                                className="w-[150px] bg-white dark:bg-gray-700"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}
                <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                >
                    <option value="all">All Event Types</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Concert">Concert</option>
                    <option value="Festival">Festival</option>
                </select>
                <Button variant="outline" onClick={resetFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
                <Button onClick={() => { fetchRevenueSummary(); fetchRevenueData(); }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </div>

            <Card>
                <CardContent>
                    <div className="overflow-x-auto pt-6">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4">Event</th>
                                    <th className="p-4">Organizer</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Total Revenue</th>
                                    <th className="p-4">Participants</th>
                                    <th className="p-4">Admin %</th>
                                    <th className="p-4">Admin Amount</th>
                                    <th className="p-4">Organizer Amount</th>
                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-4 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : revenueData.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-4 text-center text-gray-500">
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    revenueData.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-4 font-medium">{transaction.event_title}</td>
                                            <td className="p-4">{transaction.organizer}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {transaction.event_type}
                                                </span>
                                            </td>
                                            <td className="p-4">{parseFloat(transaction.total_revenue).toFixed(2)}</td>
                                            <td className="p-4">{transaction.total_participants}</td>
                                            <td className="p-4">{parseFloat(transaction.admin_percentage)}%</td>
                                            <td className="p-4">{parseFloat(transaction.admin_amount).toFixed(2)}</td>
                                            <td className="p-4">{parseFloat(transaction.organizer_amount).toFixed(2)}</td>
                                            <td className="p-4">
                                                {new Date(transaction.distributed_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {(currentPage - 1) * itemsPerPage + 1}–
                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} transactions
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm"
                        >
                            {[5, 10, 20].map((value) => (
                                <option key={value} value={value}>
                                    {value} per page
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Revenue_Overview;  