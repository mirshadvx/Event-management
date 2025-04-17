import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, Wallet } from "lucide-react";
import api from "@/services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import CheckoutForm from "@/components/common/user/checkout/CheckoutForm";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import { HashLoader } from "react-spinners";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const UpgragePremium = () => {
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("wallet");
    const [Loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { user, loading } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user && !loading) {
            dispatch(get_ProfileData());
        }
    }, [user, loading, dispatch]);

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

    useEffect(() => {
        const UpgradePlanData = async () => {
            try {
                setLoading(true);
                const response = await api.get("/users/subscription-upgrade/");
                console.log(response);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        UpgradePlanData();
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

    const selectedPlanData = plans.find((p) => p.id === selectedPlan);

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-indigo-900/40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-indigo-700/30">
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={48} className="text-green-400" />
                            </div>
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="rgba(34, 197, 94, 0.2)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="8"
                                    strokeDasharray="283"
                                    strokeDashoffset="283"
                                    className="animate-circle-draw"
                                />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent">
                            Subscription Activated!
                        </h2>

                        <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-6"></div>

                        <p className="text-lg text-indigo-100 mb-6 text-center">
                            Thank you for your purchase. Your premium access has been successfully activated.
                        </p>
                        <div className="w-full bg-indigo-800/30 rounded-xl p-4 mb-6">
                            <h3 className="text-indigo-300 font-medium mb-3">Order Details</h3>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-indigo-200">Plan</span>
                                <span className="text-white font-medium">{selectedPlanData?.name || "Premium Plan"}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-indigo-200">Billing Cycle</span>
                                <span className="text-white font-medium">Monthly</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-indigo-200">Next Billing Date</span>
                                <span className="text-white font-medium">
                                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center"
                                onClick={() => navigate("/")}
                            >
                                Back to Home
                            </button>
                        </div>
                        <style jsx>{`
                            @keyframes circle-draw {
                                to {
                                    stroke-dashoffset: 0;
                                }
                            }
                            .animate-circle-draw {
                                animation: circle-draw 1s ease-out forwards;
                            }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

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
                <h1 className="text-3xl font-bold mb-8">Upgrade plan to Premium</h1>

                {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-6">{error}</div>}
                {Loading || loading ? (
                    <div className="h-[50vh] flex items-center justify-center">
                        <HashLoader color="#54c955" size={60} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4">Select a Plan</h2>
                                <div className="space-y-4">
                                    {plans
                                        .filter((plan) => plan.name === "premium")
                                        .map((plan) => (
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
                                        <p className="text-xs text-gray-300 text-center mt-1">
                                            Pay with your digital wallet
                                        </p>
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
                                                disabled={Loading}
                                                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {Loading
                                                    ? "Processing..."
                                                    : `Pay ${Number(selectedPlanData.price).toFixed(2)}`}
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
                )}
            </div>
        </div>
    );
};

export default UpgragePremium;
