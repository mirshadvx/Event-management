import React from "react";
import { AlertTriangle, X } from "lucide-react";

const SubscriptionLimitWarning = ({ 
    type, 
    current, 
    limit, 
    onUpgrade, 
    onClose 
}) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    if (!isNearLimit && !isAtLimit) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 ${
            isAtLimit 
                ? 'bg-red-50 border-red-500 text-red-800' 
                : 'bg-yellow-50 border-yellow-500 text-yellow-800'
        }`}>
            <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                        {isAtLimit ? 'Subscription Limit Reached' : 'Subscription Limit Warning'}
                    </h3>
                    <p className="text-sm mt-1">
                        You have used {current} of {limit} {type} this month.
                        {isAtLimit 
                            ? ' Upgrade your plan to continue.' 
                            : ' Consider upgrading your plan for more capacity.'
                        }
                    </p>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={onUpgrade}
                            className={`text-xs px-3 py-1 rounded font-medium ${
                                isAtLimit 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                        >
                            Upgrade Plan
                        </button>
                        <button
                            onClick={onClose}
                            className="text-xs px-3 py-1 rounded font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SubscriptionLimitWarning;
