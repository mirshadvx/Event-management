import React, { useState, useEffect } from "react";
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminApi from "@/services/adminApi";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const Transaction_History = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [eventType, setEventType] = useState("all");
    const [paymentMethod, setPaymentMethod] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                page_size: itemsPerPage,
                search: searchTerm || undefined,
                date_range: dateRange !== "all" ? dateRange : undefined,
                event_type: eventType !== "all" ? eventType : undefined,
                payment_method: paymentMethod !== "all" ? paymentMethod : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            };

            const response = await adminApi.get("transaction-history/", { params });
            const data = response.data.results;
            console.log("****", data);

            setTransactions(data);
            setTotalItems(response.data.count);
        } catch (error) {
            console.error("Error fetching transaction history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [currentPage, itemsPerPage, searchTerm, dateRange, eventType, paymentMethod, startDate, endDate]);

    const resetFilters = () => {
        setSearchTerm("");
        setDateRange("all");
        setEventType("all");
        setPaymentMethod("all");
        setCurrentPage(1);
        setStartDate("");
        setEndDate("");
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History/Payment Gateways</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-10 w-full"
                                placeholder="Search by event name or username..."
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
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                        >
                            <option value="all">All Payment Methods</option>
                            <option value="wallet">Wallet</option>
                            <option value="stripe">Stripe</option>
                        </select>
                        <Button variant="outline" onClick={resetFilters}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button onClick={fetchTransactions}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    <div className="overflow-x-auto pt-6">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4">Booking ID</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Event</th>
                                    <th className="p-4">Payment Method</th>
                                    <th className="p-4">Tickets</th>
                                    <th className="p-4">Subtotal</th>
                                    <th className="p-4">Discount</th>
                                    <th className="p-4">Total</th>
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
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-4 text-center text-gray-500">
                                            No transactions available
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr
                                            key={transaction.booking_id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        >
                                            <td className="p-4">
                                                <HoverCard>
                                                    <HoverCardTrigger>
                                                        {transaction.booking_id.slice(0, 8)}..
                                                    </HoverCardTrigger>
                                                    <HoverCardContent>{transaction.booking_id}</HoverCardContent>
                                                </HoverCard>
                                            </td>
                                            <td className="p-4">{transaction.username}</td>
                                            <td className="p-4">{transaction.event_title}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {transaction.payment_method}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {transaction.ticket_purchases.map((purchase) => (
                                                    <div key={purchase.id}>
                                                        {purchase.quantity} x {purchase.ticket_type} -{" "}
                                                        {purchase.total_price}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="p-4">{parseFloat(transaction.subtotal).toFixed(2)}</td>
                                            <td className="p-4">{parseFloat(transaction.discount).toFixed(2)}</td>
                                            <td className="p-4">{parseFloat(transaction.total).toFixed(2)}</td>
                                            <td className="p-4">{new Date(transaction.created_at).toLocaleDateString()}</td>
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
                                onClick={() => setCurrentPage((prev) => prev - 1)}
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
                                onClick={() => setCurrentPage((prev) => prev + 1)}
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

export default Transaction_History;
