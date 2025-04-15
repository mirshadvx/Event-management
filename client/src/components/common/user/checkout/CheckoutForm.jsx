import React, { useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "@/services/api";

const CheckoutForm = ({ plan, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

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
                {processing ? "Processing..." : `Pay ${Number(plan.price).toFixed(2)}`}
            </button>
        </form>
    );
};

export default CheckoutForm;
