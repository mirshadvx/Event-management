import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, Wallet } from "lucide-react";
import api from "@/services/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ plan, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    try {
    
      const { data } = await api.post("/users/subscription-checkout/", {
        plan_id: plan.id,
        payment_method: "stripe",
        create_intent: true 
      });

      const result = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === "succeeded") {
       
        const response = await api.post("/users/subscription-checkout/", {
          plan_id: plan.id,
          payment_method: "stripe",
          payment_intent_id: result.paymentIntent.id,
        });
        if (response.data.success) {
          onSuccess();
        }
      }
    } catch (err) {
      setError("An error occurred during payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement className="bg-white/10 p-4 rounded-lg text-white" />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg mt-6 transition-colors disabled:opacity-50"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const SubscriptionCheckout = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await api.get("users/subscription-checkout/");
        if (response.data.success) {
          setPlans(response.data.plans);
          setSelectedPlan(response.data.plans[0]?.id);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleWalletPayment = async () => {
    try {
      setLoading(true);
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
      setError("An error occurred during payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <p className="text-white">Loading plans...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="text-white text-center">
          <Check size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Subscription Activated!</h2>
          <p className="mt-2">Thank you for your purchase.</p>
        </div>
      </div>
    );
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-indigo-950 text-white py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto mb-6">
        <button className="flex items-center text-white hover:text-green-400 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Choose Your Subscription</h1>

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
                        ${Number(plan.price).toFixed(2)} /mo
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check size={16} className="text-green-400 mt-1 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
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

              {paymentMethod === "stripe" && selectedPlanData && (
                <Elements stripe={stripePromise}>
                  <CheckoutForm plan={selectedPlanData} onSuccess={handlePaymentSuccess} />
                </Elements>
              )}

              {error && <div className="text-red-500 mb-4">{error}</div>}

              {selectedPlanData && (
                <div className="mt-8 pt-6 border-t border-indigo-800">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{selectedPlanData.name}</span>
                      <span>${Number(selectedPlanData.price).toFixed(2)} /mo</span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-indigo-800">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-green-400">
                      ${Number(selectedPlanData.price).toFixed(2)} /mo
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <button
                  onClick={handleWalletPayment}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg mt-6 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Complete Subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;

// import React, { useEffect, useState } from "react";
// import { ArrowLeft, Check, CreditCard, Wallet } from "lucide-react";
// import api from "@/services/api";

// const SubscriptionCheckout = () => {
//     const [plans, setPlans] = useState([]);
//     const [selectedPlan, setSelectedPlan] = useState(null);
//     const [paymentMethod, setPaymentMethod] = useState("wallet");
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchPlans = async () => {
//             try {
//                 setLoading(true);
//                 const response = await api.get("users/subscription-checkout/");
//                 if (response.data.success) {
//                     setPlans(response.data.plans);
//                     setSelectedPlan(response.data.plans[0]?.name);
//                 }
//             } catch (err) {
//                 console.error("Error fetching plans:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchPlans();
//     }, []);

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
//                 <p className="text-white">Loading plans...</p>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-indigo-950 text-white py-8 px-4 md:px-8">
//             {/* Back Button */}
//             <div className="max-w-6xl mx-auto mb-6">
//                 <button className="flex items-center text-white hover:text-green-400 transition-colors">
//                     <ArrowLeft size={20} className="mr-2" />
//                     <span>Back</span>
//                 </button>
//             </div>

//             <div className="max-w-6xl mx-auto">
//                 <h1 className="text-3xl font-bold mb-8">Choose Your Subscription</h1>

//                 <div className="grid md:grid-cols-2 gap-8">
//                     {/* Left Column - Plan Selection */}
//                     <div className="space-y-6">
//                         <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
//                             <h2 className="text-xl font-semibold mb-4">Select a Plan</h2>

//                             <div className="space-y-4">
//                                 {plans.map((plan) => (
//                                     <div
//                                         key={plan.id}
//                                         className={`relative rounded-lg p-5 cursor-pointer transition-all ${
//                                             selectedPlan === plan.name
//                                                 ? "bg-green-500/20 border-2 border-green-500"
//                                                 : "bg-white/5 border-2 border-transparent hover:bg-white/10"
//                                         }`}
//                                         onClick={() => setSelectedPlan(plan.name)}
//                                     >
//                                         <div className="flex justify-between items-start mb-3">
//                                             <div className="flex items-center">
//                                                 <h3 className="text-lg font-medium">{plan.name}</h3>
//                                             </div>
//                                             <span className="text-green-400 text-lg font-semibold">
//                                                 {Number(plan.price).toFixed(2)} /mo
//                                             </span>
//                                         </div>

//                                         <ul className="space-y-2">
//                                             {plan.features.map((feature, index) => (
//                                                 <li key={index} className="flex items-start">
//                                                     <Check size={16} className="text-green-400 mt-1 mr-2 flex-shrink-0" />
//                                                     <span>{feature}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right Column - Payment Details */}
//                     <div className="space-y-6">
//                         <div className="bg-indigo-900/30 rounded-xl p-6 backdrop-blur-sm">
//                             <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

//                             <div className="grid grid-cols-2 gap-4 mb-6">
//                                 <div
//                                     className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all ${
//                                         paymentMethod === "wallet"
//                                             ? "bg-green-500/20 border-2 border-green-500"
//                                             : "bg-white/5 border-2 border-transparent hover:bg-white/10"
//                                     }`}
//                                     onClick={() => setPaymentMethod("wallet")}
//                                 >
//                                     <Wallet size={24} className="text-green-400 mb-2" />
//                                     <h3 className="font-medium">Wallet</h3>
//                                     <p className="text-xs text-gray-300 text-center mt-1">Pay with your digital wallet</p>
//                                 </div>

//                                 <div
//                                     className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all ${
//                                         paymentMethod === "stripe"
//                                             ? "bg-green-500/20 border-2 border-green-500"
//                                             : "bg-white/5 border-2 border-transparent hover:bg-white/10"
//                                     }`}
//                                     onClick={() => setPaymentMethod("stripe")}
//                                 >
//                                     <CreditCard size={24} className="text-green-400 mb-2" />
//                                     <h3 className="font-medium">Stripe</h3>
//                                     <p className="text-xs text-gray-300 text-center mt-1">Pay with credit/debit card</p>
//                                 </div>
//                             </div>

//                             {/* Stripe Payment Form */}
//                             {paymentMethod === "stripe" && <></>}

//                             {/* Order Summary */}
//                             {selectedPlan && (
//                                 <div className="mt-8 pt-6 border-t border-indigo-800">
//                                     <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

//                                     <div className="space-y-2 mb-4">
//                                         <div className="flex justify-between">
//                                             <span className="text-gray-300">
//                                                 {plans.find((p) => p.name.toLowerCase() === selectedPlan)?.name}
//                                             </span>
//                                             <span>
//                                                 $
//                                                 {Number(
//                                                     plans.find((p) => p.name.toLowerCase() === selectedPlan)?.price
//                                                 ).toFixed(2)}
//                                                 /mo
//                                             </span>
//                                         </div>
//                                     </div>

//                                     <div className="flex justify-between pt-4 border-t border-indigo-800">
//                                         <span className="font-bold text-lg">Total</span>
//                                         <span className="font-bold text-lg text-green-400">
//                                             $
//                                             {Number(
//                                                 plans.find((p) => p.name.toLowerCase() === selectedPlan)?.price
//                                             ).toFixed(2)}
//                                             /mo
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             <button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 px-4 rounded-lg mt-6 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-indigo-900">
//                                 Complete Subscription
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SubscriptionCheckout;


// <div className="space-y-4">
//     <div>
//         <label htmlFor="card-name" className="block text-sm font-medium mb-2">
//             Cardholder Name
//         </label>
//         <input
//             type="text"
//             id="card-name"
//             className="w-full bg-white/10 border border-indigo-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
//             placeholder="John Doe"
//         />
//     </div>
//     <div>
//         <label htmlFor="card-number" className="block text-sm font-medium mb-2">
//             Card Number
//         </label>
//         <input
//             type="text"
//             id="card-number"
//             className="w-full bg-white/10 border border-indigo-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
//             placeholder="1234 5678 9012 3456"
//         />
//     </div>
//     <div className="grid grid-cols-2 gap-4">
//         <div>
//             <label htmlFor="card-expiry" className="block text-sm font-medium mb-2">
//                 Expiry Date
//             </label>
//             <input
//                 type="text"
//                 id="card-expiry"
//                 className="w-full bg-white/10 border border-indigo-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
//                 placeholder="MM/YY"
//             />
//         </div>
//         <div>
//             <label htmlFor="card-cvv" className="block text-sm font-medium mb-2">
//                 CVV
//             </label>
//             <input
//                 type="text"
//                 id="card-cvv"
//                 className="w-full bg-white/10 border border-indigo-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
//                 placeholder="123"
//             />
//         </div>
//     </div>
// </div>;
