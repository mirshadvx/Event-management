import React, { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    CreditCard,
    Check,
    X,
    RefreshCcw,
    ArrowUpRight,
    BarChart3,
    Users,
    Mail,
    MessageSquare,
    Video,
    QrCode,
} from "lucide-react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";

const Subscription = () => {
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user && !userLoading) {
            dispatch(get_ProfileData());
        }
        if (user && user.plan == null) {
            navigate("/checkout/subscription");
        }
    }, [user, userLoading, dispatch, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("users/subscription-details/");
                if (response.data.success) {
                    setSubscription(response.data.subscription);
                } else {
                    console.error("Failed to fetch subscription details:", response.data.message);
                }

                const transactionResponse = await api.get("users/subscription-transactions/");
                if (transactionResponse.data.success) {
                    setTransactions(transactionResponse.data.transactions);
                } else {
                    setTransactions([
                        {
                            id: "tx123456",
                            amount: 149.99,
                            transaction_type: "purchase",
                            payment_method: "Credit Card",
                            transaction_id: "pay_Lk82jHk928",
                            transaction_date: "2025-02-15T10:30:45Z",
                        },
                        {
                            id: "tx123457",
                            amount: 99.99,
                            transaction_type: "upgrade",
                            payment_method: "PayPal",
                            transaction_id: "pay_Mn72jG8234",
                            transaction_date: "2025-01-10T14:22:37Z",
                        },
                        {
                            id: "tx123458",
                            amount: 49.99,
                            transaction_type: "purchase",
                            payment_method: "Debit Card",
                            transaction_id: "pay_Kj21hG3456",
                            transaction_date: "2024-11-15T09:45:12Z",
                        },
                    ]);
                }
            } catch (error) {
                console.error("Error fetching subscription details:", error);
                setTransactions([
                    {
                        id: "tx123456",
                        amount: 149.99,
                        transaction_type: "purchase",
                        payment_method: "Credit Card",
                        transaction_id: "pay_Lk82jHk928",
                        transaction_date: "2025-02-15T10:30:45Z",
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    };

    const getProgressColor = (current, limit) => {
        const percentage = (current / limit) * 100;
        if (percentage < 50) return "bg-green-500";
        if (percentage < 80) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case "purchase":
                return "bg-blue-500";
            case "renewal":
                return "bg-green-500";
            case "upgrade":
                return "bg-purple-500";
            default:
                return "bg-gray-500";
        }
    };

    const getTransactionTypeIcon = (type) => {
        switch (type) {
            case "purchase":
                return <CreditCard className="w-4 h-4" />;
            case "renewal":
                return <RefreshCcw className="w-4 h-4" />;
            case "upgrade":
                return <ArrowUpRight className="w-4 h-4" />;
            default:
                return <CreditCard className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 rounded-2xl p-6 shadow-xl flex items-center justify-center">
                <div className="text-white text-xl">Loading subscription details...</div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="min-h-screen bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
                <div className="bg-slate-800 rounded-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4">No Active Subscription</h2>
                    <p className="text-slate-400 mb-6">
                        You don't have an active subscription. Choose a plan to get started.
                    </p>
                    <button 
                        className="bg-[#00EF93] text-black font-semibold py-2 px-6 rounded-lg"
                        onClick={() => navigate("/checkout/subscription")}
                    >
                        Choose a Plan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 rounded-2xl p-6 shadow-xl text-white">
            <div className="bg-slate-800 rounded-xl p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {subscription.plan.name.charAt(0).toUpperCase() + subscription.plan.name.slice(1)} Plan
                        </h2>
                        <p className="text-slate-400">Active subscription</p>
                    </div>
                    <div className="text-right">
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                            {subscription.is_active ? "Active" : "Inactive"}
                        </span>
                        <div className="text-2xl font-bold">{subscription.plan.price}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-700 p-2 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                            <span className="text-slate-300">Start Date</span>
                        </div>
                        <div className="font-semibold">{formatDate(subscription.start_date)}</div>
                    </div>
                    <div className="bg-slate-700 p-2 rounded-lg">
                        <div className="flex items-center mb-2">
                            <Calendar className="w-5 h-5 mr-2 text-red-400" />
                            <span className="text-slate-300">End Date</span>
                        </div>
                        <div className="font-semibold">{formatDate(subscription.end_date)}</div>
                    </div>
                    <div className="bg-slate-700 rounded-lg h-full px-4">
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-purple-400" />
                                <span className="text-slate-300">Time Remaining</span>
                            </div>
                            <span className="font-bold">{subscription.days_remaining} days</span>
                        </div>
                        <div className="pt-3">
                            <div className="w-full bg-slate-600 rounded-full h-2.5">
                                <div
                                    className="bg-purple-500 h-2.5 rounded-full"
                                    style={{ width: `${(subscription.days_remaining / 30) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-300">Events Joined</span>
                            <span className="font-bold">
                                {subscription.events_joined_current_month} / {subscription.plan.event_join_limit}
                            </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5">
                            <div
                                className={`${getProgressColor(
                                    subscription.events_joined_current_month,
                                    subscription.plan.event_join_limit
                                )} h-2.5 rounded-full transition-all duration-300`}
                                style={{
                                    width: `${
                                        subscription.plan.event_join_limit > 0 
                                            ? Math.min((subscription.events_joined_current_month / subscription.plan.event_join_limit) * 100, 100)
                                            : 0
                                    }%`,
                                }}
                            ></div>
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                            {subscription.remaining_joins || 0} events remaining this month
                        </div>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-300">Events Created</span>
                            <span className="font-bold">
                                {subscription.events_organized_current_month} / {subscription.plan.event_creation_limit}
                            </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5">
                            <div
                                className={`${getProgressColor(
                                    subscription.events_organized_current_month,
                                    subscription.plan.event_creation_limit
                                )} h-2.5 rounded-full transition-all duration-300`}
                                style={{
                                    width: `${
                                        subscription.plan.event_creation_limit > 0 
                                            ? Math.min((subscription.events_organized_current_month / subscription.plan.event_creation_limit) * 100, 100)
                                            : 0
                                    }%`,
                                }}
                            ></div>
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                            {subscription.remaining_creations || 0} events remaining this month
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-semibold mb-4">Plan Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                        {subscription.plan.email_notification ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <Mail className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Email Notifications</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {subscription.plan.group_chat ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <Users className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Group Chat</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {subscription.plan.personal_chat ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Personal Chat</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {subscription.plan.advanced_analytics ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <BarChart3 className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Analytics</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {subscription.plan.ticket_scanning ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <QrCode className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Ticket Scanning</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {subscription.plan.live_streaming ? (
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                            <X className="w-5 h-5 text-red-500 mr-2" />
                        )}
                        <div className="flex items-center">
                            <Video className="w-5 h-5 mr-2 text-[#1cd745]" />
                            <span>Live Streaming</span>
                        </div>
                    </div>
                </div>
                {subscription.plan.name === "basic" && !user.plan_expired && (
                    <div className="mt-6 flex justify-center">
                        <button className="bg-[#00EF93] text-black font-semibold py-2 px-6 rounded-lg"
                        onClick={()=> navigate("/checkout/subscription")}>
                            Upgrade to Premium
                        </button>
                    </div>
                )}
                {subscription.is_expired && (
                    <div className="mt-6 flex justify-center">
                        <button
                            // onClick={() => navigate("/checkout/renew-subscription")}
                            onClick={()=> navigate("/checkout/subscription")}
                            className="bg-[#00EF93] text-black font-semibold py-2 px-6 rounded-lg"
                        >
                            Renew Plan
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Transaction History</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-slate-400 border-b border-slate-700">
                                <th className="pb-4">Type</th>
                                <th className="pb-4">Date</th>
                                <th className="pb-4">Payment Method</th>
                                <th className="pb-4">Transaction ID</th>
                                <th className="pb-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.id} className="border-b border-slate-700">
                                    <td className="py-4">
                                        <div className="flex items-center">
                                            <div
                                                className={`${getTransactionTypeColor(
                                                    transaction.transaction_type
                                                )} p-2 rounded-lg mr-3 flex items-center justify-center`}
                                            >
                                                {getTransactionTypeIcon(transaction.transaction_type)}
                                            </div>
                                            <span className="capitalize">{transaction.transaction_type}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">{formatDate(transaction.transaction_date)}</td>
                                    <td className="py-4">{transaction.payment_method}</td>
                                    <td className="py-4 font-mono text-sm">{transaction.transaction_id}</td>
                                    <td className="py-4 text-right font-semibold">{transaction.amount}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-4 text-center text-slate-400">
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
