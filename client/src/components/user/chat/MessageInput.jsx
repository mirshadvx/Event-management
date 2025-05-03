import PropTypes from "prop-types";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { IoIosSend } from "react-icons/io";

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        onTyping();
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
            <input
                type="text"
                value={message}
                onChange={handleChange}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#00FF8C]"
            />
            <button
                type="submit"
                className="p-1 bg-[#00FF8C] text-gray-900 rounded-md hover:bg-[#00FF8C]/90 transition-colors flex-shrink-0"
            >
                <IoIosSend className="h-7 w-7" />
            </button>
        </form>
    );
};

MessageInput.propTypes = {
    onSendMessage: PropTypes.func.isRequired,
    onTyping: PropTypes.func.isRequired,
};

export default MessageInput;
