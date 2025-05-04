import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Search, Settings, Menu, Info } from "lucide-react";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import { get_ProfileData } from "@/store/user/userSlice";
import chatApi from "@/services/chatApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncLoader } from "react-spinners";

const ChatWindow = ({ chatID, chatHeader, onMenuClick, onInfoClick }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const socketRef = useRef(null);
    const connectedChatIDRef = useRef(null);
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
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
            const scrollContainer = document.querySelector(".messages-container");
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }, 100);
    };

    useEffect(() => {
        const connectWebSocket = async () => {
            if (!chatID || !user) return;

            // Prevent reconnecting if already connected to this chat
            if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN &&
                connectedChatIDRef.current === chatID
            ) {
                return;
            }

            try {
                const token = await chatApi.getSocketToken();
                const ws = new WebSocket(`ws://localhost:8000/ws/chat/${chatID}/?token=${token}`);

                ws.onopen = () => {
                    console.log("WebSocket connected");
                    connectedChatIDRef.current = chatID;
                    socketRef.current = ws;
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    if (data.type === "message") {
                        const pendingMsgContent = data.message.trim();
                        let isPendingMessage = false;

                        pendingMessagesRef.current.forEach((value, key) => {
                            if (value === pendingMsgContent) {
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === key
                                            ? {
                                                  ...msg,
                                                  id: `msg-${data.message_id}`,
                                                  timestamp: new Date(data.timestamp).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  }),
                                              }
                                            : msg
                                    )
                                );
                                pendingMessagesRef.current.delete(key);
                                isPendingMessage = true;
                            }
                        });

                        if (!isPendingMessage) {
                            const newMessage = {
                                id: `msg-${data.message_id}`,
                                content: data.message,
                                senderId: data.sender_id,
                                timestamp: new Date(data.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }),
                                isOwn: data.sender_id === user.id,
                                profilePicture: data.sender_id === user.id ? user.profile_picture : null,
                                username: data.sender_username,
                                read: false,
                            };
                            setMessages((prev) => [...prev, newMessage]);
                        }

                        if (data.sender_id !== user.id) {
                            ws.send(JSON.stringify({ type: "read", message_id: data.message_id }));
                        }
                    } else if (data.type === "read") {
                        setMessages((prev) =>
                            prev.map((msg) => (msg.id === `msg-${data.message_id}` ? { ...msg, read: true } : msg))
                        );
                    } else if (data.type === "typing") {
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
                    } else if (data.type === "error") {
                        console.error("WebSocket error:", data.error);
                        setError(data.error);
                    }
                };

                ws.onerror = (err) => {
                    console.error("WebSocket error:", err);
                    setError("Failed to connect to chat. Please try again.");
                };

                ws.onclose = (event) => {
                    console.log("WebSocket closed:", event.code, event.reason);
                    connectedChatIDRef.current = null;
                    socketRef.current = null;
                };
            } catch (err) {
                console.error("WebSocket connection failed:", err);
                setError("Failed to connect to chat. Please try again.");
            }
        };

        connectWebSocket();

        const fetchMessages = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await chatApi.getMessages(chatID);
                const formattedMessages = data.results.map((msg) => ({
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
                }));
                setMessages(formattedMessages);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                setError("Failed to load messages. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (chatID) {
            fetchMessages();
            pendingMessagesRef.current.clear();
        } else {
            setMessages([]);
        }

        return () => {
            socketRef.current?.close();
            socketRef.current = null;
            connectedChatIDRef.current = null;
        };
    }, [chatID, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleSendMessage = (content) => {
        if (!chatID || !content.trim() || !socketRef.current) return;

        const tempId = `msg-temp-${Date.now()}`;
        const trimmedContent = content.trim();

        pendingMessagesRef.current.set(tempId, trimmedContent);

        const newMessage = {
            id: tempId,
            content: trimmedContent,
            senderId: user.id,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isOwn: true,
            profilePicture: user.profile_picture,
            username: user.username,
            read: false,
        };

        setMessages((prev) => [...prev, newMessage]);

        try {
            socketRef.current.send(JSON.stringify({ type: "message", message: trimmedContent }));
        } catch (err) {
            console.error("Failed to send message:", err);
            pendingMessagesRef.current.delete(tempId);
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        }
    };

    const handleTyping = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "typing" }));
        }
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        chatApi
            .getMessages(chatID)
            .then((data) => {
                const formattedMessages = data.results.map((msg) => ({
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
                }));
                setMessages(formattedMessages);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Retry failed:", err);
                setError("Failed to load messages. Please try again.");
                setLoading(false);
            });
    };

    if (!chatID) {
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
                                src="https://api.dicebear.com/7.x/bottts/svg?seed=welcome"
                                alt="Welcome"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-white font-medium">Welcome</h2>
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

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <img
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=chat"
                        alt="Chat Icon"
                        className="w-24 h-24 mb-6"
                    />
                    <h3 className="text-2xl font-semibold text-white mb-2">Start a Conversation</h3>
                    <p className="text-gray-400 max-w-md">Select a chat from the sidebar to begin messaging.</p>
                </div>
            </div>
        );
    }

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
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${chatID}`}
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
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-start space-x-2">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-6 w-2/4" />
                                            <Skeleton className="h-6 w-3/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <p className="text-red-500 mb-4">{error}</p>
                                <Button onClick={handleRetry} className="bg-gray-700 hover:bg-gray-500 text-white">
                                    Retry
                                </Button>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <img
                                    src="https://api.dicebear.com/7.x/bottts/svg?seed=empty"
                                    alt="Empty Chat"
                                    className="w-16 h-16 mb-4"
                                />
                                <p className="text-gray-400">No messages yet. Start a conversation!</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    user={{
                                        id: message.senderId.toString(),
                                        name: message.username || `User ${message.senderId}`,
                                        avatar: message.profilePicture,
                                    }}
                                />
                            ))
                        )}
                        {typingUsers.length > 0 && (
                            // <div className="text-gray-400 text-sm italic animate-pulse">
                            //     {typingUsers.map((u) => u.username).join(", ")} is typing...
                            // </div>
                            // <div className="">
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

            <div className="flex-shrink-0 border-t border-gray-700 p-3 bg-gray-800 sticky bottom-0 w-full">
                <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
            </div>
        </div>
    );
};

ChatWindow.propTypes = {
    chatID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chatHeader: PropTypes.string,
    onMenuClick: PropTypes.func.isRequired,
    onInfoClick: PropTypes.func.isRequired,
};

export default ChatWindow;
