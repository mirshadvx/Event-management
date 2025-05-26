import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Calendar, MapPin, Share2, Users, User, Crown } from "lucide-react";
import chatApi from "@/services/user/chat/chatApi";

const ChatInfo = ({ chatID, tab }) => {
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChatInfo = async () => {
            if (!chatID || !tab) return;

            setLoading(true);
            setError(null);
            const type = tab === "Personal" ? "personal" : "group";

            try {
                const response = await chatApi.getChatInfo(chatID, type);
                setChat(response.data);
            } catch (err) {
                setError("Failed to fetch chat information");
                console.error("Error fetching chat info:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChatInfo();
    }, [chatID, tab]);

    if (loading) {
        return (
            <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col items-center justify-center text-gray-400 h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2">Loading chat info...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col items-center justify-center text-gray-400 h-[calc(100vh-64px)]">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col items-center justify-center text-gray-400 h-[calc(100vh-64px)]">
                <p>No chat selected</p>
            </div>
        );
    }

    const isGroupChat = tab === "Events";
    const chatTitle = isGroupChat ? chat.name : getPersonalChatTitle(chat.participants);
    const chatImage = isGroupChat
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${chatID}`
        : getPersonalChatImage(chat.participants);

    function getPersonalChatTitle(participants) {
        const otherParticipant = participants.find((p) => p.id !== 1);
        return otherParticipant ? otherParticipant.username : "Personal Chat";
    }

    function getPersonalChatImage(participants) {
        const otherParticipant = participants.find((p) => p.id !== 1);
        return otherParticipant?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    return (
        <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden h-[calc(100vh-64px)]">
            <div className="p-4 flex flex-col items-center">
                {!isGroupChat && (
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                        <img src={chatImage} alt={chatTitle} className="w-full h-full object-cover" />
                    </div>
                )}

                <h2 className="text-xl font-bold text-white mb-1">{chatTitle}</h2>

                <div className="flex items-center text-gray-400 text-sm space-x-1 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(chat.created_at)}</span>
                </div>

                <div className="flex items-center text-gray-400 text-sm space-x-1 mb-4">
                    <Users className="h-4 w-4" />
                    <span>
                        {chat.participants.length} Participant{chat.participants.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {isGroupChat && chat.event && (
                    <div className="bg-gray-700 rounded-lg p-3 mb-4 w-full">
                        <h3 className="text-white font-medium text-sm mb-1">Event</h3>
                        <p className="text-gray-300 text-sm">{chat.event.event_title}</p>
                        <p className="text-gray-400 text-xs">Organized by {chat.event.organizer}</p>
                    </div>
                )}

                {isGroupChat && chat.admin && (
                    <div className="flex items-center text-gray-400 text-sm space-x-1 mb-4">
                        <Crown className="h-4 w-4" />
                        <span>Admin: {chat.admin.username}</span>
                    </div>
                )}
            </div>

            {isGroupChat && (
                <div className="flex-1 border-t border-gray-700 p-4 overflow-y-auto">
                    <h3 className="text-white font-medium mb-3">{isGroupChat ? "Participants" : "Chat with"}</h3>
                    <div className="space-y-3">
                        {chat.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600">
                                    <img
                                        src={
                                            participant.profile_picture ||
                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.id}`
                                        }
                                        alt={participant.username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm text-white">{participant.username}</p>
                                        {isGroupChat && chat.admin && participant.id === chat.admin.id && (
                                            <Crown className="h-3 w-3 text-yellow-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {isGroupChat
                                            ? chat.admin && participant.id === chat.admin.id
                                                ? "Admin"
                                                : "Member"
                                            : "Participant"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

ChatInfo.propTypes = {
    chatID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ChatInfo;
