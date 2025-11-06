import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Search, Settings, Menu, Info } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import { socketService } from "@/services/user/chat/socketService";
import chatApi from "@/services/user/chat/chatApi";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SyncLoader } from "react-spinners";

const ChatWindow = ({ chatID, chatHeader, chatprofilePicture, onMenuClick, onInfoClick, activeTab }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const pendingMessagesRef = useRef(new Map());
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user && !userLoading) {
            dispatch(get_ProfileData());
        }
    }, [user, userLoading, dispatch]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            const container = document.querySelector(".messages-container");
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    };

    const handleMessage = (data) => {
        console.log("Received WebSocket data:", data);
        const isImage = data.is_image || !!data.image_url;
        const content = isImage ? data.image_url : data.message;
        const messageId = `msg-${data.message_id}`;

        setMessages((prev) => {
            if (prev.some((msg) => msg.id === messageId)) {
                return prev;
            }

            const tempId = Array.from(pendingMessagesRef.current.keys()).find((key) =>
                key.startsWith(isImage ? "img-temp-" : "msg-temp-")
            );

            if (tempId) {
                pendingMessagesRef.current.delete(tempId);
                return prev.map((msg) =>
                    msg.id === tempId
                        ? {
                              ...msg,
                              id: messageId,
                              content,
                              timestamp: new Date(data.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                              }),
                              isImage,
                              read: isImage ? true : msg.read,
                          }
                        : msg
                );
            }

            const newMessage = {
                id: messageId,
                content,
                senderId: data.sender_id,
                timestamp: new Date(data.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isOwn: data.sender_id === user.id,
                profilePicture: data.sender_id === user.id ? user.profile_picture : null,
                username: data.sender_username,
                read: isImage ? true : false,
                isImage,
            };
            return [...prev, newMessage];
        });

        if (data.sender_id !== user.id && !isImage) {
            socketService.markRead(data.message_id);
        }
    };

    const handleRead = (data) => {
        setMessages((prev) => prev.map((msg) => (msg.id === `msg-${data.message_id}` ? { ...msg, read: true } : msg)));
    };

    const handleTypingUser = (data) => {
        if (data.user_id !== user.id) {
            setTypingUsers((prev) => {
                if (!prev.some((u) => u.id === data.user_id)) {
                    return [...prev, { id: data.user_id, username: data.username }];
                }
                return prev;
            });
            setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u.id !== data.user_id));
            }, 3000);
        }
    };

    const handleError = (data) => {
        setError(data.error);
    };

    const fetchPersonalMessages = async (chatID) => {
        setLoading(true);
        try {
            const data = await chatApi.getMessages(chatID);
            const formatted = data.results.map((msg) => ({
                id: `msg-${msg.id}`,
                content: msg.content,
                senderId: msg.sender.id,
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isOwn: msg.sender.id === user.id,
                profilePicture: msg.sender.profile_picture,
                username: msg.sender.username,
                read: msg.read,
                isImage: msg.is_image,
            }));
            setMessages(formatted);
        } catch (err) {
            console.error("Fetch personal messages failed", err);
            setError("Failed to load personal messages");
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupMessages = async (chatID) => {
        setLoading(true);
        try {
            const response = await chatApi.getGroupMessages(chatID);
            const formatted = response.data.results.map((msg) => ({
                id: `msg-${msg.id}`,
                content: msg.content,
                senderId: msg.sender.id,
                timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isOwn: msg.sender.id === user.id,
                profilePicture: msg.sender.profile_picture,
                username: msg.sender.username,
                read: msg.read_by_count > 0,
                isImage: msg.is_image,
            }));
            setMessages(formatted);
        } catch (err) {
            console.error("Fetch group messages failed", err);
            setError("Failed to load group messages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("ChatWindow mounted with chatID:", chatID, "activeTab:", activeTab);
        if (!chatID || !user) return;

        const init = async () => {
            setError(null);
            setMessages([]);
            try {
                const token = await chatApi.getSocketToken();
                const chatType = activeTab === "Events" ? "group" : "personal";
                await socketService.connect(chatID, token, chatType);

                socketService.on("message", handleMessage);
                socketService.on("image", handleMessage);
                socketService.on("read", handleRead);
                socketService.on("typing", handleTypingUser);
                socketService.on("error", handleError);

                if (activeTab === "Events") {
                    await fetchGroupMessages(chatID);
                } else {
                    await fetchPersonalMessages(chatID);
                }
            } catch (err) {
                console.error("Socket init failed", err);
                setError("Socket initialization failed");
            }
        };

        init();

        return () => {
            socketService.off("message", handleMessage);
            socketService.off("image", handleMessage);
            socketService.off("read", handleRead);
            socketService.off("typing", handleTypingUser);
            socketService.off("error", handleError);
            socketService.disconnect();
        };
    }, [chatID, user, activeTab]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleSendMessage = (content) => {
        if (!content.trim()) return;
        const tempId = `msg-temp-${Date.now()}`;
        pendingMessagesRef.current.set(tempId, content);
        const newMessage = {
            id: tempId,
            content,
            senderId: user.id,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isOwn: true,
            profilePicture: user.profile_picture,
            username: user.username,
            read: false,
            isImage: false,
        };
        setMessages((prev) => [...prev, newMessage]);
        socketService.sendMessage({ message: content });
    };

    const handleSendImage = (imageData) => {
        if (!imageData) return;
        const tempId = `img-temp-${Date.now()}`;
        pendingMessagesRef.current.set(tempId, imageData);
        const newMessage = {
            id: tempId,
            content: imageData,
            senderId: user.id,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isOwn: true,
            profilePicture: user.profile_picture,
            username: user.username,
            read: true,
            isImage: true,
        };
        setMessages((prev) => [...prev, newMessage]);
        socketService.sendImage({ image: imageData });
    };

    const handleTyping = () => {
        socketService.sendTyping();
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        if (activeTab === "Events") {
            fetchGroupMessages(chatID);
        } else {
            fetchPersonalMessages(chatID);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-900 h-full">
            <div className="bg-gray-800 py-3 px-4 flex items-center justify-between border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                        <img
                            src={chatprofilePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${chatID}`}
                            alt={chatHeader || "Chat"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-white font-medium">{chatHeader || "Conversation"}</h2>
                        <p className="text-xs text-gray-400">conversation</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                        <Search className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                        <Settings className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onInfoClick}
                        className="lg:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                    >
                        <Info className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto messages-container">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                        {loading ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-3/4" />)
                        ) : error ? (
                            <div className="text-center text-red-500">
                                <p>{error}</p>
                                <Button onClick={handleRetry}>Retry</Button>
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-gray-400 text-center">No messages yet</p>
                        ) : (
                            messages.map((msg) => (
                                <MessageItem
                                    key={msg.id}
                                    message={msg}
                                    user={{
                                        id: msg.senderId,
                                        name: msg.username,
                                        avatar: msg.profilePicture,
                                    }}
                                    activeTab={activeTab}
                                />
                            ))
                        )}
                        {typingUsers.length > 0 && (
                            <div className="w-fit">
                                <div className="bg-gray-700/40 p-3 rounded-lg rounded-tl-none mt-1">
                                    <SyncLoader color="#6aff00" margin={1} size={9} speedMultiplier={0.5} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>
            <div className="border-t border-gray-700 p-3 bg-gray-800">
                <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} onSendImage={handleSendImage} />
            </div>
        </div>
    );
};

ChatWindow.propTypes = {
    chatID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    chatHeader: PropTypes.string,
    chatprofilePicture: PropTypes.string,
    onMenuClick: PropTypes.func.isRequired,
    onInfoClick: PropTypes.func.isRequired,
    activeTab: PropTypes.string.isRequired,
};

export default ChatWindow;
