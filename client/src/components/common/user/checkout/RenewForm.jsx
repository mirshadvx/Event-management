import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "@/services/api";
import { useDispatch } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import { HashLoader } from "react-spinners";
import { toast } from "sonner";

const RenewForm = ({ plan, onSuccess, currentPlan }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const dispatch = useDispatch();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        if (currentPlan && !currentPlan.expired) {
            setError("Your subscription is still active. Please wait until it expires to renew.");
            setProcessing(false);
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

        if (!stripe || !elements) {
            setError("Payment system not initialized");
            setProcessing(false);
            return;
        }

        try {
            const intentResponse = await api.post("/users/subscription-checkout/", {
                plan_id: plan.id,
                payment_method: "stripe",
                create_intent: true,
            });

            if (!intentResponse.data.success) {
                setError(intentResponse.data.message);
                setProcessing(false);
                return;
            }

            const result = await stripe.confirmCardPayment(intentResponse.data.client_secret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: "Customer",
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
                return;
            }

            const confirmationResponse = await api.post("/users/subscription-checkout/", {
                plan_id: plan.id,
                payment_method: "stripe",
                payment_intent_id: result.paymentIntent.id,
            });

            if (confirmationResponse.data.success) {
                dispatch(get_ProfileData());
                onSuccess();
            } else {
                setError(confirmationResponse.data.message);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "An error occurred during payment";
            setError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-white/10 rounded-lg">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#ffffff",
                                "::placeholder": {
                                    color: "#aab7c4",
                                },
                            },
                            invalid: {
                                color: "#ef4444",
                            },
                        },
                    }}
                />
            </div>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">{error}</div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
                {processing ? (
                    <div className="flex items-center justify-center">
                        <HashLoader size={24} color="#000000" />
                        <span className="ml-2">Processing...</span>
                    </div>
                ) : (
                    `Pay ${Number(plan.price).toFixed(2)}`
                )}
            </button>
        </form>
    );
};

export default RenewForm;
