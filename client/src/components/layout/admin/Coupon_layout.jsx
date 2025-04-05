import React, { useState, useEffect, useCallback } from "react";
import { Search, MoreHorizontal, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import adminApi from "@/services/adminApi";
import { TbEdit } from "react-icons/tb";
import CouponModal from "@/components/admin/Coupon/CouponModal";
import { toast } from "sonner";

const CouponLayout = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [discountTypeFilter, setDiscountTypeFilter] = useState("all");
    const [selectedCoupons, setSelectedCoupons] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState("");
    const [couponId, setCouponId] = useState(null);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminApi.get("/coupons/", {
                params: {
                    search: searchTerm || undefined,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    discount_type: discountTypeFilter === "all" ? undefined : discountTypeFilter,
                    page: currentPage,
                    page_size: itemsPerPage,
                },
            });
            setCoupons(response.data.results || []);
            setTotalItems(response.data.count || 0);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch coupons");
            setCoupons([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, discountTypeFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchCoupons(); 
    }, [statusFilter, discountTypeFilter, currentPage, itemsPerPage]);

    const handleSearchClick = () => {
        fetchCoupons();
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === "Enter") {
            fetchCoupons(); 
        }
    };

    const toggleCouponSelection = (couponId) => {
        setSelectedCoupons((prev) =>
            prev.includes(couponId) ? prev.filter((id) => id !== couponId) : [...prev, couponId]
        );
    };

    const toggleAllCoupons = () => {
        setSelectedCoupons((prev) =>
            prev.length === coupons.length && coupons.length > 0 ? [] : coupons.map((coupon) => coupon.id)
        );
    };

    const toggleCouponStatus = async (couponId) => {
        setError(null);
        try {
            const coupon = coupons.find((c) => c.id === couponId);
            const newStatus = !coupon.is_active;
            const response = await adminApi.put(`/coupons/${couponId}/`, {
                ...coupon,
                is_active: newStatus,
            });
            if (response.status === 200) {
                toast.success("Status Updated", { duration: 3000, className: "text-white p-4 rounded-md" });
            } else {
                toast.error("Status updation failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
            }
            setCoupons((prev) => prev.map((c) => (c.id === couponId ? response.data : c)));
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update coupon status");
        }
    };

    const bulkToggleStatus = async (isActive) => {
        if (!selectedCoupons.length) return;
        setError(null);
        try {
            await adminApi.post("/coupons/bulk_update/", {
                ids: selectedCoupons,
                is_active: isActive,
            });
            await fetchCoupons();
            setSelectedCoupons([]);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to bulk update coupons");
        }
    };

    const deleteCoupon = async (couponId) => {
        setError(null);
        try {
            const response = await adminApi.delete(`/coupons/${couponId}/`);
            await fetchCoupons();
            if (response.status === 200) {
                toast.success("Coupon Deleted", { duration: 3000, className: "text-white p-4 rounded-md" });
            } else {
                toast.error("Coupon Deletion Failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete coupon");
        }
    };

    // const createCoupon = async (formData) => {
    //   setError(null);
    //   try {
    //     const response = await adminApi.post("/coupons/", formData);
    //     console.log(response);
    //     await fetchCoupons();
    //     if (response.status === 201) {
    //       toast.success("Created New Coupon", { duration: 3000, className: "text-white p-4 rounded-md" });
    //     } else {
    //       throw new Error("Unexpected response status");
    //     }
    //   } catch (err) {
    //     console.log("errrorrroro   :",err);
    //     const errorMessage = err.response?.data?.code[0] || "Failed to create coupon";
    //     setError(errorMessage); // Set the specific error message from backend
    //     toast.error(errorMessage, { duration: 3000, className: "text-white p-4 rounded-md" });
    //   }
    // };

    const createCoupon = async (formData) => {
        setError(null);
        try {
            const response = await adminApi.post("/coupons/", formData);
            await fetchCoupons();
            if (response.status === 201) {
                toast.success("Created New Coupon", { duration: 3000, className: "text-white p-4 rounded-md" });
                return { success: true };
            } else {
                throw new Error("Unexpected response status");
                // console.log("errr");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.code?.[0] || "Failed to create coupon";
            setError(errorMessage); 
            toast.error(errorMessage, { duration: 3000, className: "text-white p-4 rounded-md" });
            return { success: false, error: errorMessage }; 
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setDiscountTypeFilter("all");
        setCurrentPage(1);
        setSelectedCoupons([]);
        setError(null);
        fetchCoupons();
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const editCoupon = (id) => {
        setIsModalOpen(true);
        setCouponId(id);
        setModalStatus(null);
    };

    const getStatusStyles = (isActive) =>
        isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

    return (
        <>
            <CouponModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={createCoupon}
                status={modalStatus}
                id={couponId}
                fetchCoupons={fetchCoupons}
            />

            <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                className="pl-10 w-full"
                                placeholder="Search Coupon (code or title)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
                                disabled={loading}
                            />
                        </div>
                        <Button variant="outline" onClick={handleSearchClick} disabled={loading}>
                            Search
                        </Button>
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
                        value={discountTypeFilter}
                        onChange={(e) => {
                            setDiscountTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                        disabled={loading}
                    >
                        <option value="all">All Discount Types</option>
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                    </select>
                    <Button variant="outline" onClick={resetFilters} disabled={loading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        disabled={loading}
                        onClick={() => {
                            setIsModalOpen(true);
                            setModalStatus("new");
                            setCouponId(null);
                        }}
                    >
                        <TbEdit className="h-5 w-5" />
                        Create New
                    </Button>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Selected Coupons Actions */}
                {selectedCoupons.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                            {selectedCoupons.length} coupon{selectedCoupons.length > 1 ? "s" : ""} selected
                        </span>
                        <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(true)} disabled={loading}>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Activate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(false)} disabled={loading}>
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Block
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCoupons([])}>
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
                                        checked={selectedCoupons.length === coupons.length && coupons.length > 0}
                                        onChange={toggleAllCoupons}
                                        disabled={loading}
                                    />
                                </th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Code</th>
                                <th className="p-4">Discount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Used</th>
                                <th className="p-4">Validity</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-gray-500">
                                        No coupons found
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedCoupons.includes(coupon.id)}
                                                onChange={() => toggleCouponSelection(coupon.id)}
                                                disabled={loading}
                                            />
                                        </td>
                                        <td className="p-4">{coupon.title}</td>
                                        <td className="p-4">{coupon.code}</td>
                                        <td className="p-4">
                                            {coupon.discount_type === "percentage"
                                                ? `${coupon.discount_value}%`
                                                : `${coupon.discount_value}`}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                                    coupon.is_active
                                                )}`}
                                            >
                                                {coupon.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span>
                                                {coupon.used_count > 0 ? coupon.used_count : 'Null'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(coupon.start_date).toLocaleDateString()} -{" "}
                                            {new Date(coupon.end_date).toLocaleDateString()}
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
                                                        className="flex items-center gap-2 cursor-pointer"
                                                        onClick={() => toggleCouponStatus(coupon.id)}
                                                    >
                                                        {coupon.is_active ? (
                                                            <>
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 cursor-pointer"
                                                        onClick={() => editCoupon(coupon.id)}
                                                    >
                                                        <TbEdit className="h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 cursor-pointer text-red-600"
                                                        onClick={() => deleteCoupon(coupon.id)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Delete
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
                        Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                        {totalItems} coupons
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
        </>
    );
};

export default CouponLayout;

// import React, { useState, useEffect, useCallback } from "react";
// import { Search, MoreHorizontal, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
// import adminApi from "@/services/adminApi";
// import { TbEdit } from "react-icons/tb";
// import CouponModal from "@/components/admin/Coupon/CouponModal";
// import { toast } from "sonner";

// const CouponLayout = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [discountTypeFilter, setDiscountTypeFilter] = useState("all");
//   const [selectedCoupons, setSelectedCoupons] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalItems, setTotalItems] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalStatus, setModalStatus] = useState("");
//   const [couponId, setCouponId] = useState(null);

//   const fetchCoupons = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await adminApi.get("/coupons/", {
//         params: {
//           search: searchTerm || undefined,
//           status: statusFilter === "all" ? undefined : statusFilter,
//           discount_type: discountTypeFilter === "all" ? undefined : discountTypeFilter,
//           page: currentPage,
//           page_size: itemsPerPage,
//         },
//       });
//       setCoupons(response.data.results || []);
//       setTotalItems(response.data.count || 0);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to fetch coupons");
//       setCoupons([]);
//       setTotalItems(0);
//     } finally {
//       setLoading(false);
//     }
//   }, [searchTerm, statusFilter, discountTypeFilter, currentPage, itemsPerPage]);

//   useEffect(() => {
//     fetchCoupons(); // Fetch on initial load or when filters/page changes
//   }, [statusFilter, discountTypeFilter, currentPage, itemsPerPage]);

//   const handleSearchClick = () => {
//     fetchCoupons(); // Fetch when the search button is clicked
//   };

//   const handleSearchKeyPress = (e) => {
//     if (e.key === "Enter") {
//       fetchCoupons(); // Fetch when Enter is pressed
//     }
//   };

//   const toggleCouponSelection = (couponId) => {
//     setSelectedCoupons((prev) =>
//       prev.includes(couponId) ? prev.filter((id) => id !== couponId) : [...prev, couponId]
//     );
//   };

//   const toggleAllCoupons = () => {
//     setSelectedCoupons((prev) =>
//       prev.length === coupons.length && coupons.length > 0 ? [] : coupons.map((coupon) => coupon.id)
//     );
//   };

//   const toggleCouponStatus = async (couponId) => {
//     setError(null);
//     try {
//       const coupon = coupons.find((c) => c.id === couponId);
//       const newStatus = !coupon.is_active;
//       const response = await adminApi.put(`/coupons/${couponId}/`, {
//         ...coupon,
//         is_active: newStatus,
//       });
//       if (response.status === 200) {
//         toast.success("Status Updated", { duration: 3000, className: "text-white p-4 rounded-md" });
//       } else {
//         toast.error("Status updation failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
//       }
//       setCoupons((prev) => prev.map((c) => (c.id === couponId ? response.data : c)));
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to update coupon status");
//     }
//   };

//   const bulkToggleStatus = async (isActive) => {
//     if (!selectedCoupons.length) return;
//     setError(null);
//     try {
//       await adminApi.post("/coupons/bulk_update/", {
//         ids: selectedCoupons,
//         is_active: isActive,
//       });
//       await fetchCoupons();
//       setSelectedCoupons([]);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to bulk update coupons");
//     }
//   };

//   const deleteCoupon = async (couponId) => {
//     setError(null);
//     try {
//       const response = await adminApi.delete(`/coupons/${couponId}/`);
//       await fetchCoupons();
//       if (response.status === 200) {
//         toast.success("Coupon Deleted", { duration: 3000, className: "text-white p-4 rounded-md" });
//       } else {
//         toast.error("Coupon Deletion Failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to delete coupon");
//     }
//   };

//   const createCoupon = async (formData) => {
//     setError(null);
//     try {
//       const response = await adminApi.post("/coupons/", formData);
//       console.log(response);
//       await fetchCoupons();
//       if (response.status === 201) {
//         toast.success("Created New Coupon", { duration: 3000, className: "text-white p-4 rounded-md" });
//       }
//       else if(response.status === 400){
//         toast.error("Coupon Creation Failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
//       }
//        else {
//         toast.error("Coupon Creation Failed!", { duration: 3000, className: "text-white p-4 rounded-md" });
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to create coupon");
//     }
//   };

//   const resetFilters = () => {
//     setSearchTerm("");
//     setStatusFilter("all");
//     setDiscountTypeFilter("all");
//     setCurrentPage(1);
//     setSelectedCoupons([]);
//     setError(null);
//     fetchCoupons(); // Fetch with reset filters
//   };

//   const totalPages = Math.ceil(totalItems / itemsPerPage);

//   const editCoupon = (id) => {
//     setIsModalOpen(true);
//     setCouponId(id);
//     setModalStatus(null);
//   };

//   const getStatusStyles = (isActive) =>
//     isActive
//       ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
//       : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

//   return (
//     <>
//       <CouponModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={createCoupon}
//         status={modalStatus}
//         id={couponId}
//         fetchCoupons={fetchCoupons}
//       />

//       <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//         {/* Filters */}
//         <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//           <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <Input
//                 className="pl-10 w-full"
//                 placeholder="Search Coupon (code or title)..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onKeyPress={handleSearchKeyPress}
//                 disabled={loading}
//               />
//             </div>
//             <Button variant="outline" onClick={handleSearchClick} disabled={loading}>
//               Search
//             </Button>
//           </div>
//           <select
//             value={statusFilter}
//             onChange={(e) => {
//               setStatusFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//             className="min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//             disabled={loading}
//           >
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="blocked">Blocked</option>
//           </select>
//           <select
//             value={discountTypeFilter}
//             onChange={(e) => {
//               setDiscountTypeFilter(e.target.value);
//               setCurrentPage(1);
//             }}
//             className="min-w-[120px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//             disabled={loading}
//           >
//             <option value="all">All Discount Types</option>
//             <option value="fixed">Fixed</option>
//             <option value="percentage">Percentage</option>
//           </select>
//           <Button variant="outline" onClick={resetFilters} disabled={loading}>
//             <RefreshCw className="h-4 w-4 mr-2" />
//             Reset
//           </Button>
//           <Button
//             variant="outline"
//             disabled={loading}
//             onClick={() => {
//               setIsModalOpen(true);
//               setModalStatus("new");
//               setCouponId(null);
//             }}
//           >
//             <TbEdit className="h-5 w-5" />
//             Create New
//           </Button>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-300 text-sm">
//             {error}
//           </div>
//         )}

//         {/* Selected Coupons Actions */}
//         {selectedCoupons.length > 0 && (
//           <div className="flex flex-wrap gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
//             <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
//               {selectedCoupons.length} coupon{selectedCoupons.length > 1 ? "s" : ""} selected
//             </span>
//             <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(true)} disabled={loading}>
//               <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
//               Activate
//             </Button>
//             <Button variant="outline" size="sm" onClick={() => bulkToggleStatus(false)} disabled={loading}>
//               <XCircle className="h-4 w-4 mr-2 text-red-500" />
//               Block
//             </Button>
//             <Button variant="outline" size="sm" onClick={() => setSelectedCoupons([])}>
//               Clear
//             </Button>
//           </div>
//         )}

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-gray-50 dark:bg-gray-700">
//               <tr>
//                 <th className="p-4">
//                   <input
//                     type="checkbox"
//                     checked={selectedCoupons.length === coupons.length && coupons.length > 0}
//                     onChange={toggleAllCoupons}
//                     disabled={loading}
//                   />
//                 </th>
//                 <th className="p-4">Title</th>
//                 <th className="p-4">Code</th>
//                 <th className="p-4">Discount</th>
//                 <th className="p-4">Status</th>
//                 <th className="p-4">Validity</th>
//                 <th className="p-4 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y dark:divide-gray-700">
//               {loading ? (
//                 <tr>
//                   <td colSpan={7} className="p-4 text-center text-gray-500">
//                     Loading...
//                   </td>
//                 </tr>
//               ) : coupons.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="p-4 text-center text-gray-500">
//                     No coupons found
//                   </td>
//                 </tr>
//               ) : (
//                 coupons.map((coupon) => (
//                   <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
//                     <td className="p-4">
//                       <input
//                         type="checkbox"
//                         checked={selectedCoupons.includes(coupon.id)}
//                         onChange={() => toggleCouponSelection(coupon.id)}
//                         disabled={loading}
//                       />
//                     </td>
//                     <td className="p-4">{coupon.title}</td>
//                     <td className="p-4">{coupon.code}</td>
//                     <td className="p-4">
//                       {coupon.discount_type === "percentage"
//                         ? `${coupon.discount_value}%`
//                         : `${coupon.discount_value}`}
//                     </td>
//                     <td className="p-4">
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(coupon.is_active)}`}
//                       >
//                         {coupon.is_active ? "Active" : "Inactive"}
//                       </span>
//                     </td>
//                     <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
//                       {new Date(coupon.start_date).toLocaleDateString()} -{" "}
//                       {new Date(coupon.end_date).toLocaleDateString()}
//                     </td>
//                     <td className="p-4 text-right">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="sm" disabled={loading}>
//                             <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuItem
//                             className="flex items-center gap-2 cursor-pointer"
//                             onClick={() => toggleCouponStatus(coupon.id)}
//                           >
//                             {coupon.is_active ? (
//                               <>
//                                 <XCircle className="h-4 w-4 text-red-500" />
//                                 Deactivate
//                               </>
//                             ) : (
//                               <>
//                                 <CheckCircle className="h-4 w-4 text-green-500" />
//                                 Activate
//                               </>
//                             )}
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             className="flex items-center gap-2 cursor-pointer"
//                             onClick={() => editCoupon(coupon.id)}
//                           >
//                             <TbEdit className="h-4 w-4" />
//                             Edit
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             className="flex items-center gap-2 cursor-pointer text-red-600"
//                             onClick={() => deleteCoupon(coupon.id)}
//                           >
//                             <XCircle className="h-4 w-4" />
//                             Delete
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
//           <div className="text-sm text-gray-500 dark:text-gray-400">
//             Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
//             {totalItems} coupons
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={currentPage === 1 || loading}
//               onClick={() => setCurrentPage((prev) => prev - 1)}
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </Button>
//             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//               const pageNum = i + 1;
//               return (
//                 <Button
//                   key={pageNum}
//                   variant={currentPage === pageNum ? "default" : "outline"}
//                   size="sm"
//                   onClick={() => setCurrentPage(pageNum)}
//                   disabled={loading}
//                 >
//                   {pageNum}
//                 </Button>
//               );
//             })}
//             <Button
//               variant="outline"
//               size="sm"
//               disabled={currentPage === totalPages || loading}
//               onClick={() => setCurrentPage((prev) => prev + 1)}
//             >
//               <ChevronRight className="h-4 w-4" />
//             </Button>
//           </div>
//           <select
//             value={itemsPerPage}
//             onChange={(e) => {
//               setItemsPerPage(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//             className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm"
//             disabled={loading}
//           >
//             {[10, 20, 50].map((value) => (
//               <option key={value} value={value}>
//                 {value} per page
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>
//     </>
//   );
// };

// export default CouponLayout;
