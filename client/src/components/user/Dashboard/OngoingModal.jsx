import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from "chart.js";
import { getOngoingDetails } from "@/services/user/dashboard/dashboardService";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const OngoingModal = ({ isOpen, onClose, eventId }) => {
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (isOpen && eventId) {
                try {
                    setLoading(true);
                    const data = await getOngoingDetails(eventId);
                    setEventData(data);
                } catch (error) {
                    console.error("Failed to fetch event data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [isOpen, eventId]);

    const SkeletonLoader = () => (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 text-white h-auto max-h-screen sm:max-h-[90vh] p-0 pt-5 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto my-0 sm:my-4 overflow-hidden">
                <ScrollArea className="h-full max-h-[calc(100vh-100px)] sm:max-h-[calc(90vh-140px)] px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="grid xl:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-gray-800 p-4 sm:p-5 rounded-lg shadow-lg">
                                <Skeleton className="h-6 w-3/4 mb-3 sm:mb-4 bg-gray-700" />
                                <div className="h-56 sm:h-64 lg:h-72 space-y-2">
                                    <Skeleton className="h-4 w-full bg-gray-700" />
                                    <div className="flex justify-between items-end h-48 sm:h-56 lg:h-64 space-x-1">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className="flex-1 flex flex-col justify-end space-y-1">
                                                <Skeleton
                                                    className="w-full bg-gray-700"
                                                    style={{ height: `${Math.random() * 60 + 20}%` }}
                                                />
                                                <Skeleton
                                                    className="w-full bg-gray-600"
                                                    style={{ height: `${Math.random() * 40 + 10}%` }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-4 sm:p-5 rounded-lg shadow-lg">
                                <Skeleton className="h-6 w-3/4 mb-3 sm:mb-4 bg-gray-700" />
                                <div className="h-56 sm:h-64 lg:h-72 space-y-2">
                                    <Skeleton className="h-4 w-full bg-gray-700" />
                                    <div className="relative h-48 sm:h-56 lg:h-64">
                                        <div className="absolute inset-0 flex items-end justify-between">
                                            {[...Array(7)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-2 bg-gray-700 rounded-full"
                                                    style={{ height: `${Math.random() * 80 + 20}%` }}
                                                />
                                            ))}
                                        </div>

                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton
                                                key={i}
                                                className="absolute w-full h-px bg-gray-700"
                                                style={{ top: `${i * 25}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                { bg: "bg-blue-900", border: "border-blue-400" },
                                { bg: "bg-green-900", border: "border-green-400" },
                                { bg: "bg-purple-900", border: "border-purple-400" },
                                { bg: "bg-red-900", border: "border-red-400" },
                            ].map((card, index) => (
                                <div
                                    key={index}
                                    className={`${card.bg} ${card.border} p-3 sm:p-5 rounded-lg border-l-4 shadow-lg`}
                                >
                                    <Skeleton className="h-4 w-24 mb-2 bg-gray-700" />
                                    <Skeleton className="h-8 sm:h-10 w-20 bg-gray-700" />
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="bg-gray-700 p-4 sm:p-5 rounded-lg shadow-md">
                                        <div className="flex items-center justify-between mb-3">
                                            <Skeleton className="h-5 w-28 bg-gray-600" />
                                        </div>
                                        <Skeleton className="h-4 w-full mb-2 bg-gray-600" />
                                        <Skeleton className="h-8 sm:h-10 w-24 bg-gray-600" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );

    if (loading || !eventData) {
        return <SkeletonLoader />;
    }

    const { dateRange, ticketStats, summary } = eventData;
    const dates = ticketStats.regular?.details.map((item) => item.date) || [];

    const colors = {
        regular: { main: "#34D399", light: "rgba(52, 211, 153, 0.2)", cancel: "#FBBF24" },
        vip: { main: "#A78BFA", light: "rgba(167, 139, 250, 0.2)", cancel: "#F87171" },
        gold: { main: "#FBBF24", light: "rgba(251, 191, 36, 0.2)", cancel: "#FB923C" },
    };

    const ticketTypes = Object.keys(ticketStats);

    const barChartData = {
        labels: dates,
        datasets: ticketTypes.flatMap((type) => [
            {
                label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                data: ticketStats[type].details.map((item) => item.purchases),
                backgroundColor: colors[type]?.main,
                stack: "purchases",
            },
            {
                label: `${type.charAt(0).toUpperCase() + type.slice(1)} Cancellations`,
                data: ticketStats[type].details.map((item) => item.cancellations),
                backgroundColor: colors[type]?.cancel,
                stack: "cancellations",
            },
        ]),
    };

    const lineChartData = {
        labels: dates,
        datasets: ticketTypes.map((type) => ({
            label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            data: ticketStats[type].details.map((item) => item.purchasesUsers),
            borderColor: colors[type]?.main,
            backgroundColor: colors[type]?.light,
            tension: 0.4,
            fill: false,
        })),
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                labels: {
                    boxWidth: 12,
                    font: {
                        size: window.innerWidth < 768 ? 10 : 11,
                    },
                    color: "#E5E7EB",
                    padding: window.innerWidth < 768 ? 8 : 12,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: "#9CA3AF",
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12,
                    },
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: "rgba(156, 163, 175, 0.2)",
                },
                ticks: {
                    color: "#9CA3AF",
                    font: {
                        size: window.innerWidth < 768 ? 10 : 12,
                    },
                },
            },
        },
    };

    const themeClasses = {
        background: "bg-gray-900",
        text: "text-white",
        cardBg: "bg-gray-800",
        cardText: "text-gray-100",
        description: "text-gray-300",
        whiteCard: "bg-gray-700",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 text-white h-auto max-h-screen sm:max-h-[90vh] p-0 pt-5 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto my-0 sm:my-4 overflow-hidden">
                <ScrollArea className="h-full max-h-[calc(100vh-100px)] sm:max-h-[calc(90vh-140px)] px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="grid xl:grid-cols-2 gap-4 sm:gap-6">
                            <div className={`${themeClasses.cardBg} p-4 sm:p-5 rounded-lg shadow-lg`}>
                                <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${themeClasses.cardText}`}>
                                    Ticket Purchases & Cancellations with Amount
                                </h3>
                                <div className="h-56 sm:h-64 lg:h-72">
                                    <Bar data={barChartData} options={chartOptions} />
                                </div>
                            </div>

                            <div className={`${themeClasses.cardBg} p-4 sm:p-5 rounded-lg shadow-lg`}>
                                <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 ${themeClasses.cardText}`}>
                                    Ticket Purchases & Cancellations with Users Count
                                </h3>
                                <div className="h-56 sm:h-64 lg:h-72">
                                    <Line data={lineChartData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-blue-900 border-blue-400 p-3 sm:p-5 rounded-lg border-l-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <h4 className="font-semibold text-blue-200 text-sm sm:text-base">Total Revenue</h4>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-100">
                                    {summary.totalRevenue.toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-green-900 border-green-400 p-3 sm:p-5 rounded-lg border-l-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <h4 className="font-semibold text-green-200 text-sm sm:text-base">Participants</h4>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-100">
                                    {summary.totalParticipants}/{summary.totalLimit}
                                </p>
                            </div>

                            <div className="bg-purple-900 border-purple-400 p-3 sm:p-5 rounded-lg border-l-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <h4 className="font-semibold text-purple-200 text-sm sm:text-base">Total Purchases</h4>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-100">
                                    {summary.totalPurchases.toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-red-900 border-red-400 p-3 sm:p-5 rounded-lg border-l-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <h4 className="font-semibold text-red-200 text-sm sm:text-base">Total Cancellations</h4>
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-100">
                                    {summary.totalCancellations.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className={`${themeClasses.cardBg} p-4 sm:p-6 rounded-lg shadow-lg`}>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {ticketTypes.map((type) => (
                                    <div
                                        key={type}
                                        className={`${themeClasses.whiteCard} p-4 sm:p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className={`font-semibold text-${type}-300 text-base sm:text-lg`}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)} Tickets
                                            </h4>
                                        </div>
                                        <p className="text-sm sm:text-base text-gray-300 mb-2">
                                            Sold: {ticketStats[type].totalPurchases.toLocaleString()} | Cancelled:{" "}
                                            {ticketStats[type].totalCancellations.toLocaleString()}
                                        </p>
                                        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold text-${type}-200`}>
                                            {ticketStats[type].revenue.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default OngoingModal;
