import PropTypes from "prop-types";

const ChatListItem = ({ chat, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`px-3 py-3 cursor-pointer border-l-2 transition-all ${
                isActive ? "bg-gray-700 border-l-[#00FF8C]" : "hover:bg-gray-700/70 border-l-transparent"
            }`}
        >
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                        <img
                            src={chat.profilePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${chat.id}`}
                            alt={chat.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-medium text-white truncate">{chat.title}</h3>
                        <span className="text-xs text-gray-400">{chat.lastActive}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-1">{chat.lastMessage}</p>
                </div>
            </div>
        </div>
    );
};

ChatListItem.propTypes = {
    chat: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        title: PropTypes.string.isRequired,
        lastActive: PropTypes.string.isRequired,
        lastMessage: PropTypes.string,
        profilePicture: PropTypes.string,
    }).isRequired,
    isActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default ChatListItem;
