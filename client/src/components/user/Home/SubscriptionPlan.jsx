import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function SubscriptionPlan() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await api.get("users/subscription-checkout/");
                if (response.data.success) {
                    setPlans(response.data.plans);
                }
            } catch (error) {
                console.log("Error fetching plans:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (loading) {
        return <div className="text-white text-center mt-10">Loading plans...</div>;
    }

    return (
        <div className="relative bg-gradient-to-tr from-[#0f0c29]to-[#24243e] isolate px-6 sm:py-32 lg:px-8">
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
            >
                <div
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                    className="mx-auto aspect-1155/678 w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
                />
            </div>

            <div className="mx-auto mt-16 grid max-w-lg items-center lg:gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
                {plans.map((tier, tierIdx) => {
                    const features = [
                        `Conduct monthly below ${tier.event_creation_limit} events`,
                        `Join events monthly ${tier.event_join_limit}`,
                        ...(tier.advanced_analytics ? ["Advanced analytics"] : []),
                        ...(tier.personal_chat ? ["Anyone can message"] : []),
                        ...(tier.email_notification ? ["Email notification"] : []),
                        ...(tier.group_chat ? ["Group chat support"] : []),
                        ...(tier.live_streaming ? ["Live streaming enabled"] : []),
                        ...(tier.ticket_scanning ? ["Ticket scanning available"] : []),
                    ];

                    const isFeatured = tier.name === "premium";

                    return (
                        <div
                            key={tier.id || tier.name}
                            className={classNames(
                                isFeatured ? "relative bg-gray-900 shadow-2xl" : "bg-white/10 sm:mx-8 lg:mx-0",
                                isFeatured
                                    ? ""
                                    : tierIdx === 0
                                    ? "rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl"
                                    : "sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none",
                                "rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10"
                            )}
                        >
                            <h3 className="text-base/7 font-semibold text-[#00FF85]">{tier.name}</h3>
                            <p className="mt-4 flex items-baseline gap-x-2">
                                <span className="text-white text-5xl font-semibold tracking-tight">{tier.price}</span>
                                <span className={classNames(isFeatured ? "text-gray-400" : "text-gray-500", "text-base")}>
                                    /month
                                </span>
                            </p>
                            <ul
                                className={classNames(
                                    isFeatured ? "text-gray-300" : "text-gray-600",
                                    "mt-8 space-y-3 text-sm/6 sm:mt-10"
                                )}
                            >
                                {features.map((feature, index) => (
                                    <li key={index} className="flex gap-x-3 text-white">
                                        <FaCheck
                                            aria-hidden="true"
                                            className={classNames(
                                                isFeatured ? "text-indigo-400" : "text-indigo-600",
                                                "h-6 w-5 flex-none"
                                            )}
                                        />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={classNames(
                                    isFeatured
                                        ? "bg-[#00FF85] text-black shadow-xs hover:bg-indigo-400 focus-visible:outline-indigo-500"
                                        : "text-[#00FF85]  ring-1 ring-indigo-200 ring-inset hover:ring-indigo-300 focus-visible:outline-indigo-600",
                                    "mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10"
                                )}
                                onClick={() => navigate("/checkout/subscription")}
                            >
                                Get started today
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
