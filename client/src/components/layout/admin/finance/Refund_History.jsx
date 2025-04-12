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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import adminApi from "@/services/adminApi";

const Refund_History = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [refundData, setRefundData] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const fetchRefundData = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                page_size: itemsPerPage,
                search: searchTerm || undefined,
                date_range: dateRange !== "all" && dateRange !== "custom" ? dateRange : undefined, // Updated to handle custom
                event_type: eventType !== "all" ? eventType : undefined,
                start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
                end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
            };

            const response = await adminApi.get('refund-history/', { params });
            setRefundData(response.data.results || []);
            setTotalItems(response.data.count || 0);
        } catch (error) {
            console.error('Error fetching refund data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundData();
    }, [currentPage, itemsPerPage, searchTerm, dateRange, eventType, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm("");
        setDateRange("all");
        setEventType("all");
        setCurrentPage(1);
        setStartDate(null);
        setEndDate(null);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Card>
                <CardHeader>
                    <CardTitle>Refund History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-10"
                                placeholder="Search by username or event title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            
                        </div>

                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Select date range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>

                        {dateRange === "custom" && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600 dark:text-gray-300">Start:</label>
                                    <Input
                                        type="date"
                                        className="w-[150px]"
                                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600 dark:text-gray-300">End:</label>
                                    <Input
                                        type="date"
                                        className="w-[150px]"
                                        value={endDate ? endDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                                    />
                                </div>
                            </div>
                        )}

                        <Select value={eventType} onValueChange={setEventType}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Event Types</SelectItem>
                                <SelectItem value="Conference">Conference</SelectItem>
                                <SelectItem value="Workshop">Workshop</SelectItem>
                                <SelectItem value="Seminar">Seminar</SelectItem>
                                <SelectItem value="Concert">Concert</SelectItem>
                                <SelectItem value="Festival">Festival</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={resetFilters}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button onClick={fetchRefundData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4">Transaction ID</th>
                                    <th className="p-4">Username</th>
                                    <th className="p-4">Event</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Tickets</th>
                                    <th className="p-4">Refund Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : refundData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-gray-500">
                                            No refund history available
                                        </td>
                                    </tr>
                                ) : (
                                    refundData.map((refund) => (
                                        <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-4">{refund.transaction_id}</td>
                                            <td className="p-4">{refund.user.username}</td>
                                            <td className="p-4">{refund.event_title}</td>
                                            <td className="p-4">{parseFloat(refund.amount).toFixed(2)}</td>
                                            <td className="p-4">
                                                {refund.ticket_details.map((ticket) => (
                                                    <div key={ticket.id}>
                                                        {ticket.quantity} x {ticket.ticket_type} ({ticket.amount})
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="p-4">
                                                {new Date(refund.created_at).toLocaleString()}
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
                            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} refunds
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
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[5, 10, 20].map((value) => (
                                    <SelectItem key={value} value={value.toString()}>
                                        {value} per page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Refund_History;