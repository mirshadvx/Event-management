import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminApi from "@/services/adminApi";

const SubsOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [planType, setPlanType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        search: searchTerm || undefined,
        plan_type: planType !== "all" ? planType : undefined,
      };

      const response = await adminApi.get("subscriptions-users/", { params });
      const data = response.data.results || response.data;

      setSubscriptionData(data);
      setTotalItems(response.data.count || data.length);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [currentPage, itemsPerPage, searchTerm, planType]);

  const resetFilters = () => {
    setSearchTerm("");
    setPlanType("all");
    setCurrentPage(1);
  };

  const toggleSubscriptionStatus = async (subscriptionId) => {
    try {
      const response = await adminApi.post(
        `subscriptions-users/${subscriptionId}/status/`
      );
      if (response.data.success) {
        fetchSubscriptionData();
      }
    } catch (error) {
      console.error("Error toggling subscription status:", error);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 w-full"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={planType}
          onChange={(e) => setPlanType(e.target.value)}
          className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
        <Button variant="outline" onClick={resetFilters}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={fetchSubscriptionData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto pt-6">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-4">Username</th>

                  <th className="p-4">Plan</th>
                  <th className="p-4">Plan Price</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4">Days Remaining</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : subscriptionData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  subscriptionData.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-4 font-medium flex flex-col">
                        <span>{subscription.user.username}</span>
                        <span>{subscription.user.email}</span>
                      </td>
                      <td className="p-4">{subscription.plan.name}</td>
                      <td className="p-4">{subscription.plan.price}</td>
                      <td className="p-4">{subscription.paid_amount}</td>
                      <td className="p-4">
                        {new Date(subscription.start_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">{subscription.days_remaining}</td>
                      <td className="p-4">
                        {subscription.payment_method || "N/A"}
                      </td>
                      <td className="p-4">
                        {subscription.transaction_type || "N/A"}
                      </td>
                      <td className="p-4">
                        {subscription.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          onClick={() =>
                            toggleSubscriptionStatus(subscription.id)
                          }
                        >
                          {subscription.is_active ? "Deactivate" : "Activate"}
                        </Button>
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              subscriptions
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

export default SubsOverview;
