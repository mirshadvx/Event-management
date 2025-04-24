import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
            const params = {};
            if (timeRange !== "all") params.time_range = timeRange;
            if (planType !== "all") params.plan_type = planType;

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

    const growthChartData = {
        labels: analyticsData.growthData.labels,
        datasets: [
            {
                label: "Basic Plan",
                data: analyticsData.growthData.basic,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.1,
                fill: true,
            },
            {
                label: "Premium Plan",
                data: analyticsData.growthData.premium,
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                tension: 0.1,
                fill: true,
            },
        ],
    };

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
                borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)", "rgba(255, 206, 86, 1)"],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.raw}`;
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className=" md:w-auto">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className=" md:w-auto">
                    <Select value={planType} onValueChange={setPlanType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Plan Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={resetFilters} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                </Button>

                <Button onClick={fetchAnalyticsData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Refreshing..." : "Refresh Data"}
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Basic Plan Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatCurrency(analyticsData.totalRevenue.basic)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Premium Plan Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatCurrency(analyticsData.totalRevenue.premium)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <Line
                            data={growthChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: { display: true, text: "New Subscriptions Over Time" },
                                },
                                maintainAspectRatio: false,
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Types</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <Bar
                            data={transactionChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    ...chartOptions.plugins,
                                    title: { display: true, text: "Transaction Type Distribution" },
                                },
                                maintainAspectRatio: false,
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {analyticsData.transactions.length > 0 ? (
                                    analyticsData.transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {transaction.subscription__user__username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {transaction.subscription__plan__name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {transaction.transaction_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(transaction.transaction_date).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SubscriptionAnalytics;

// import React, { useState, useEffect } from "react";
// import { Search, RefreshCw, Download } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Line, Bar } from "react-chartjs-2";
// import {
//     Chart as ChartJS,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     BarElement,
//     Title,
//     Tooltip,
//     Legend,
// } from "chart.js";
// import adminApi from "@/services/adminApi";

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// const SubscriptionAnalytics = () => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [timeRange, setTimeRange] = useState("month");
//     const [planType, setPlanType] = useState("all");
//     const [analyticsData, setAnalyticsData] = useState({
//         totalRevenue: { basic: 0, premium: 0 },
//         growthData: { labels: [], basic: [], premium: [] },
//         transactionData: { purchase: 0, renewal: 0, upgrade: 0 },
//         transactions: [],
//     });

//     const fetchAnalyticsData = async () => {
//         setIsLoading(true);
//         try {
//             const params = {
//                 time_range: timeRange,
//                 plan_type: planType !== "all" ? planType : undefined,
//             };

//             const response = await adminApi.get("subscriptions-analytics/", { params });
//             setAnalyticsData(response.data);
//         } catch (error) {
//             console.error("Error fetching analytics data:", error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchAnalyticsData();
//     }, [timeRange, planType]);

//     const resetFilters = () => {
//         setTimeRange("month");
//         setPlanType("all");
//     };

//     const growthChartData = {
//         labels: analyticsData.growthData.labels,
//         datasets: [
//             {
//                 label: "Basic Plan",
//                 data: analyticsData.growthData.basic,
//                 borderColor: "rgb(75, 192, 192)",
//                 backgroundColor: "rgba(75, 192, 192, 0.2)",
//                 tension: 0.1,
//             },
//             {
//                 label: "Premium Plan",
//                 data: analyticsData.growthData.premium,
//                 borderColor: "rgb(255, 99, 132)",
//                 backgroundColor: "rgba(255, 99, 132, 0.2)",
//                 tension: 0.1,
//             },
//         ],
//     };

//     const transactionChartData = {
//         labels: ["Purchase", "Renewal", "Upgrade"],
//         datasets: [
//             {
//                 label: "Transactions",
//                 data: [
//                     analyticsData.transactionData.purchase,
//                     analyticsData.transactionData.renewal,
//                     analyticsData.transactionData.upgrade,
//                 ],
//                 backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)", "rgba(255, 206, 86, 0.6)"],
//             },
//         ],
//     };

//     const chartOptions = {
//         responsive: true,
//         plugins: {
//             legend: { position: "top" },
//             title: { display: true },
//         },
//     };

//     return (
//         <div className="space-y-6 pt-6 pb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//             <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
//                 <select
//                     value={timeRange}
//                     onChange={(e) => setTimeRange(e.target.value)}
//                     className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//                 >
//                     <option value="today">Today</option>
//                     <option value="week">This Week</option>
//                     <option value="month">This Month</option>
//                     <option value="year">This Year</option>
//                 </select>
//                 <select
//                     value={planType}
//                     onChange={(e) => setPlanType(e.target.value)}
//                     className="min-w-[150px] border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-3 py-2"
//                 >
//                     <option value="all">All Plans</option>
//                     <option value="basic">Basic</option>
//                     <option value="premium">Premium</option>
//                 </select>
//                 <Button variant="outline" onClick={resetFilters}>
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Reset
//                 </Button>
//                 <Button onClick={fetchAnalyticsData}>
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Refresh
//                 </Button>
//             </div>

//             <div className="grid md:grid-cols-2 gap-4">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Basic Plan Revenue</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <p className="text-2xl font-bold">₹{analyticsData.totalRevenue.basic.toFixed(2)}</p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Premium Plan Revenue</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <p className="text-2xl font-bold">₹{analyticsData.totalRevenue.premium.toFixed(2)}</p>
//                     </CardContent>
//                 </Card>
//             </div>

//             <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Subscription Growth</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <Line
//                             data={growthChartData}
//                             options={{
//                                 ...chartOptions,
//                                 plugins: {
//                                     ...chartOptions.plugins,
//                                     title: { display: true, text: "Subscription Growth Over Time" },
//                                 },
//                             }}
//                         />
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Transaction Types</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <Bar
//                             data={transactionChartData}
//                             options={{
//                                 ...chartOptions,
//                                 plugins: {
//                                     ...chartOptions.plugins,
//                                     title: { display: true, text: "Transaction Type Distribution" },
//                                 },
//                             }}
//                         />
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// };

// export default SubscriptionAnalytics;
