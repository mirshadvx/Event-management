import PropTypes from "prop-types";
import { Calendar, MapPin, Share2, Users } from "lucide-react";

const ChatInfo = ({ chatID }) => {
    const chat = chatID
        ? {
              id: chatID,
              title: `Chat ${chatID}`,
              dateRange: "Jan 10 - Jan 12, 2025",
              location: "Online",
              participants: 10,
          }
        : null;

    if (!chat) {
        return (
            <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 p-4 flex flex-col items-center justify-center text-gray-400 h-[calc(100vh-64px)]">
                <p>No chat selected</p>
            </div>
        );
    }

    return (
        <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden h-[calc(100vh-64px)]">
            <div className="p-4 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                    <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${chatID}`}
                        alt={chat.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{chat.title}</h2>
                <div className="flex items-center text-gray-400 text-sm space-x-1 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>{chat.dateRange}</span>
                </div>
                <div className="flex items-center text-gray-400 text-sm space-x-1 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{chat.location}</span>
                </div>
                <div className="flex items-center text-gray-400 text-sm space-x-1 mb-4">
                    <Users className="h-4 w-4" />
                    <span>{chat.participants} Participants Joined</span>
                </div>
                <button className="flex items-center space-x-1 bg-[#00FF8C] text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-[#00FF8C]/90 transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                </button>
            </div>
            <div className="flex-1 border-t border-gray-700 p-4 overflow-y-auto">
                <h3 className="text-white font-medium mb-3">Participants</h3>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                                    alt="Participant"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm text-white">Participant {i + 1}</p>
                                <p className="text-xs text-gray-400">{i % 2 === 0 ? "Speaker" : "Attendee"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

ChatInfo.propTypes = {
    chatID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ChatInfo;
