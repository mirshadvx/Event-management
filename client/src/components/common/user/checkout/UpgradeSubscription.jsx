import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

const UpgradeSubscription = () => {
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("wallet");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);
                const response = await api.get("/users/subscription-checkout/");
                if (response.data.success) {
                    setPlans(response.data.plans);
                    if (response.data.plans.length > 0) {
                        setSelectedPlan(response.data.plans[0].id);
                    }
                } else {
                    setError(response.data.message);
                }
            } catch (err) {
                setError("Failed to load subscription plans");
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleWalletPayment = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post("/users/subscription-checkout/", {
                plan_id: selectedPlan,
                payment_method: "wallet",
            });

            if (response.data.success) {
                setSuccess(true);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred during payment");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setSuccess(true);
    };

    if (loading && plans.length === 0) {
        return (
            <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
                <p className="text-white">Loading plans...</p>
            </div>
        );
    }

    const selectedPlanData = plans.find((p) => p.id === selectedPlan);
    return (
        <div className="min-h-screen bg-indigo-950 text-white py-8 px-4 md:px-8">
            <div className="max-w-6xl mx-auto mb-6">
                <button
                    className="flex items-center text-white hover:text-green-400 transition-colors"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft size={20} className="mr-2" />
                    <span>Back</span>
                </button>
            </div>

            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Choose Your Subscription</h1>

                {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-6">{error}</div>}

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-xl font-semibold mb-4">Select a Plan</h2>
                            <div className="space-y-4">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`relative rounded-lg p-5 cursor-pointer transition-all ${
                                            selectedPlan === plan.id
                                                ? "bg-green-500/20 border-2 border-green-500"
                                                : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                                        }`}
                                        onClick={() => setSelectedPlan(plan.id)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-medium">{plan.name}</h3>
                                            <span className="text-green-400 text-lg font-semibold">
                                                {Number(plan.price).toFixed(2)} /mo
                                            </span>
                                        </div>
                                        <ul className="space-y-2">
                                            {[
                                                { key: "email_notification", name: "Email Notification" },
                                                { key: "group_chat", name: "Group Chat" },
                                                { key: "personal_chat", name: "Personal Chat" },
                                                { key: "advanced_analytics", name: "Advanced Analytics" },
                                                { key: "ticket_scanning", name: "Ticket Scanning" },
                                                { key: "live_streaming", name: "Live Streaming" },
                                            ].map((feature) => (
                                                <li key={feature.key} className="flex items-center text-sm">
                                                    {plan[feature.key] ? (
                                                        <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                                                    ) : (
                                                        <XCircle className="w-6 h-6 text-gray-500 mr-2" />
                                                    )}
                                                    <span
                                                        className={
                                                            plan[feature.key]
                                                                ? "text-gray-200 text-lg"
                                                                : "text-gray-500 text-lg"
                                                        }
                                                    >
                                                        {feature.name}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div
                                    className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all ${
                                        paymentMethod === "wallet"
                                            ? "bg-green-500/20 border-2 border-green-500"
                                            : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                                    }`}
                                    onClick={() => setPaymentMethod("wallet")}
                                >
                                    <Wallet size={24} className="text-green-400 mb-2" />
                                    <h3 className="font-medium">Wallet</h3>
                                    <p className="text-xs text-gray-300 text-center mt-1">Pay with your digital wallet</p>
                                </div>
                                <div
                                    className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all ${
                                        paymentMethod === "stripe"
                                            ? "bg-green-500/20 border-2 border-green-500"
                                            : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                                    }`}
                                    onClick={() => setPaymentMethod("stripe")}
                                >
                                    <CreditCard size={24} className="text-green-400 mb-2" />
                                    <h3 className="font-medium">Stripe</h3>
                                    <p className="text-xs text-gray-300 text-center mt-1">Pay with credit/debit card</p>
                                </div>
                            </div>

                            {selectedPlan && selectedPlanData && (
                                <>
                                    {paymentMethod === "stripe" && (
                                        <Elements stripe={stripePromise}>
                                            <CheckoutForm plan={selectedPlanData} onSuccess={handlePaymentSuccess} />
                                        </Elements>
                                    )}

                                    {paymentMethod === "wallet" && (
                                        <button
                                            onClick={handleWalletPayment}
                                            disabled={loading}
                                            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {loading ? "Processing..." : `Pay ${Number(selectedPlanData.price).toFixed(2)}`}
                                        </button>
                                    )}

                                    <div className="mt-8 pt-6 border-t border-indigo-800">
                                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300">{selectedPlanData.name}</span>
                                                <span>{Number(selectedPlanData.price).toFixed(2)} /mo</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between pt-4 border-t border-indigo-800">
                                            <span className="font-bold text-lg">Total</span>
                                            <span className="font-bold text-lg text-green-400">
                                                {Number(selectedPlanData.price).toFixed(2)} /mo
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeSubscription;
