import React from "react";
import { IoMdChatbubbles, IoIosNotifications } from "react-icons/io";

const Header = () => {
    return (
        <div className="relative z-10 test">
            <header className="w-full px-3 py-2">
                <div className="max-w-[1350px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-6 bg-[#134638] rounded-sm"></div>
                        <span className="text-white text-lg">Evenxo</span>
                    </div>
                    <nav className="bg-[#1e1e1e]/10 backdrop-blur-sm px-6 py-2 rounded-full border-2 border-[#b4b2a8] ml-24">
                        <ul className="flex space-x-8">
                            <li>
                                <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                    Explore
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                    Profile
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/90 hover:text-white transition-colors text-lg">
                                    Dashboard
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <div className="flex items-center gap-4">
                        <IoIosNotifications className="text-white w-7 h-7" />
                        <IoMdChatbubbles className="text-white w-7 h-7" />
                        <div className="flex items-center gap-2 bg-[#00FF82] px-4 py-1.5 rounded-lg">
                            <img src="/api/placeholder/32/32" alt="Profile" className="w-6 h-6 rounded-full" />
                            <span className="text-black font-medium">Mirshad</span>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;
