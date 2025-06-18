import Header from "../../../components/common/user/Home/Header";
import React, { useEffect } from "react";
import { Bell, MessageSquare, BarChart, QrCode } from "lucide-react";
import SubscriptionPlan from "@/components/user/Home/SubscriptionPlan";
import { Toaster, toast } from "sonner";
import { useLocation } from "react-router-dom";

const NoiseTexture = () => (
    <svg className="fixed inset-0 opacity-20 w-full h-full" width="100%" height="100%">
        <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
);

const Home = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            toast.info(location.state.message, {
                position: "top-right",
                duration: 3000,
                style: {
                    background: "rgba(30 37 33 / 68%)",
                    color: "#D1FAE5",
                    border: "1px solid rgba(34, 197, 94, 0.5)",
                },
            });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#1a1744] via-[#1a1728] to-[#1a2826]" />

            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent" />

            <NoiseTexture />

            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px]" />

            <div className="relative z-10">
                <div className="min-h-screen w-full bg-gradient-to-b from-[#1a1744] via-[#1a1728] to-[#1a2826] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%)]" />
                    <Header />
                    <div className="min-h-screen text-white p-8 pt-30">
                        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start mb-24">
                            <div>
                                <h1 className="text-5xl font-light leading-tight mb-8">
                                    <span className="bg-[#00FF85] text-black px-2 font-normal">Connect</span> Through
                                    <br />
                                    Events, <span className="bg-[#00FF85] text-black px-2 font-normal">Share</span>
                                    <br />
                                    Every Moment
                                </h1>
                                <p className="text-gray-300 mb-10 text-lg leading-relaxed max-w-xl">
                                    Where event organizers meet their community and attendees discover their next amazing
                                    experience. Create, share, connect, and celebrate – all in one social platform designed
                                    for event lovers.
                                </p>
                                <div className="flex gap-6">
                                    <button className="bg-[#00FF85] text-black px-8 py-3 rounded-full text-lg font-medium hover:bg-[#00CC6A] transition">
                                        Join Our Community
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-7xl mx-auto mb-16">
                            <h2 className="text-4xl font-light leading-tight mb-8">
                                <span className="bg-[#00FF85] text-black px-2 font-normal">Create</span> Events Like Posts,
                                <br />
                                <span className="bg-[#00FF85] text-black px-2 font-normal">Build</span> Communities Like
                                Never Before
                            </h2>

                            <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl">
                                Evenxo brings the best of social media to event management. Organizers can create and
                                promote events with the ease of posting on social media, while attendees discover, join, and
                                connect with like-minded people in their interest communities.
                            </p>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                    <div className="text-3xl mb-3">🎯</div>
                                    <h3 className="text-xl font-medium text-[#00FF85] mb-2">For Organizers</h3>
                                    <p className="text-gray-300">
                                        Create events, build followers, engage your community, and grow your brand
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                    <div className="text-3xl mb-3">🎉</div>
                                    <h3 className="text-xl font-medium text-[#00FF85] mb-2">For Attendees</h3>
                                    <p className="text-gray-300">
                                        Discover events, connect with others, share experiences, and build your social
                                        circle
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                    <div className="text-3xl mb-3">💬</div>
                                    <h3 className="text-xl font-medium text-[#00FF85] mb-2">Social Features</h3>
                                    <p className="text-gray-300">
                                        Like, comment, share events, follow organizers, and chat with fellow attendees
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                                    <div className="text-3xl mb-3">📱</div>
                                    <h3 className="text-xl font-medium text-[#00FF85] mb-2">Mobile First</h3>
                                    <p className="text-gray-300">
                                        Everything in your pocket - tickets, networking, updates, and memories
                                    </p>
                                </div>
                            </div>

                            <p className="text-[#00FF85] italic text-lg">
                                Join over 50,000+ event creators and community builders who have already connected 500,000+
                                attendees through our platform!
                            </p>
                        </div>

                        <div className="max-w-7xl mx-auto">
                            <SubscriptionPlan />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
