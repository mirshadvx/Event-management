import React, { useState, useEffect } from "react";
import adminApi from "@/services/adminApi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { MoreHorizontal } from "lucide-react";

const RefundManagement = () => {
    const [refundRequests, setRefundRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "all",
    });

    const SAMPLE_REFUND_REQUESTS = [
        {
            id: 1,
            ticket_purchase: {
                id: 101,
                buyer: { username: "john_doe", email: "john@example.com" },
                event: {
                    event_title: "Tech Conference 2025",
                    organizer: { username: "TechEvents" },
                },
                ticket: {
                    ticket_type: "Regular",
                },
                unique_id: "550e8400-e29b-41d4-a716-446655440000",
            },
            amount: 50.0,
            status: "Pending",
            initiated_at: "2025-03-20T10:30:00Z",
            completed_at: null,
        },
        {
            id: 2,
            ticket_purchase: {
                id: 102,
                buyer: { username: "jane_smith", email: "jane@example.com" },
                event: {
                    event_title: "Music Festival 2025",
                    organizer: { username: "MusicPromo" },
                },
                ticket: {
                    ticket_type: "VIP",
                },
                unique_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            },
            amount: 150.0,
            status: "Completed",
            initiated_at: "2025-03-15T14:45:00Z",
            completed_at: "2025-03-16T09:15:00Z",
        },
        {
            id: 3,
            ticket_purchase: {
                id: 103,
                buyer: { username: "event_fan", email: "fan@example.com" },
                event: {
                    event_title: "AI Workshop 2025",
                    organizer: { username: "AIExperts" },
                },
                ticket: {
                    ticket_type: "Gold",
                },
                unique_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            },
            amount: 75.0,
            status: "Reject",
            initiated_at: "2025-03-22T16:20:00Z",
            completed_at: null,
        },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const response = await adminApi.get('/refund-tickets');
                // setRefundRequests(response.data);

                setRefundRequests(SAMPLE_REFUND_REQUESTS);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching refund data:", error);
                toast.error("Failed to load refund requests");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleRefundAction = async (refundId, action) => {
        try {
            // In a real app, you would call an API endpoint:
            // await adminApi.post(`/refund-tickets/${refundId}/${action}`);

            const updatedRequests = refundRequests.map((refund) => {
                if (refund.id === refundId && refund.status === "Pending") {
                    return {
                        ...refund,
                        status: action === "accept" ? "Completed" : "Reject",
                        completed_at: action === "accept" ? new Date().toISOString() : null,
                    };
                }
                return refund;
            });

            setRefundRequests(updatedRequests);
            toast.success(`Refund request ${action === "accept" ? "accepted" : "rejected"} successfully`);
        } catch (error) {
            console.error(`Error ${action}ing refund:`, error);
            toast.error(`Failed to ${action} refund request`);
        }
    };

    const filteredRefunds = refundRequests.filter((refund) => {
        return filters.status === "all" || refund.status === filters.status;
    });

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="container mx-auto py-6">
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Refund Management</CardTitle>
                            <CardDescription>View and manage ticket refund requests</CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter size={16} />
                                <span>Filter by Status:</span>
                            </div>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Reject">Reject</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Ticket Type</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Requested At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        Loading refund requests...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRefunds.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        No refund requests found with current filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRefunds.map((refund) => (
                                    <TableRow key={refund.id}>
                                        <TableCell>
                                            {refund.ticket_purchase.buyer.username}
                                            <br />
                                            <span className="text-sm text-gray-500">
                                                {refund.ticket_purchase.buyer.email}
                                            </span>
                                        </TableCell>
                                        <TableCell>{refund.ticket_purchase.ticket.ticket_type}</TableCell>
                                        <TableCell>
                                            {refund.ticket_purchase.event.event_title}
                                            <br />
                                            <span className="text-sm text-gray-500">
                                                By {refund.ticket_purchase.event.organizer.username}
                                            </span>
                                        </TableCell>
                                        <TableCell>{refund.amount.toFixed(2)}</TableCell>
                                        <TableCell>{formatDateTime(refund.initiated_at)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    refund.status === "Completed"
                                                        ? "success"
                                                        : refund.status === "Reject"
                                                        ? "destructive"
                                                        : "default"
                                                }
                                            >
                                                {refund.status}
                                            </Badge>
                                            {refund.status === "Completed" && (
                                                <div className="text-sm text-gray-500">
                                                    Completed: {formatDateTime(refund.completed_at)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" disabled={loading}>
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-27">
                                                    <DropdownMenuItem
                                                        className="flex items-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-700"
                                                        role="menuitem"
                                                    >
                                                        Accept
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-700"
                                                        role="menuitem"
                                                    >
                                                        Reject
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default RefundManagement;
