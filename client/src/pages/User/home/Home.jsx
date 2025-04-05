import React from "react";
import { BellIcon, MessageSquare } from "lucide-react";
import Header from "../../../components/common/user/Home/Header";
import { BarChart, QrCode } from "lucide-react";
import { FaRobot } from "react-icons/fa";
import SubscriptionPlan from "@/components/user/Home/SubscriptionPlan";

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
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Base gradient */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#1a1744] via-[#1a1728] to-[#1a2826]" />

            {/* Animated gradient orbs */}
            {/* <div className="fixed inset-0">
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#00ffbb]/10 blur-[100px] animate-pulse delay-700" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse delay-1000" />
      </div> */}

            {/* Radial gradient overlay */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            {/* Glow effect for top */}
            <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent" />

            {/* Noise texture overlay */}
            <NoiseTexture />

            {/* Subtle grid overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px]" />

            {/* Content container */}
            <div className="relative z-10">
                {/* children here */}

                <div className="min-h-screen w-full bg-gradient-to-b from-[#1a1744] via-[#1a1728] to-[#1a2826] relative">
                    {/* Optional overlay for additional depth */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%)]" />
                    <Header />
                    <div className="min-h-screen text-white p-8">
                        {/* Hero Section */}
                        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start mb-24">
                            <div>
                                <h1 className="text-5xl font-light leading-tight mb-8">
                                    <span className="bg-[#00FF85] text-black px-2 font-normal">Simplify</span> Event
                                    <br />
                                    Planning, <span className="bg-[#00FF85] text-black px-2 font-normal">Amplify</span>
                                    <br />
                                    Event Experience
                                </h1>
                                <p className="text-gray-300 mb-10 text-lg leading-relaxed max-w-xl">
                                    Why wrestle with Event Chaos when you can be smooth sailing into Event Clarity? With
                                    Evenxo, forget about paper – 'cause your tickets are safe and sound in your phone!
                                </p>
                                <div className="flex gap-6">
                                    <button className="bg-[#00FF85] text-black px-8 py-3 rounded-full text-lg font-medium hover:bg-[#00CC6A] transition">
                                        Talk to Us
                                    </button>
                                    {/* <button className="px-8 py-3 rounded-full text-lg font-medium hover:bg-white hover:text-black transition border-2 border-white">
                                        Schedule a Demo
                                    </button> */}
                                </div>
                            </div>

                            {/* <div className="relative mt-4">
                                <div className="bg-[#1A2732] p-8 rounded-2xl shadow-lg">
                                    <div className="flex justify-between items-start mb-12">
                                        <QrCode className="text-[#00FF85]" size={40} />
                                        <FaRobot className="text-[#00FF85]" size={40} />
                                    </div>
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="bg-[#00FF85] text-black px-6 py-2 rounded-lg text-lg font-medium">
                                            #12345007
                                        </div>
                                        <span className="text-gray-400 text-lg">23/100</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <BarChart className="text-[#00FF85]" size={28} />
                                        <span className="text-base">Receive Live Analytics on your Event</span>
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        {/* Time Saving Section */}
                        <div className="max-w-7xl mx-auto mb-24">
                            <div className="mb-10">
                                <span className="text-[#00FF85] text-lg font-medium">DID YOU KNOW?</span>
                                <h2 className="text-4xl font-light mt-4">
                                    You're Wasting{" "}
                                    <span className="bg-[#00FF85] text-black px-2 font-normal">Over 17 Hours</span>
                                </h2>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                                {[
                                    { time: "4 hrs", text: "Sending emails to users at various points." },
                                    { time: "3 hrs", text: "Sending custom tickets to the participants." },
                                    { time: "3 hrs", text: "Generating event statistics from CSVs." },
                                    { time: "2 hrs", text: "Distribution of event materials to the attendees." },
                                    { time: "3 hrs", text: "Setting up attendee check-ins at the venue." },
                                    { time: "2 hrs", text: "Managing on-site attendance and ticket sales." },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <span className="text-[#00FF85] font-medium">+ {item.time}</span>
                                        <span className="text-gray-300">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[#00FF85] mt-8 text-lg">↓ Let's do it the easy way!</p>
                        </div>

                        {/* Customize Section */}
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-4xl font-light leading-tight mb-8">
                                <span className="bg-[#00FF85] text-black px-2 font-normal">Customize</span> Your Emails &
                                <br />
                                Tickets and Even{" "}
                                <span className="bg-[#00FF85] text-black px-2 font-normal">Schedule It!</span>
                            </h2>

                            <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl">
                                Our landing page wasn't vibing the way we wanted, and let's be honest— communication is
                                everything! We've given ourselves a makeover, so how about you? Keep it simple and go the
                                easy route!
                            </p>

                            <p className="text-[#00FF85] italic text-lg">
                                To date, we've sent 154,563+ emails and issued over 51,345 tickets for our users!
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
