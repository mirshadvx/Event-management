import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "@/services/api";
import { useDispatch } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import { HashLoader } from "react-spinners";

const UpgradeFormStripe = ({ plan, amount, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const dispatch = useDispatch();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError(null);

        if (!stripe || !elements) {
            setError("Payment system not initialized");
            setProcessing(false);
            return;
        }

        try {
            const intentResponse = await api.post("/users/subscription-upgrade/", {
                payment_method: "stripe",
                create_intent: true,
            });

            if (intentResponse.data.transaction_id === "zero_cost") {
                onSuccess();
                dispatch(get_ProfileData());
                setProcessing(false);
                return;
            }

            if (!intentResponse.data.success || !intentResponse.data.client_secret) {
                setError(intentResponse.data.message || "Failed to create payment intent");
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

            const confirmationResponse = await api.post("/users/subscription-upgrade/", {
                payment_method: "stripe",
                payment_intent_id: result.paymentIntent.id,
            });

            if (confirmationResponse.data.success) {
                onSuccess();
                dispatch(get_ProfileData());
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
            <CardElement
                className="bg-white/10 p-4 rounded-lg text-white"
                options={{
                    style: {
                        base: {
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
            {error && <div className="text-red-500">{error}</div>}
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
                    `Pay ${amount ? Number(amount).toFixed(2) : "0.00"}`
                )}
            </button>
        </form>
    );
};

export default UpgradeFormStripe;