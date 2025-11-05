import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const ChatListItem = ({ chat, isActive, onClick }) => {
  const navigate = useNavigate();

  const handleUsernameClick = (e, username) => {
    e.stopPropagation();
    if (username) {
      navigate(`/user/${username}`);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-gray-700" : "hover:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={chat.profilePicture || "/default-profile.png"}
            alt={chat.title}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            onClick={(e) =>
              chat.username && handleUsernameClick(e, chat.username)
            }
            className={`font-semibold text-sm truncate ${
              chat.username ? "hover:text-green-400 cursor-pointer" : ""
            }`}
            title={chat.title}
          >
            {chat.title}
          </h3>
          <p className="text-xs text-gray-400 truncate">
            {chat.lastMessage || "No messages yet"}
          </p>
        </div>
        {chat.unreadCount > 0 && (
          <span className="bg-green-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
          </span>
        )}
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
