import React from "react";
import { AlertTriangle, X, CreditCard, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubscriptionErrorHandler = ({ 
    error, 
    onClose, 
    onRetry,
    subscriptionRequired = false,
    limitReached = false,
    subscriptionExpired = false,
    currentUsage = 0,
    limit = 0,
    type = "event"
}) => {
    const navigate = useNavigate();

    const getErrorContent = () => {
        if (subscriptionRequired) {
            return {
                icon: <CreditCard className="w-8 h-8 text-blue-500" />,
                title: "Subscription Required",
                message: `You need an active subscription to ${type === "event" ? "join events" : "create events"}.`,
                actionText: "Choose a Plan",
                actionColor: "bg-blue-600 hover:bg-blue-700",
                onAction: () => navigate("/checkout/subscription"),
            };
        }

        if (subscriptionExpired) {
            return {
                icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
                title: "Subscription Expired",
                message: "Your subscription has expired. Please renew to continue using the service.",
                actionText: "Renew Subscription",
                actionColor: "bg-red-600 hover:bg-red-700",
                onAction: () => navigate("/checkout/renew-subscription"),
            };
        }

        if (limitReached) {
            return {
                icon: <Users className="w-8 h-8 text-yellow-500" />,
                title: "Subscription Limit Reached",
                message: `You have reached your monthly ${type === "event" ? "event joining" : "event creation"} limit (${limit}). Upgrade your plan to ${type === "event" ? "join" : "create"} more events.`,
                actionText: "Upgrade Plan",
                actionColor: "bg-yellow-600 hover:bg-yellow-700",
                onAction: () => navigate("/checkout/subscription"),
            };
        }

        return {
            icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
            title: "Error",
            message: error || "An unexpected error occurred.",
            actionText: "Try Again",
            actionColor: "bg-gray-600 hover:bg-gray-700",
            onAction: onRetry,
        };
    };

    const content = getErrorContent();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {content.icon}
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {content.title}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {content.message}
                        </p>
                        
                        {limitReached && (
                            <div className="bg-gray-100 rounded-lg p-3 mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Usage</span>
                                    <span>{currentUsage} / {limit}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={content.onAction}
                                className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${content.actionColor}`}
                            >
                                {content.actionText}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionErrorHandler;
