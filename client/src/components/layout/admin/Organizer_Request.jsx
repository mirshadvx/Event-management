import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { IoDocumentText } from "react-icons/io5";
import { CiBoxList } from "react-icons/ci";
import adminApi from "@/services/adminApi";
import { MdAccountCircle } from "react-icons/md";

const OrganizerRequest = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [error, setError] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const searchInput = useRef();

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get("/organizer/organizer-requests/", {
        params: {
          search: searchTerm || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          page: currentPage,
          page_size: itemsPerPage,
        },
      });

      setRequests(response.data.results || []);
      setTotalItems(response.data.count || 0);
      console.log("users datas **** ", response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to load requests. Please try again.");
      setRequests([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (requestId) => {
    try {
      const response = await adminApi.get(
        `/organizer/organizer-requests/${requestId}/user_details/`
      );
      setSelectedUserDetails(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setSelectedUserDetails(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage, itemsPerPage]);
  const handleSearch = () => {
    fetchRequests();
  };

  useEffect(() => {
    searchInput.current.focus();
  }, [searchTerm]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const toggleRequestSelection = (id) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const toggleAllRequests = () => {
    setSelectedRequests((prev) =>
      prev.length === requests.length ? [] : requests.map((r) => r.id)
    );
  };

  const updateRequestStatus = async (id, status, notes = "") => {
    try {
      const response = await adminApi.patch(
        `/organizer/organizer-requests/${id}/update_status/`,
        {
          status,
          admin_notes: notes,
        }
      );
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? response.data : req))
      );
      setRejectDialogOpen(false);
      setRejectMessage("");
      setRejectRequestId(null);
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status. Please try again.");
    }
  };

  const handleRejectClick = (id) => {
    setRejectRequestId(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (rejectRequestId) {
      updateRequestStatus(rejectRequestId, "rejected", rejectMessage);
    }
  };

  const bulkUpdateStatus = async (status) => {
    try {
      await adminApi.post("/organizer/organizer-requests/bulk_update/", {
        ids: selectedRequests,
        status,
      });
      fetchRequests();
      setSelectedRequests([]);
    } catch (error) {
      console.error("Error bulk updating:", error);
      setError("Failed to bulk update. Please try again.");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
    setSelectedRequests([]);
    setError(null);
  };

  const getStatusStyles = (status) =>
    ({
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    }[status] || "bg-gray-100 text-gray-800");

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      {/* Filters */}
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 w-full"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            ref={searchInput}
          />
        </div>
        <Button variant="outline" onClick={handleSearch} disabled={loading}>
          Search
        </Button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
          disabled={loading}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <Button variant="outline" onClick={resetFilters} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
            {selectedRequests.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkUpdateStatus("approved")}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkUpdateStatus("rejected")}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRequests([])}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={
                    requests.length > 0 &&
                    selectedRequests.length === requests.length
                  }
                  onChange={toggleAllRequests}
                  disabled={loading}
                />
              </th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Requested</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  No requests found
                </td>
              </tr>
            ) : (
              requests.map((data) => (
                <tr
                  key={data.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(data.id)}
                      onChange={() => toggleRequestSelection(data.id)}
                      disabled={loading}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {data.profile_picture ? (
                        <img
                          src={data.profile_picture}
                          alt={data.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) =>
                            (e.target.src = "/default-avatar.png")
                          }
                        />
                      ) : (
                        <MdAccountCircle className="w-10 h-10" />
                      )}

                      <div>
                        <div className="font-medium">
                          {data.username || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {data.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" disabled={loading}>
                          <IoDocumentText />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <textarea
                          className="w-full p-2 border rounded text-sm"
                          defaultValue={data.admin_notes}
                          onBlur={(e) =>
                            updateRequestStatus(
                              data.id,
                              data.status,
                              e.target.value
                            )
                          }
                          disabled={loading}
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusStyles(
                        data.status
                      )}`}
                    >
                      {data.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                    {data.requested_at
                      ? new Date(data.requested_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchUserDetails(data.id)}
                          disabled={loading}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-md">
                        <DialogHeader>
                          <DialogTitle>User Details</DialogTitle>
                        </DialogHeader>
                        {selectedUserDetails && (
                          <div className="space-y-4">
                            <div>
                              <strong>Username:</strong>{" "}
                              {selectedUserDetails.username || "N/A"}
                            </div>
                            <div>
                              <strong>Email:</strong>{" "}
                              {selectedUserDetails.email || "N/A"}
                            </div>
                            <div>
                              <strong>Bio:</strong>{" "}
                              {selectedUserDetails.bio || "None"}
                            </div>
                            <div>
                              <strong>Title:</strong>{" "}
                              {selectedUserDetails.title || "None"}
                            </div>
                            <div>
                              <strong>Phone:</strong>{" "}
                              {selectedUserDetails.phone || "None"}
                            </div>
                            <div>
                              <strong>Location:</strong>{" "}
                              {selectedUserDetails.location || "None"}
                            </div>
                            <div>
                              <strong>Join On: </strong>
                              {selectedUserDetails.created_at
                                ? new Date(
                                    selectedUserDetails.created_at
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                            {selectedUserDetails.profile_picture && (
                              <div>
                                <strong>Profile Picture:</strong>
                                <img
                                  src={selectedUserDetails.profile_picture}
                                  alt="Profile"
                                  className="mt-2 w-24 h-24 object-cover rounded"
                                  onError={(e) =>
                                    (e.target.src = "/default-avatar.png")
                                  }
                                />
                              </div>
                            )}
                            <div>
                              <strong>Social Media:</strong>
                              {selectedUserDetails.social_media_links?.length >
                              0 ? (
                                <ul className="list-disc pl-4">
                                  {selectedUserDetails.social_media_links.map(
                                    (link, index) => (
                                      <li key={index}>
                                        {link.platform}:{" "}
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline"
                                        >
                                          {link.url}
                                        </a>
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                "None"
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {data.status !== "approved" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={loading}>
                            <CiBoxList className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateRequestStatus(data.id, "approved")
                            }
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRejectClick(data.id)}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          Showing {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          requests
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(i + 1)}
              disabled={loading}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || loading}
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
          className="w-[70px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1"
          disabled={loading}
        >
          {[5, 10, 20, 50].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Organizer Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This message
              will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-message">Rejection Reason</Label>
              <Textarea
                id="reject-message"
                placeholder="Enter the reason for rejection..."
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectMessage("");
                setRejectRequestId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectMessage.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerRequest;
