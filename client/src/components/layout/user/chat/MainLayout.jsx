import { useState, useEffect } from "react";
import ChatSidebar from "@/components/user/chat/ChatSidebar";
import ChatInfo from "@/components/user/chat/ChatInfo";
import ChatWindow from "@/components/user/chat/ChatWindow";
import Header from "@/components/common/user/Home/Header";

const MainLayout = () => {
    const [activeTab, setActiveTab] = useState("Personal");
    const [activeChatID, setActiveChatID] = useState(null);
    const [chatHeader, setChatHeader] = useState(null);
    const [profilePicture, setprofilePicture] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleInfo = () => setIsInfoOpen(!isInfoOpen);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setActiveChatID(null);
        setChatHeader(null);
    };

    const MobileLayout = () => (
        <div className="relative flex-1 h-[calc(100vh-64px)] overflow-hidden flex flex-col pt-14">
            <div className="flex-1 flex flex-col relative z-10 bg-gray-900 overflow-hidden">
                <ChatWindow
                    chatID={activeChatID}
                    chatHeader={chatHeader}
                    chatprofilePicture={profilePicture}
                    onMenuClick={toggleSidebar}
                    onInfoClick={toggleInfo}
                    activeTab={activeTab}
                />
            </div>

            <div
                className={`fixed inset-y-0 top-16 left-0 z-30 w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <ChatSidebar
                    activeChatID={activeChatID}
                    setActiveChatID={(chatID, title, profilePicture) => {
                        setActiveChatID(chatID);
                        setChatHeader(title);
                        setprofilePicture(profilePicture);
                        setIsSidebarOpen(false);
                    }}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>

            <div
                className={`fixed inset-y-0 top-16 right-0 z-30 w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 ${
                    isInfoOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <ChatInfo chatID={activeChatID} tab={activeTab} />
            </div>

            {(isSidebarOpen || isInfoOpen) && (
                <div
                    className="fixed inset-0 top-16 bg-black bg-opacity-50 z-20"
                    onClick={() => {
                        setIsSidebarOpen(false);
                        setIsInfoOpen(false);
                    }}
                />
            )}
        </div>
    );

    const DesktopLayout = () => (
        <div className="flex pt-15">
            <div className="w-80 flex-shrink-0">
                <ChatSidebar
                    activeChatID={activeChatID}
                    setActiveChatID={(chatID, title, profilePicture) => {
                        setActiveChatID(chatID);
                        setChatHeader(title);
                        setprofilePicture(profilePicture);
                    }}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>
            <div className="flex-1">
                <ChatWindow
                    chatID={activeChatID}
                    chatHeader={chatHeader}
                    chatprofilePicture={profilePicture}
                    onMenuClick={() => {}}
                    onInfoClick={() => {}}
                    activeTab={activeTab}
                />
            </div>
            <div className="w-80 flex-shrink-0">
                <ChatInfo chatID={activeChatID} tab={activeTab} />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <Header />
            {isMobile ? <MobileLayout /> : <DesktopLayout />}
        </div>
    );
};

export default MainLayout;
