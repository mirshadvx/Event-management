import React, { useState, useEffect } from "react";
import { 
    Users, 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw
} from "lucide-react";
import api from "@/services/api";

const AdminSubscriptionDashboard = () => {
    const [stats, setStats] = useState({
        total_subscriptions: 0,
        active_subscriptions: 0,
        expired_subscriptions: 0,
        total_revenue: 0,
        monthly_revenue: 0,
    });
    const [recentSubscriptions, setRecentSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch subscription statistics
            const statsResponse = await api.get('/admin/subscription-stats/');
            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }

            // Fetch recent subscriptions
            const recentResponse = await api.get('/admin/recent-subscriptions/');
            if (recentResponse.data.success) {
                setRecentSubscriptions(recentResponse.data.subscriptions);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const resetMonthlyCounters = async () => {
        try {
            const response = await api.post('/admin/reset-subscription-counters/');
            if (response.data.success) {
                alert('Monthly counters reset successfully');
                fetchDashboardData();
            }
        } catch (err) {
            console.error('Error resetting counters:', err);
            alert('Failed to reset counters');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="text-white text-xl">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Subscription Dashboard</h1>
                    <button
                        onClick={resetMonthlyCounters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset Monthly Counters
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-blue-400" />
                            <div className="ml-4">
                                <p className="text-slate-400 text-sm">Total Subscriptions</p>
                                <p className="text-white text-2xl font-bold">{stats.total_subscriptions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-lg">
                        <div className="flex items-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                            <div className="ml-4">
                                <p className="text-slate-400 text-sm">Active</p>
                                <p className="text-white text-2xl font-bold">{stats.active_subscriptions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-lg">
                        <div className="flex items-center">
                            <XCircle className="w-8 h-8 text-red-400" />
                            <div className="ml-4">
                                <p className="text-slate-400 text-sm">Expired</p>
                                <p className="text-white text-2xl font-bold">{stats.expired_subscriptions}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-lg">
                        <div className="flex items-center">
                            <DollarSign className="w-8 h-8 text-yellow-400" />
                            <div className="ml-4">
                                <p className="text-slate-400 text-sm">Total Revenue</p>
                                <p className="text-white text-2xl font-bold">${stats.total_revenue}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-6 rounded-lg">
                        <div className="flex items-center">
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                            <div className="ml-4">
                                <p className="text-slate-400 text-sm">Monthly Revenue</p>
                                <p className="text-white text-2xl font-bold">${stats.monthly_revenue}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Subscriptions */}
                <div className="bg-slate-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Recent Subscriptions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-slate-400 border-b border-slate-700">
                                    <th className="pb-4">User</th>
                                    <th className="pb-4">Plan</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Start Date</th>
                                    <th className="pb-4">End Date</th>
                                    <th className="pb-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSubscriptions.map((subscription) => (
                                    <tr key={subscription.id} className="border-b border-slate-700">
                                        <td className="py-4 text-white">{subscription.user}</td>
                                        <td className="py-4 text-white capitalize">{subscription.plan.name}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                subscription.is_active 
                                                    ? 'bg-green-500/20 text-green-400' 
                                                    : 'bg-red-500/20 text-red-400'
                                            }`}>
                                                {subscription.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-slate-300">
                                            {new Date(subscription.start_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-slate-300">
                                            {new Date(subscription.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-white">${subscription.plan.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSubscriptionDashboard;
