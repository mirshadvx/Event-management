import PropTypes from "prop-types";
import { Search } from "lucide-react";
import ChatListItem from "./ChatListItem";
import { useState, useEffect } from "react";
import chatApi from "@/services/chatApi";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";

const ChatSidebar = ({ activeChatID, setActiveChatID, activeTab, setActiveTab, searchQuery, setSearchQuery }) => {
    const tabs = ["Personal", "Events"];
    const [chats, setChats] = useState([]);
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user && !userLoading) {
            dispatch(get_ProfileData());
        }
    }, [user, userLoading, dispatch]);

    useEffect(() => {
        if (activeTab === "Personal" && user) {
            const fetchChats = async () => {
                try {
                    const response = await chatApi.getConversations();
                    const transformedChats = response.data.map((chat) => {
                        const otherParticipant = chat.participants.find((participant) => participant.id !== user.id);
                        return {
                            id: chat.id,
                            title: otherParticipant?.username || "Unknown",
                            profilePicture: otherParticipant?.profile_picture || null,
                            lastActive: chat.last_message?.timestamp || chat.created_at,
                            lastMessage: chat.last_message?.content || "",
                            unreadCount: chat.unread_count || 0,
                        };
                    });
                    setChats(transformedChats);
                } catch (error) {
                    console.error("Error fetching chats:", error);
                    setChats([]);
                }
            };

            fetchChats();
        } else if (activeTab === "Events") {
            const fetchGroupchats = async () => {
                try {
                    const response = await chatApi.getGroupConversations();
                    const transformedChats = response.data.map((chat) => {
                        return {
                            id: chat.id,
                            title: chat.name,
                            profilePicture: chat.profile_picture || null,
                            lastActive: chat.last_message?.timestamp || chat.created_at,
                            lastMessage: chat.last_message?.content || "",
                            unreadCount: chat.unread_count || 0,
                        };
                    });
                    setChats(transformedChats);
                } catch (error) {
                    console.error("Error fetching chats:", error);
                    setChats([]);
                }
            };
            fetchGroupchats();
        } else {
            setChats([]);
        }
    }, [activeTab, user]);

    return (
        <div className="w-full sm:w-80 bg-gray-800 overflow-hidden flex flex-col border-r border-gray-700 h-[calc(100vh-64px)]">
            <div className="px-3 pt-3 pb-2">
                <div className="flex space-x-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 ${
                                activeTab === tab ? "bg-[#00FF8C] text-gray-900" : "text-gray-300 hover:bg-gray-700"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-3 pb-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 text-sm text-gray-200 placeholder-gray-400 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#00FF8C]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {chats.length > 0 ? (
                    chats.map((chat) => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            isActive={activeChatID === chat.id}
                            onClick={() => setActiveChatID(chat.id, chat.title, chat.profilePicture)}
                        />
                    ))
                ) : (
                    <div className="p-4 text-center text-gray-400">No chats found</div>
                )}
            </div>
        </div>
    );
};

ChatSidebar.propTypes = {
    activeChatID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setActiveChatID: PropTypes.func.isRequired,
    activeTab: PropTypes.oneOf(["Personal", "Events"]).isRequired,
    setActiveTab: PropTypes.func.isRequired,
    searchQuery: PropTypes.string.isRequired,
    setSearchQuery: PropTypes.func.isRequired,
};

export default ChatSidebar;
