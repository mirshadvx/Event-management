import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Wallet,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  X,
  ShoppingCart,
  Tag,
  ChevronRight,
  Lock,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Confetti from "react-confetti-boom";
import SubscriptionErrorHandler from "@/components/common/SubscriptionErrorHandler";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({
  handlePayment,
  total,
  eventTitle,
  setPaymentStatus,
  setCouponError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const STRIPE_MINIMUM_AMOUNT = 50;
  const isBelowMinimum = total < STRIPE_MINIMUM_AMOUNT;

  const formatINR = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isBelowMinimum) return;

    setProcessing(true);
    setPaymentStatus("processing");

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
      });

      if (error) {
        setCardError(error.message);
        setPaymentStatus("error");
        setCouponError(error.message);
        setProcessing(false);
        return;
      }

      const response = await handlePayment(paymentMethod.id);

      if (response.requires_action) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          response.payment_intent_client_secret
        );
        if (confirmError) {
          setCardError(confirmError.message);
          setPaymentStatus("error");
          setCouponError(confirmError.message);
        } else {
          setPaymentStatus("success");
        }
      } else if (response.message === "Payment successful!") {
        setPaymentStatus("success");
      }
    } catch (error) {
      setCardError(error.message || "An error occurred");
      setPaymentStatus("error");
      setCouponError(error.message || "Payment failed.");
    } finally {
      setProcessing(false);
    }
  };

  const inputStyle = {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: {
      color: "#9e2146",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          className={cn(
            "block text-sm font-medium mb-1",
            processing ? "text-gray-400" : "text-gray-700"
          )}
        >
          Card Number
        </label>
        <CardNumberElement
          options={{ style: inputStyle }}
          className={cn(
            "border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2",
            processing
              ? "bg-gray-200 border-gray-300"
              : "bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={cn(
              "block text-sm font-medium mb-1",
              processing ? "text-gray-400" : "text-gray-700"
            )}
          >
            Expiry Date
          </label>
          <CardExpiryElement
            options={{ style: inputStyle }}
            className={cn(
              "border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2",
              processing
                ? "bg-gray-200 border-gray-300"
                : "bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            )}
          />
        </div>
        <div>
          <label
            className={cn(
              "block text-sm font-medium mb-1",
              processing ? "text-gray-400" : "text-gray-700"
            )}
          >
            CVV
          </label>
          <CardCvcElement
            options={{ style: inputStyle }}
            className={cn(
              "border rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2",
              processing
                ? "bg-gray-200 border-gray-300"
                : "bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            )}
          />
        </div>
      </div>
      {cardError && <p className="text-red-600 text-sm">{cardError}</p>}
      {isBelowMinimum && (
        <p className="text-red-600 text-sm">
          Payment amount is too small. Stripe requires a minimum payment of ₹{STRIPE_MINIMUM_AMOUNT}.00 
          (approximately $0.50 USD equivalent). Please add more items to your order.
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing || isBelowMinimum}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-medium transition-colors",
          processing || isBelowMinimum
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        {processing ? "Processing..." : `Pay ${formatINR(total)}`}
      </button>
    </form>
  );
};

function CheckoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const selectedTickets = useSelector(
    (state) => state.tickets.selectedTickets[eventId] || {}
  );
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [processingCoupon, setProcessingCoupon] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  const [subscriptionError, setSubscriptionError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/event/preview-explore/${eventId}/`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    handleWindowSize();

    window.addEventListener("resize", handleWindowSize);

    return () => {
      window.removeEventListener("resize", handleWindowSize);
    };
  }, []);

  // useEffect(() => {
  //     if (windowSize.width && windowSize.height) {
  //         console.log("window sizes:", windowSize);
  //     }
  // }, [windowSize]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const formatINR = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const calculateTotal = () => {
    if (!event?.tickets) return { subtotal: 0, discount: 0, total: 0 };
    const subtotal = event.tickets.reduce((total, ticket) => {
      const count = selectedTickets[ticket.ticket_type] || 0;
      return total + count * parseFloat(ticket.price);
    }, 0);

    let discount = 0;
    if (couponApplied) {
      discount = couponApplied.discount;
    }

    return { subtotal, discount, total: subtotal - discount };
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const applyCoupon = async () => {
    setCouponError("");
    setProcessingCoupon(true);
    try {
      const response = await api.post("/users/apply-coupon/", {
        coupon_code: couponCode,
        event_id: eventId,
        ...selectedTickets,
      });
      setCouponApplied({
        code: response.data.code,
        discount: response.data.discount,
      });
      setCouponCode("");
    } catch (error) {
      setCouponError(error.response?.data?.error || "Error applying coupon.");
    } finally {
      setProcessingCoupon(false);
    }
  };

  const stripeHandlePayment = async (stripePaymentMethodId) => {
    try {
      const response = await api.post("/users/checkout/", {
        event_id: eventId,
        payment_method: "stripe",
        coupon_code: couponApplied?.code || "",
        selected_tickets: selectedTickets,
        stripe_payment_method_id: stripePaymentMethodId,
      });
      return response.data;
    } catch (error) {
      console.log(error);
      // Handle subscription-related errors
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.subscription_required) {
          setSubscriptionError({
            subscriptionRequired: true,
            message: errorData.message,
          });
        } else if (errorData.subscription_expired) {
          setSubscriptionError({
            subscriptionExpired: true,
            message: errorData.message,
            expiredDate: errorData.expired_date,
          });
        } else if (errorData.subscription_limit_reached) {
          setSubscriptionError({
            limitReached: true,
            message: errorData.message,
            currentUsage: errorData.current_usage,
            limit: errorData.limit,
          });
        }
      }
      throw error;
    }
  };

  const handlePayment = async (stripePaymentMethodId) => {
    setPaymentStatus("processing");
    try {
      if (paymentMethod === "wallet") {
        const response = await api.post("/users/checkout/", {
          event_id: eventId,
          payment_method: "wallet",
          coupon_code: couponApplied?.code || "",
          selected_tickets: selectedTickets,
        });
        setPaymentStatus("success");
      } else if (paymentMethod === "stripe") {
        return await stripeHandlePayment(stripePaymentMethodId);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      
      // Handle subscription-related errors for wallet payments too
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.subscription_required) {
          setSubscriptionError({
            subscriptionRequired: true,
            message: errorData.message,
          });
        } else if (errorData.subscription_expired) {
          setSubscriptionError({
            subscriptionExpired: true,
            message: errorData.message,
            expiredDate: errorData.expired_date,
          });
        } else if (errorData.subscription_limit_reached) {
          setSubscriptionError({
            limitReached: true,
            message: errorData.message,
            currentUsage: errorData.current_usage,
            limit: errorData.limit,
          });
        }
      } else {
        setCouponError(error.response?.data?.error || "Payment failed.");
      }
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  const hasTickets = Object.values(selectedTickets).some((count) => count > 0);
  const priceDetails = calculateTotal();
  const getTotalTicketsCount = () =>
    Object.values(selectedTickets).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4",
              isDarkMode ? "border-blue-400" : "border-blue-600"
            )}
          ></div>
          <p
            className={cn(
              "font-medium",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}
          >
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        <div
          className={cn(
            "max-w-md w-full p-8 rounded-xl shadow-lg text-center",
            isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          )}
        >
          <X
            size={48}
            className={cn(
              "mx-auto mb-6",
              isDarkMode ? "text-red-400" : "text-red-500"
            )}
          />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p
            className={cn(
              "mb-6",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}
          >
            We couldn't find the event you're looking for.
          </p>
          <button
            onClick={() => navigate("/events")}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-colors",
              isDarkMode
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  if (!hasTickets) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        <div
          className={cn(
            "max-w-md w-full p-8 rounded-xl shadow-lg text-center",
            isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          )}
        >
          <ShoppingCart
            size={48}
            className={cn(
              "mx-auto mb-6",
              isDarkMode ? "text-blue-400" : "text-blue-500"
            )}
          />
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p
            className={cn(
              "mb-6",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}
          >
            Please select tickets before proceeding to checkout.
          </p>
          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium transition-colors",
              isDarkMode
                ? "bg-blue-700 hover:bg-blue-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            <ArrowLeft size={20} /> Back to Event
          </button>
        </div>
      </div>
    );
  }

  function handleWindowSize() {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    console.log("immediate window sizes:", {
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  if (paymentStatus === "success") {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        )}
      >
        {/* <Confetti mode="boom" particleCount={100} width={windowSize.width} height={windowSize.height} shapeSize={15} color={['#ff577f', '#ff884b', '#ffd384', '#fff9b0']}/> */}
        <Confetti
          mode="fall"
          particleCount={170}
          width={windowSize.width}
          height={windowSize.height}
          shapeSize={20}
          colors={["#ff577f", "#ff884b", "#ffd384", "#fff9b0", "#4CAF50"]}
          // x={0.5}
          // y={0.4}
          // power={0.8}
          power={1}
          spread={300}
        />
        <div
          className={cn(
            "max-w-md w-full p-8 rounded-xl shadow-lg text-center",
            isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          )}
        >
          <CheckCircle
            size={40}
            className={cn(
              "mx-auto mb-3",
              isDarkMode ? "text-green-400" : "text-green-600"
            )}
          />
          <p
            className={cn(
              "text-lg font-bold",
              isDarkMode ? "text-green-300" : "text-green-800"
            )}
          >
            Payment Successful!
          </p>
          <p
            className={cn(
              "mb-4",
              isDarkMode ? "text-green-400" : "text-green-700"
            )}
          >
            Your tickets have been booked.
          </p>
          <button
            onClick={() => navigate("/")}
            className={cn(
              "py-2 px-6 rounded-lg transition-colors w-full font-medium",
              isDarkMode
                ? "bg-green-700 hover:bg-green-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            Back To Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      {/* Subscription Error Handler */}
      {subscriptionError && (
        <SubscriptionErrorHandler
          error={subscriptionError.message}
          onClose={() => setSubscriptionError(null)}
          onRetry={() => setSubscriptionError(null)}
          subscriptionRequired={subscriptionError.subscriptionRequired}
          subscriptionExpired={subscriptionError.subscriptionExpired}
          limitReached={subscriptionError.limitReached}
          currentUsage={subscriptionError.currentUsage}
          limit={subscriptionError.limit}
          type="event"
        />
      )}
      
      <div
        className={cn(
          "min-h-screen flex flex-col",
          isDarkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"
        )}
      >
        {/* Top Progress Bar */}
        <div
          className={cn(
            "border-b shadow-sm",
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          )}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className={cn(
                    "mr-4 transition-colors",
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Secure Checkout</h1>
              </div>
              <div className="hidden sm:flex items-center">
                <div
                  className={cn(
                    "flex items-center",
                    checkoutStep > 1
                      ? isDarkMode
                        ? "text-green-400"
                        : "text-green-600"
                      : isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      checkoutStep > 1
                        ? isDarkMode
                          ? "bg-green-900/50"
                          : "bg-green-100"
                        : isDarkMode
                        ? "bg-blue-900/50"
                        : "bg-blue-100"
                    )}
                  >
                    <ShoppingCart size={16} />
                  </div>
                  <span className="ml-2 font-medium">Review</span>
                </div>
                <div
                  className={cn(
                    "w-16 h-px mx-2",
                    isDarkMode ? "bg-gray-700" : "bg-gray-300"
                  )}
                ></div>
                <div
                  className={cn(
                    "flex items-center",
                    checkoutStep === 2
                      ? isDarkMode
                        ? "text-blue-400"
                        : "text-blue-600"
                      : isDarkMode
                      ? "text-gray-500"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      checkoutStep === 2
                        ? isDarkMode
                          ? "bg-blue-900/50"
                          : "bg-blue-100"
                        : isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-100"
                    )}
                  >
                    <CreditCard size={16} />
                  </div>
                  <span className="ml-2 font-medium">Payment</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Lock
                    size={16}
                    className={cn(
                      isDarkMode ? "text-green-400" : "text-green-600"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium ml-2",
                      isDarkMode ? "text-green-400" : "text-green-600"
                    )}
                  >
                    Secure Checkout
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  )}
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Section: Event and Ticket Details */}
              <div className="lg:col-span-2 space-y-6">
                <AnimatePresence mode="wait">
                  {checkoutStep === 1 ? (
                    <motion.div
                      key="review-step"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Event Card */}
                      <div
                        className={cn(
                          "rounded-xl shadow-sm border overflow-hidden",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                              {event.event_title}
                            </h2>
                            <span
                              className={cn(
                                "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                isDarkMode
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-blue-100 text-blue-800"
                              )}
                            >
                              {event.event_type || "Event"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <Calendar
                                size={18}
                                className={cn(
                                  isDarkMode ? "text-blue-400" : "text-blue-600"
                                )}
                              />
                              <div>
                                <p className="font-medium">
                                  {formatDate(event.start_date)}
                                </p>
                                <p
                                  className={cn(
                                    "text-sm",
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  )}
                                >
                                  {formatTime(event.start_date)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPin
                                size={18}
                                className={cn(
                                  isDarkMode ? "text-blue-400" : "text-blue-600"
                                )}
                              />
                              <div>
                                <p className="font-medium">
                                  {event.venue_name}
                                </p>
                                <p
                                  className={cn(
                                    "text-sm",
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  )}
                                >
                                  {event.city}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Your Tickets Section */}
                      <div
                        className={cn(
                          "rounded-xl shadow-sm border",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}
                      >
                        <div
                          className={cn(
                            "border-b p-6",
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          )}
                        >
                          <h2 className="text-lg font-bold">
                            Your Tickets ({getTotalTicketsCount()})
                          </h2>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {event.tickets.map((ticket) => {
                              const count =
                                selectedTickets[ticket.ticket_type] || 0;
                              if (count === 0) return null;
                              return (
                                <div
                                  key={ticket.id}
                                  className={cn(
                                    "flex justify-between items-center p-4 rounded-lg",
                                    isDarkMode ? "bg-gray-700" : "bg-gray-50"
                                  )}
                                >
                                  <div>
                                    <p className="font-semibold">
                                      {ticket.ticket_type}
                                    </p>
                                    <p
                                      className={cn(
                                        "text-sm",
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      )}
                                    >
                                      {ticket.description}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">
                                      {count} ×{" "}
                                      {formatINR(parseFloat(ticket.price))}
                                    </p>
                                    <p
                                      className={cn(
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      )}
                                    >
                                      {formatINR(
                                        count * parseFloat(ticket.price)
                                      )}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Coupon Section */}
                      <div
                        className={cn(
                          "rounded-xl shadow-sm border",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Tag
                              size={18}
                              className={cn(
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              )}
                            />
                            <h2 className="text-lg font-bold">Apply Coupon</h2>
                          </div>
                          {couponApplied ? (
                            <div
                              className={cn(
                                "flex items-center justify-between p-4 border rounded-lg",
                                isDarkMode
                                  ? "bg-green-900/50 border-green-800 text-green-300"
                                  : "bg-green-50 border-green-200 text-green-800"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircle
                                  size={16}
                                  className={cn(
                                    isDarkMode
                                      ? "text-green-400"
                                      : "text-green-600"
                                  )}
                                />
                                <div>
                                  <p className="font-medium">
                                    Coupon {couponApplied.code} applied
                                  </p>
                                  <p className="text-sm">
                                    {formatINR(couponApplied.discount)} discount
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={removeCoupon}
                                className={cn(
                                  "font-medium text-sm underline",
                                  isDarkMode
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-green-700 hover:text-green-800"
                                )}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter coupon code"
                                className={cn(
                                  "flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2",
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                                    : "bg-white border-gray-300 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              />
                              <button
                                onClick={applyCoupon}
                                disabled={
                                  !couponCode.trim() || processingCoupon
                                }
                                className={cn(
                                  "px-4 py-2 rounded-lg transition-colors whitespace-nowrap",
                                  !couponCode.trim() || processingCoupon
                                    ? isDarkMode
                                      ? "bg-gray-600 cursor-not-allowed text-gray-400"
                                      : "bg-gray-300 cursor-not-allowed text-gray-600"
                                    : isDarkMode
                                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                              >
                                {processingCoupon ? (
                                  <span className="flex items-center">
                                    <div
                                      className={cn(
                                        "w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2",
                                        isDarkMode
                                          ? "border-white"
                                          : "border-white"
                                      )}
                                    ></div>
                                    Applying...
                                  </span>
                                ) : (
                                  "Apply Coupon"
                                )}
                              </button>
                            </div>
                          )}
                          {couponError && (
                            <p
                              className={cn(
                                "mt-2 text-sm flex items-center gap-1",
                                isDarkMode ? "text-red-400" : "text-red-600"
                              )}
                            >
                              <Info size={14} /> {couponError}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Continue Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setCheckoutStep(2)}
                          className={cn(
                            "flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors",
                            isDarkMode
                              ? "bg-blue-700 hover:bg-blue-600 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          Continue to Payment <ChevronRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="payment-step"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Payment Options */}
                      <div
                        className={cn(
                          "rounded-xl shadow-sm border",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}
                      >
                        <div
                          className={cn(
                            "border-b p-6",
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          )}
                        >
                          <h2 className="text-lg font-bold">Payment Method</h2>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            <button
                              onClick={() => setPaymentMethod("wallet")}
                              className={cn(
                                "w-full p-4 rounded-lg flex items-center gap-3 border transition-colors",
                                paymentMethod === "wallet"
                                  ? isDarkMode
                                    ? "bg-blue-900/50 border-blue-800 text-blue-300"
                                    : "bg-blue-50 border-blue-300 text-blue-800"
                                  : isDarkMode
                                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center border-2",
                                  paymentMethod === "wallet"
                                    ? isDarkMode
                                      ? "border-blue-400"
                                      : "border-blue-600"
                                    : isDarkMode
                                    ? "border-gray-600"
                                    : "border-gray-400"
                                )}
                              >
                                {paymentMethod === "wallet" && (
                                  <div
                                    className={cn(
                                      "w-3 h-3 rounded-full",
                                      isDarkMode ? "bg-blue-400" : "bg-blue-600"
                                    )}
                                  ></div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Wallet
                                  size={20}
                                  className={cn(
                                    paymentMethod === "wallet"
                                      ? isDarkMode
                                        ? "text-blue-400"
                                        : "text-blue-600"
                                      : isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  )}
                                />
                                <div>
                                  <p className="font-medium">Pay with Wallet</p>
                                  <p
                                    className={cn(
                                      "text-sm",
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    )}
                                  >
                                    Use your account balance
                                  </p>
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={() => setPaymentMethod("stripe")}
                              className={cn(
                                "w-full p-4 rounded-lg flex items-center gap-3 border transition-colors",
                                paymentMethod === "stripe"
                                  ? isDarkMode
                                    ? "bg-blue-900/50 border-blue-800 text-blue-300"
                                    : "bg-blue-50 border-blue-300 text-blue-800"
                                  : isDarkMode
                                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              <div
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center border-2",
                                  paymentMethod === "stripe"
                                    ? isDarkMode
                                      ? "border-blue-400"
                                      : "border-blue-600"
                                    : isDarkMode
                                    ? "border-gray-600"
                                    : "border-gray-400"
                                )}
                              >
                                {paymentMethod === "stripe" && (
                                  <div
                                    className={cn(
                                      "w-3 h-3 rounded-full",
                                      isDarkMode ? "bg-blue-400" : "bg-blue-600"
                                    )}
                                  ></div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <CreditCard
                                  size={20}
                                  className={cn(
                                    paymentMethod === "stripe"
                                      ? isDarkMode
                                        ? "text-blue-400"
                                        : "text-blue-600"
                                      : isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-600"
                                  )}
                                />
                                <div>
                                  <p className="font-medium">Pay with Card</p>
                                  <p
                                    className={cn(
                                      "text-sm",
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    )}
                                  >
                                    Credit/Debit via Stripe
                                  </p>
                                </div>
                              </div>
                            </button>

                            {paymentMethod === "stripe" && (
                              <CheckoutForm
                                handlePayment={handlePayment}
                                total={priceDetails.total}
                                eventTitle={event.event_title}
                                setPaymentStatus={setPaymentStatus}
                                setCouponError={setCouponError}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-between">
                        <button
                          onClick={() => setCheckoutStep(1)}
                          className={cn(
                            "flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors border",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <ArrowLeft size={18} /> Back to Review
                        </button>
                        {paymentMethod === "wallet" &&
                          paymentStatus === "idle" && (
                            <motion.button
                              key="pay-button"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => handlePayment()}
                              className={cn(
                                "flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors",
                                isDarkMode
                                  ? "bg-blue-700 hover:bg-blue-600 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              )}
                            >
                              Complete Payment <Lock size={16} />
                            </motion.button>
                          )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Section: Order Summary */}
              <div className="lg:col-span-1">
                <div
                  className={cn(
                    "rounded-md shadow-sm border sticky top-8",
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "border-b p-6",
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    )}
                  >
                    <h2 className="text-lg font-bold">Order Summary</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <p
                          className={cn(
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          )}
                        >
                          Subtotal
                        </p>
                        <p className="font-medium">
                          {formatINR(priceDetails.subtotal)}
                        </p>
                      </div>
                      {couponApplied && (
                        <div
                          className={cn(
                            "flex justify-between",
                            isDarkMode ? "text-green-400" : "text-green-600"
                          )}
                        >
                          <p>Discount ({couponApplied.code})</p>
                          <p>-{formatINR(priceDetails.discount)}</p>
                        </div>
                      )}
                      <div
                        className={cn(
                          "border-t pt-4 mt-4",
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        )}
                      >
                        <div className="flex justify-between">
                          <p className="font-bold">Total</p>
                          <p className="font-bold text-lg">
                            {formatINR(priceDetails.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence>
                    {paymentStatus === "processing" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "p-6 border-t",
                          isDarkMode
                            ? "bg-blue-900/50 border-gray-700"
                            : "bg-blue-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-6 h-6 border-3 border-t-transparent rounded-full animate-spin",
                              isDarkMode ? "border-blue-400" : "border-blue-600"
                            )}
                          ></div>
                          <p
                            className={cn(
                              "font-medium",
                              isDarkMode ? "text-blue-300" : "text-blue-800"
                            )}
                          >
                            Processing your payment...
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {paymentStatus === "error" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "p-6 border-t",
                          isDarkMode
                            ? "bg-red-900/50 border-gray-700"
                            : "bg-red-50 border-gray-200"
                        )}
                      >
                        <div className="text-center py-4">
                          <X
                            size={40}
                            className={cn(
                              "mx-auto mb-3",
                              isDarkMode ? "text-red-400" : "text-red-600"
                            )}
                          />
                          <p
                            className={cn(
                              "text-lg font-bold",
                              isDarkMode ? "text-red-300" : "text-red-800"
                            )}
                          >
                            Payment Failed
                          </p>
                          <p
                            className={cn(
                              "mb-4",
                              isDarkMode ? "text-red-400" : "text-red-700"
                            )}
                          >
                            {couponError ||
                              "Please try again or contact support."}
                          </p>
                          <button
                            onClick={() => setPaymentStatus("idle")}
                            className={cn(
                              "py-2 px-6 rounded-lg transition-colors w-full font-medium",
                              isDarkMode
                                ? "bg-red-700 hover:bg-red-600 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                            )}
                          >
                            Try Again
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div
                    className={cn(
                      "p-6 border-t rounded-md",
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      <Lock size={14} />{" "}
                      <p>All transactions are secure and encrypted.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Elements>
  );
}

export default CheckoutPage;
