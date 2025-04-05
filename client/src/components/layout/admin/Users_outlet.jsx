import React, { useState, useEffect, useCallback } from "react";
import {
    Search,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import adminApi from "@/services/adminApi";

const UsersOutlet = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminApi.get("/users/", {
                params: {
                    search: searchTerm || undefined,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    role: roleFilter === "all" ? undefined : roleFilter,
                    page: currentPage,
                    page_size: itemsPerPage,
                },
            });
            setUsers(response.data.results || []);
            setTotalItems(response.data.count || 0);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch users");
            setUsers([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, roleFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleAllUsers = () => {
        setSelectedUsers((prev) =>
            prev.length === users.length && users.length > 0
                ? []
                : users.map((user) => user.id)
        );
    };

    const toggleUserStatus = async (userId) => {
        setError(null);
        try {
            const user = users.find((u) => u.id === userId);
            const newStatus = !user.is_active;
            const response = await adminApi.patch(`users/${userId}/update_status/`, {
                is_active: newStatus,
            });
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? response.data : u))
            );
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update user status");
        }
    };

    const bulkToggleStatus = async (isActive) => {
        if (!selectedUsers.length) return;
        setError(null);
        try {
            await adminApi.post("users/bulk_update/", {
                ids: selectedUsers,
                is_active: isActive,
            });
            await fetchUsers();
            setSelectedUsers([]);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to bulk update users");
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setRoleFilter("all");
        setCurrentPage(1);
        setSelectedUsers([]);
        setError(null);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const getStatusStyles = (isActive) =>
        isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        className="pl-10 w-full"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && fetchUsers()}
                        disabled={loading}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                    disabled={loading}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                    disabled={loading}
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
                <Button variant="outline" onClick={resetFilters} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Selected Users Actions */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkToggleStatus(true)}
                        disabled={loading}
                    >
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Activate
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkToggleStatus(false)}
                        disabled={loading}
                    >
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Block
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
                        Clear
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === users.length && users.length > 0}
                                    onChange={toggleAllUsers}
                                    disabled={loading}
                                />
                            </th>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            disabled={loading}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.profile_picture || "/default-avatar.png"}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => (e.target.src = "/default-avatar.png")}
                                            />
                                            <div>
                                                <div className="font-medium">{user.username}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.is_staff
                                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                            }`}
                                        >
                                            {user.is_staff ? "Admin" : "User"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                                user.is_active
                                            )}`}
                                        >
                                            {user.is_active ? "Active" : "Blocked"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(user.date_joined).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" disabled={loading}>
                                                    <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => toggleUserStatus(user.id)}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                            Block
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                            Activate
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} users
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={loading}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
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
                    className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm"
                    disabled={loading}
                >
                    {[10, 20, 50].map((value) => (
                        <option key={value} value={value}>
                            {value} per page
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default UsersOutlet;

// import React, { useState, useEffect, useCallback } from "react";
// import {
//     Search,
//     MoreHorizontal,
//     CheckCircle,
//     XCircle,
//     RefreshCw,
//     ChevronLeft,
//     ChevronRight,
//     Plus,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
// import adminApi from "@/services/adminApi";

// const UsersOutlet = () => {
//     const [searchTerm, setSearchTerm] = useState("");
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [roleFilter, setRoleFilter] = useState("all");
//     const [selectedUsers, setSelectedUsers] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(5);
//     const [totalItems, setTotalItems] = useState(0);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);

//     const fetchUsers = useCallback(async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const response = await adminApi.get("users/", {
//                 params: {
//                     search: searchTerm || undefined,
//                     status: statusFilter === "all" ? undefined : statusFilter,
//                     role: roleFilter === "all" ? undefined : roleFilter,
//                     page: currentPage,
//                     page_size: itemsPerPage,
//                 },
//             });
//             setUsers(response.data.results || []);
//             setTotalItems(response.data.count || 0);
//         } catch (error) {
//             console.error("Error fetching users:", error);
//             setError("Failed to load users. Please try again.");
//             setUsers([]);
//             setTotalItems(0);
//         } finally {
//             setLoading(false);
//         }
//     }, [searchTerm, statusFilter, roleFilter, currentPage, itemsPerPage]);

//     useEffect(() => {
//         fetchUsers();
//     }, [fetchUsers]);

//     const toggleUserSelection = (userId) => {
//         setSelectedUsers((prev) => 
//             prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
//         );
//     };

//     const toggleAllUsers = () => {
//         setSelectedUsers((prev) => 
//             prev.length === users.length && users.length > 0 ? [] : users.map((user) => user.id)
//         );
//     };

//     const toggleUserStatus = async (userId) => {
//         try {
//             const user = users.find(u => u.id === userId);
//             const newStatus = !user.is_active;
//             const response = await adminApi.patch(`users/${userId}/update_status/`, {
//                 is_active: newStatus,
//             });
//             setUsers((prev) => 
//                 prev.map((u) => (u.id === userId ? response.data : u))
//             );
//         } catch (error) {
//             console.error("Error updating user status:", error);
//             setError("Failed to update user status. Please try again.");
//         }
//     };

//     const bulkToggleStatus = async (isActive) => {
//         try {
//             await adminApi.post("users/bulk_update/", {
//                 ids: selectedUsers,
//                 is_active: isActive,
//             });
//             fetchUsers();
//             setSelectedUsers([]);
//         } catch (error) {
//             console.error("Error bulk updating users:", error);
//             setError("Failed to bulk update users. Please try again.");
//         }
//     };

//     const resetFilters = () => {
//         setSearchTerm("");
//         setStatusFilter("all");
//         setRoleFilter("all");
//         setCurrentPage(1);
//         setSelectedUsers([]);
//         setError(null);
//     };

//     const handleSearch = () => {
//         setCurrentPage(1);
//         fetchUsers();
//     };

//     const getStatusStyles = (isActive) => {
//         return isActive 
//             ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//             : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
//     };

//     const totalPages = Math.ceil(totalItems / itemsPerPage);

//     return (
//         <div className="space-y-6 pt-7 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//             {/* Filters */}
//             <div className="flex items-center gap-5 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
//                 <div className="relative w-1/4 min-w-[200px]">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                         className="pl-10 w-full"
//                         placeholder="Search users..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         disabled={loading}
//                     />
//                 </div>
//                 <Button variant="outline" onClick={handleSearch} disabled={loading}>
//                     Search
//                 </Button>
//                 <select
//                     value={statusFilter}
//                     onChange={(e) => setStatusFilter(e.target.value)}
//                     className="w-1 min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//                     disabled={loading}
//                 >
//                     <option value="all">All Status</option>
//                     <option value="active">Active</option>
//                     <option value="blocked">Blocked</option>
//                 </select>
//                 <select
//                     value={roleFilter}
//                     onChange={(e) => setRoleFilter(e.target.value)}
//                     className="w-1 min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//                     disabled={loading}
//                 >
//                     <option value="all">All Roles</option>
//                     <option value="admin">Admin</option>
//                     <option value="user">User</option>
//                 </select>
//                 <Button variant="outline" onClick={resetFilters} disabled={loading}>
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Reset
//                 </Button>
//             </div>

//             {/* Error Message */}
//             {error && (
//                 <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
//                     {error}
//                 </div>
//             )}

//             {/* Selected Users Actions */}
//             {selectedUsers.length > 0 && (
//                 <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//                     <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
//                         {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
//                     </span>
//                     <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(true)} disabled={loading}>
//                         <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
//                         Activate
//                     </Button>
//                     <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(false)} disabled={loading}>
//                         <XCircle className="h-4 w-4 mr-2 text-red-500" />
//                         Block
//                     </Button>
//                     <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])} disabled={loading}>
//                         Clear
//                     </Button>
//                 </div>
//             )}

//             {/* Table */}
//             <div className="overflow-x-auto">
//                 <table className="w-full">
//                     <thead className="bg-gray-50 dark:bg-gray-700">
//                         <tr>
//                             <th className="p-4">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedUsers.length === users.length && users.length > 0}
//                                     onChange={toggleAllUsers}
//                                     disabled={loading}
//                                 />
//                             </th>
//                             <th className="p-4 text-left">User</th>
//                             <th className="p-4 text-left">Role</th>
//                             <th className="p-4 text-left">Status</th>
//                             <th className="p-4 text-left">Joined</th>
//                             <th className="p-4 text-right">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y dark:divide-gray-700">
//                         {loading ? (
//                             <tr>
//                                 <td colSpan={6} className="p-4 text-center">
//                                     Loading...
//                                 </td>
//                             </tr>
//                         ) : users.length === 0 ? (
//                             <tr>
//                                 <td colSpan={6} className="p-4 text-center">
//                                     No users found
//                                 </td>
//                             </tr>
//                         ) : (
//                             users.map((user) => (
//                                 <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
//                                     <td className="p-4">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedUsers.includes(user.id)}
//                                             onChange={() => toggleUserSelection(user.id)}
//                                             disabled={loading}
//                                         />
//                                     </td>
//                                     <td className="p-4">
//                                         <div className="flex items-center gap-3">
//                                             <img 
//                                                 src={user.profile_picture || "/default-avatar.png"} 
//                                                 alt={user.username} 
//                                                 className="w-8 h-8 rounded-full"
//                                                 onError={(e) => e.target.src = "/default-avatar.png"}
//                                             />
//                                             <div>
//                                                 <div className="font-medium">{user.username}</div>
//                                                 <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
//                                             </div>
//                                         </div>
//                                     </td>
//                                     <td className="p-4">
//                                         <span
//                                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                                 user.is_staff
//                                                     ? "bg-purple-100 text-purple-800"
//                                                     : "bg-gray-100 text-gray-800"
//                                             }`}
//                                         >
//                                             {user.is_staff ? "Admin" : "User"}
//                                         </span>
//                                     </td>
//                                     <td className="p-4">
//                                         <span
//                                             className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(user.is_active)}`}
//                                         >
//                                             {user.is_active ? "Active" : "Blocked"}
//                                         </span>
//                                     </td>
//                                     <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
//                                         {new Date(user.date_joined).toLocaleDateString()}
//                                     </td>
//                                     <td className="p-4 text-right">
//                                         <DropdownMenu>
//                                             <DropdownMenuTrigger asChild>
//                                                 <Button variant="ghost" size="sm" disabled={loading}>
//                                                     <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
//                                                 </Button>
//                                             </DropdownMenuTrigger>
//                                             <DropdownMenuContent className="w-40" align="end">
//                                                 <DropdownMenuItem
//                                                     onClick={() => toggleUserStatus(user.id)}
//                                                     className="flex items-center gap-2 cursor-pointer"
//                                                 >
//                                                     {user.is_active ? (
//                                                         <>
//                                                             <XCircle className="h-4 w-4 text-red-500" />
//                                                             <span>Block</span>
//                                                         </>
//                                                     ) : (
//                                                         <>
//                                                             <CheckCircle className="h-4 w-4 text-green-500" />
//                                                             <span>Activate</span>
//                                                         </>
//                                                     )}
//                                                 </DropdownMenuItem>
//                                             </DropdownMenuContent>
//                                         </DropdownMenu>
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                 <div className="text-sm text-gray-500 dark:text-gray-400">
//                     Showing {(currentPage - 1) * itemsPerPage + 1}–
//                     {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} users
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         disabled={currentPage === 1 || loading}
//                         onClick={() => setCurrentPage((prev) => prev - 1)}
//                     >
//                         <ChevronLeft className="h-4 w-4" />
//                     </Button>
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
//                         <Button
//                             key={i}
//                             variant={currentPage === i + 1 ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => setCurrentPage(i + 1)}
//                             disabled={loading}
//                         >
//                             {i + 1}
//                         </Button>
//                     ))}
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         disabled={currentPage === totalPages || loading}
//                         onClick={() => setCurrentPage((prev) => prev + 1)}
//                     >
//                         <ChevronRight className="h-4 w-4" />
//                     </Button>
//                 </div>
//                 <select
//                     value={itemsPerPage}
//                     onChange={(e) => {
//                         setItemsPerPage(Number(e.target.value));
//                         setCurrentPage(1);
//                     }}
//                     className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1"
//                     disabled={loading}
//                 >
//                     {[5, 10, 20, 50].map((value) => (
//                         <option key={value} value={value}>
//                             {value}
//                         </option>
//                     ))}
//                 </select>
//             </div>
//         </div>
//     );
// };

// export default UsersOutlet;



// import React, { useState, useMemo } from "react";
// import {
//     Search,
//     MoreHorizontal,
//     CheckCircle,
//     XCircle,
//     Download,
//     RefreshCw,
//     ChevronDown,
//     ChevronLeft,
//     ChevronRight,
//     Plus,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

// const sampleUsers = [
//     {
//         id: 1,
//         name: "John Doe",
//         email: "john.doe@example.com",
//         role: "Admin",
//         status: "Active",
//         joined: "Jan 10, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 2,
//         name: "Sarah Wilson",
//         email: "sarah@example.com",
//         role: "Editor",
//         status: "Active",
//         joined: "Feb 15, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 3,
//         name: "Jane Doe",
//         email: "jane.doe@example.com",
//         role: "Admin",
//         status: "Blocked",
//         joined: "Mar 22, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 4,
//         name: "Michael Chen",
//         email: "michael@example.com",
//         role: "User",
//         status: "Active",
//         joined: "Apr 5, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 5,
//         name: "Alice Smith",
//         email: "alice@example.com",
//         role: "Admin",
//         status: "Inactive",
//         joined: "May 18, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 6,
//         name: "Bob Jones",
//         email: "bob@example.com",
//         role: "Editor",
//         status: "Active",
//         joined: "Jun 30, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 7,
//         name: "Charlie Brown",
//         email: "charlie@example.com",
//         role: "User",
//         status: "Blocked",
//         joined: "Jul 12, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 8,
//         name: "David Lee",
//         email: "david@example.com",
//         role: "Admin",
//         status: "Active",
//         joined: "Aug 24, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 9,
//         name: "Emma Taylor",
//         email: "emma@example.com",
//         role: "Editor",
//         status: "Active",
//         joined: "Sep 7, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 10,
//         name: "Frank Miller",
//         email: "frank@example.com",
//         role: "User",
//         status: "Inactive",
//         joined: "Oct 19, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 11,
//         name: "Grace Kim",
//         email: "grace@example.com",
//         role: "Admin",
//         status: "Active",
//         joined: "Nov 3, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 12,
//         name: "Henry Park",
//         email: "henry@example.com",
//         role: "Editor",
//         status: "Blocked",
//         joined: "Dec 15, 2023",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 13,
//         name: "Ivy Johnson",
//         email: "ivy@example.com",
//         role: "User",
//         status: "Active",
//         joined: "Jan 27, 2024",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 14,
//         name: "Jack Robinson",
//         email: "jack@example.com",
//         role: "Admin",
//         status: "Active",
//         joined: "Feb 8, 2024",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 15,
//         name: "Kate Wilson",
//         email: "kate@example.com",
//         role: "Editor",
//         status: "Inactive",
//         joined: "Mar 20, 2024",
//         avatar: "/api/placeholder/32/32",
//     },
//     {
//         id: 16,
//         name: "Leo Martin",
//         email: "leo@example.com",
//         role: "User",
//         status: "Active",
//         joined: "Apr 2, 2024",
//         avatar: "/api/placeholder/32/32",
//     },
// ];

// const UsersOutlet = () => {
//     const [searchTerm, setSearchTerm] = useState("");
//     const [statusFilter, setStatusFilter] = useState("all");
//     const [roleFilter, setRoleFilter] = useState("all");
//     const [selectedUsers, setSelectedUsers] = useState([]);
//     const [users, setUsers] = useState(sampleUsers);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(5);

//     const filteredUsers = useMemo(() => {
//         return users.filter((user) => {
//             const matchesSearch =
//                 user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 user.email.toLowerCase().includes(searchTerm.toLowerCase());
//             const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter;
//             const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
//             return matchesSearch && matchesStatus && matchesRole;
//         });
//     }, [users, searchTerm, statusFilter, roleFilter]);

//     const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
//     const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

//     const toggleUserSelection = (userId) => {
//         setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
//     };

//     const toggleAllUsers = () => {
//         setSelectedUsers(selectedUsers.length === currentUsers.length ? [] : currentUsers.map((user) => user.id));
//     };

//     const toggleUserStatus = (userId) => {
//         setUsers((prev) =>
//             prev.map((user) =>
//                 user.id === userId ? { ...user, status: user.status === "Active" ? "Blocked" : "Active" } : user
//             )
//         );
//     };

//     const bulkToggleStatus = (status) => {
//         setUsers((prev) => prev.map((user) => (selectedUsers.includes(user.id) ? { ...user, status } : user)));
//         setSelectedUsers([]);
//     };

//     const resetFilters = () => {
//         setSearchTerm("");
//         setStatusFilter("all");
//         setRoleFilter("all");
//         setCurrentPage(1);
//     };

//     const getStatusStyles = (status) => {
//         const styles = {
//             Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
//             Blocked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
//             Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
//         };
//         return styles[status] || styles.Inactive;
//     };

//     return (
//         <div className="space-y-6 pt-7 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 {/* <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//           User Management
//         </h2> */}
//                 {/* <Button className="bg-purple-600 hover:bg-purple-700">
//           <Plus className="h-4 w-4 mr-2" />
//           Add User
//         </Button> */}
//             </div>

//             {/* Filters */}
//             <div className="flex items-center gap-5 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
//                 <div className="relative w-1/4 min-w-[200px]">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                     <Input
//                         className="pl-10 w-full"
//                         placeholder="Search users..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>
//                 <select
//                     value={statusFilter}
//                     onChange={(e) => setStatusFilter(e.target.value)}
//                     className="w-1 min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                 >
//                     <option value="all">All Status</option>
//                     <option value="active">Active</option>
//                     <option value="blocked">Blocked</option>
//                     <option value="inactive">Inactive</option>
//                 </select>
//                 <select
//                     value={roleFilter}
//                     onChange={(e) => setRoleFilter(e.target.value)}
//                     className="w-1 min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                 >
//                     <option value="all">All Roles</option>
//                     <option value="admin">Admin</option>
//                     <option value="editor">Editor</option>
//                     <option value="user">User</option>
//                 </select>
//                 <Button variant="outline" onClick={resetFilters} className="w-1 min-w-[100px]">
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Reset
//                 </Button>
//             </div>
//             {/* Selected Users Actions */}
//             {selectedUsers.length > 0 && (
//                 <div className="flex flex-wrap gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//                     <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
//                         {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
//                     </span>
//                     <Button variant="outline" size="sm" onClick={() => bulkToggleStatus("Active")}>
//                         <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
//                         Activate
//                     </Button>
//                     <Button variant="outline" size="sm" onClick={() => bulkToggleStatus("Blocked")}>
//                         <XCircle className="h-4 w-4 mr-2 text-red-500" />
//                         Block
//                     </Button>
//                     <Button variant="outline" size="sm" onClick={() => setSelectedUsers([])}>
//                         Clear
//                     </Button>
//                 </div>
//             )}

//             {/* Table */}
//             <div className="overflow-x-auto">
//                 <table className="w-full">
//                     <thead className="bg-gray-50 dark:bg-gray-700">
//                         <tr>
//                             <th className="p-4">
//                                 <input
//                                     type="checkbox"
//                                     checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
//                                     onChange={toggleAllUsers}
//                                 />
//                             </th>
//                             <th className="p-4 text-left">User</th>
//                             <th className="p-4 text-left">Role</th>
//                             <th className="p-4 text-left">Status</th>
//                             <th className="p-4 text-left">Joined</th>
//                             <th className="p-4 text-right">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y dark:divide-gray-700">
//                         {currentUsers.map((user) => (
//                             <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
//                                 <td className="p-4">
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedUsers.includes(user.id)}
//                                         onChange={() => toggleUserSelection(user.id)}
//                                     />
//                                 </td>
//                                 <td className="p-4">
//                                     <div className="flex items-center gap-3">
//                                         <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
//                                         <div>
//                                             <div className="font-medium">{user.name}</div>
//                                             <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
//                                         </div>
//                                     </div>
//                                 </td>
//                                 <td className="p-4">
//                                     <span
//                                         className={`px-2 py-1 rounded-full text-xs font-medium ${
//                                             user.role === "Admin"
//                                                 ? "bg-purple-100 text-purple-800"
//                                                 : user.role === "Editor"
//                                                 ? "bg-blue-100 text-blue-800"
//                                                 : "bg-gray-100 text-gray-800"
//                                         }`}
//                                     >
//                                         {user.role}
//                                     </span>
//                                 </td>
//                                 <td className="p-4">
//                                     <span
//                                         className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
//                                             user.status
//                                         )}`}
//                                     >
//                                         {user.status}
//                                     </span>
//                                 </td>
//                                 <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{user.joined}</td>
//                                 {/* <td className="p-4 text-right">
//                                     <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(user.id)}>
//                                         {user.status === "Active" ? (
//                                             <XCircle className="h-4 w-4 text-red-500" />
//                                         ) : (
//                                             <CheckCircle className="h-4 w-4 text-green-500" />
//                                         )}
//                                     </Button>
//                                 </td> */}
//                                 <td className="p-4 text-right">
//                                     <DropdownMenu>
//                                         <DropdownMenuTrigger asChild>
//                                             <Button variant="ghost" size="sm">
//                                                 <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
//                                             </Button>
//                                         </DropdownMenuTrigger>
//                                         <DropdownMenuContent className="w-40" align="end">
//                                             <DropdownMenuItem
//                                                 onClick={() => toggleUserStatus(user.id)}
//                                                 className="flex items-center gap-2 cursor-pointer"
//                                             >
//                                                 {user.status === "Active" ? (
//                                                     <>
//                                                         <XCircle className="h-4 w-4 text-red-500" />
//                                                         <span>Block</span>
//                                                     </>
//                                                 ) : (
//                                                     <>
//                                                         <CheckCircle className="h-4 w-4 text-green-500" />
//                                                         <span>Unblock</span>
//                                                     </>
//                                                 )}
//                                             </DropdownMenuItem>
//                                         </DropdownMenuContent>
//                                     </DropdownMenu>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                 <div className="text-sm text-gray-500 dark:text-gray-400">
//                     Showing {(currentPage - 1) * itemsPerPage + 1}–
//                     {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         disabled={currentPage === 1}
//                         onClick={() => setCurrentPage((prev) => prev - 1)}
//                     >
//                         <ChevronLeft className="h-4 w-4" />
//                     </Button>
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
//                         <Button
//                             key={i}
//                             variant={currentPage === i + 1 ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => setCurrentPage(i + 1)}
//                         >
//                             {i + 1}
//                         </Button>
//                     ))}
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         disabled={currentPage === totalPages}
//                         onClick={() => setCurrentPage((prev) => prev + 1)}
//                     >
//                         <ChevronRight className="h-4 w-4" />
//                     </Button>
//                 </div>
//                 <select
//                     value={itemsPerPage}
//                     onChange={(e) => {
//                         setItemsPerPage(Number(e.target.value));
//                         setCurrentPage(1);
//                     }}
//                     className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1"
//                 >
//                     {[5, 10, 20, 50].map((value) => (
//                         <option key={value} value={value}>
//                             {value}
//                         </option>
//                     ))}
//                 </select>
//             </div>
//         </div>
//     );
// };

// export default UsersOutlet;
