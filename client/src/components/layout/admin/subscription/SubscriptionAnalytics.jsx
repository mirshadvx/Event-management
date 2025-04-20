import React, { useState, useEffect } from "react";
import { Search, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Line, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import adminApi from "@/services/adminApi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const SubscriptionAnalytics = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [timeRange, setTimeRange] = useState("month");
    const [planType, setPlanType] = useState("all");
    const [analyticsData, setAnalyticsData] = useState({
        totalRevenue: { basic: 0, premium: 0 },
        growthData: { labels: [], basic: [], premium: [] },
        transactionData: { purchase: 0, renewal: 0, upgrade: 0 },
        transactions: [],
    });

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            const params = {
                time_range: timeRange,
                plan_type: planType !== "all" ? planType : undefined,
            };

            const response = await adminApi.get("subscriptions-analytics/", { params });
            setAnalyticsData(response.data);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange, planType]);

    const resetFilters = () => {
        setTimeRange("month");
        setPlanType("all");
    };

    // Line chart for subscription growth
    const growthChartData = {
        labels: analyticsData.growthData.labels,
        datasets: [
            {
                label: "Basic Plan",
                data: analyticsData.growthData.basic,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.1,
            },
            {
                label: "Premium Plan",
                data: analyticsData.growthData.premium,
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension: 0.1,
            },
        ],
    };

    // Bar chart for transaction types
    const transactionChartData = {
        labels: ["Purchase", "Renewal", "Upgrade"],
        datasets: [
            {
                label: "Transactions",
                data: [
                    analyticsData.transactionData.purchase,
                    analyticsData.transactionData.renewal,
                    analyticsData.transactionData.upgrade,
                ],
                backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)", "rgba(255, 206, 86, 0.6)"],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true },
        },
    };

    return (
        <div className="space-y-6 pt-6 pb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
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
                <Button onClick={fetchAnalyticsData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Revenue Metrics */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Plan Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">₹{analyticsData.totalRevenue.basic.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Premium Plan Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">₹{analyticsData.totalRevenue.premium.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Line
                            data={growthChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: { display: true, text: "Subscription Growth Over Time" },
                                },
                            }}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Bar
                            data={transactionChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: { display: true, text: "Transaction Type Distribution" },
                                },
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SubscriptionAnalytics;
