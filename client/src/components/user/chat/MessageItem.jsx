import PropTypes from "prop-types";
import { Check, CheckCheck } from "lucide-react";

const MessageItem = ({ message, user, activeTab }) => {
    const formattedTime = message.timestamp;

    if (message.isOwn) {
        return (
            <div className="flex flex-col items-end space-y-1">
                {message.isImage ? (
                    <div className="bg-[#00FF8C] text-gray-900 p-[4px] rounded-lg rounded-tr-none max-w-[80%]">
                        <img
                            src={message.content}
                            alt="Sent"
                            className="max-w-full h-auto rounded"
                            onError={(e) => {
                                e.target.src = "https://via.placeholder.com/150?text=Image+Failed";
                            }}
                        />
                    </div>
                ) : (
                    <div className="bg-[#00FF8C] text-gray-900 p-3 rounded-lg rounded-tr-none max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                    </div>
                )}
                <div className="flex items-center space-x-1 pr-2">
                    <span className="text-xs text-gray-400">{formattedTime}</span>
                    {message.read ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                    ) : (
                        <Check className="h-3 w-3 text-gray-400" />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-1">
            <div className="flex items-start space-x-2">
                {activeTab === "Events" && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex flex-col">
                    {activeTab === "Events" && <p className="text-sm font-medium text-white">{user.name}</p>}
                    {message.isImage ? (
                        <div className="bg-gray-700 p-[4px] rounded-lg rounded-tl-none mt-1 max-w-[80%]">
                            <img
                                src={message.content}
                                alt="Received"
                                className="max-w-full h-auto rounded"
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/150?text=Image+Failed";
                                }}
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-700 p-3 rounded-lg rounded-tl-none mt-1 max-w-[80%]">
                            <p className="text-sm">{message.content}</p>
                        </div>
                    )}
                </div>
            </div>
            <span className="text-xs text-gray-400">{formattedTime}</span>
        </div>
    );
};

MessageItem.propTypes = {
    message: PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        senderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        timestamp: PropTypes.string.isRequired,
        isOwn: PropTypes.bool,
        profilePicture: PropTypes.string,
        username: PropTypes.string,
        read: PropTypes.bool,
        isImage: PropTypes.bool,
    }).isRequired,
    user: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string,
    }).isRequired,
    activeTab: PropTypes.string,
};

export default MessageItem;
