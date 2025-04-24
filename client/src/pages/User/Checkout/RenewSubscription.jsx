import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, Wallet } from "lucide-react";
import api from "@/services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import { HashLoader } from "react-spinners";
import RenewForm from "@/components/common/user/checkout/RenewForm";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const RenewSubscription = () => {
    const [plan, setPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("wallet");
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const [wallet_balance, SetWalletBalance] = useState();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user && !userLoading) {
            dispatch(get_ProfileData());
        }
    }, [user, userLoading, dispatch]);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setIsLoading(true);
                const response = await api.get("users/renew-subscription/");
                if (response.data.success) {
                    setPlan(response.data.plan);
                    setCurrentPlan(response.data.current_plan);
                    SetWalletBalance(response.data.wallet_balance);
                    if (!currentPlan.expired) {
                        setError(
                            `Your current subscription is active until ${currentPlan.end_date}. Renewing now will extend your access beyond this date.`
                        );
                    }
                } else {
                    setError(response.data.error || "Failed to load subscription plan");
                }
            } catch (err) {
                setError("Failed to load subscription plan");
                console.error("Error fetching plan:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, []);

    const handleWalletPayment = async () => {
        if (currentPlan && !currentPlan.expired) {
            toast.error("Your subscription is still active. Please wait until it expires to renew.", {
                position: "top-right",
                duration: 3000,
                style: {
                    background: "rgba(100, 20, 20, 0.68)",
                    color: "#FEE2E2",
                    border: "1px solid rgba(239, 68, 68, 0.5)",
                },
            });
            return;
        }
        try {
            setIsProcessing(true);
            setError(null);
            const response = await api.post("/users/subscription-checkout/", {
                plan_id: plan.id,
                payment_method: "wallet",
            });

            if (response.data.success) {
                dispatch(get_ProfileData());
                setSuccess(true);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred during payment");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = () => {
        setSuccess(true);
    };

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
                            Subscription Renewed!
                        </h2>

                        <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent my-6"></div>

                        <p className="text-lg text-indigo-100 mb-6 text-center">
                            Thank you for renewing your subscription. Your premium access has been successfully extended.
                        </p>
                        <div className="w-full bg-indigo-800/30 rounded-xl p-4 mb-6">
                            <h3 className="text-indigo-300 font-medium mb-3">Order Details</h3>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-indigo-200">Plan</span>
                                <span className="text-white font-medium">{plan?.name || "Premium Plan"}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-indigo-200">Billing Cycle</span>
                                <span className="text-white font-medium">30 Days</span>
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
                <h1 className="text-3xl font-bold mb-4">Renew Subscription</h1>
                {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-lg mb-3">{error}</div>}
                {currentPlan && (
                    <div className="bg-indigo-800/30 px-4 py-2 rounded-lg mb-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-medium text-indigo-300">Current Plan: {currentPlan.name}</h2>
                                <p className="text-indigo-200">
                                    {currentPlan.expired ? "Expired" : `Expires in ${currentPlan.days_remaining} days`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {userLoading || isLoading ? (
                    <div className="h-[50vh] flex items-center justify-center">
                        <HashLoader color="#54c955" size={60} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4">Plan Details</h2>
                                {plan ? (
                                    <div className="relative rounded-lg p-5 bg-green-500/20 border-2 border-green-500">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-medium">{plan.name}</h3>
                                            <span className="text-green-400 text-lg font-semibold">
                                                {Number(plan.price).toFixed(2)} / 30 days
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
                                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-gray-500 mr-2" />
                                                    )}
                                                    <span className={plan[feature.key] ? "text-gray-200" : "text-gray-500"}>
                                                        {feature.name}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-red-200">No plan available for renewal.</p>
                                )}
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

                                {plan && (
                                    <>
                                        {paymentMethod === "stripe" && (
                                            <Elements stripe={stripePromise}>
                                                {/* <RenewForm plan={plan} onSuccess={handlePaymentSuccess} isExpired={currentPlan.expired}/> */}
                                                <RenewForm
                                                    plan={plan}
                                                    onSuccess={handlePaymentSuccess}
                                                    currentPlan={currentPlan}
                                                />
                                            </Elements>
                                        )}

                                        {paymentMethod === "wallet" && (
                                            <div className="space-y-4">
                                                {user && (
                                                    <div className="bg-indigo-800/40 p-4 rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-indigo-200">Wallet Balance</span>
                                                            <span className="text-green-400 font-semibold">
                                                                {Number(wallet_balance || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={handleWalletPayment}
                                                    disabled={
                                                        isProcessing || (user && user.wallet_balance < Number(plan.price))
                                                    }
                                                    className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <div className="flex items-center justify-center">
                                                            <HashLoader size={24} color="#000000" />
                                                            <span className="ml-2">Processing...</span>
                                                        </div>
                                                    ) : user && user.wallet_balance < Number(plan.price) ? (
                                                        "Insufficient Balance"
                                                    ) : (
                                                        `Pay ${Number(plan.price).toFixed(2)}`
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        <div className="mt-8 pt-6 border-t border-indigo-800">
                                            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">{plan.name}</span>
                                                    <span>{Number(plan.price).toFixed(2)} / 30 days</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between pt-4 border-t border-indigo-800">
                                                <span className="font-bold text-lg">Total</span>
                                                <span className="font-bold text-lg text-green-400">
                                                    {Number(plan.price).toFixed(2)} / 30 days
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

export default RenewSubscription;
