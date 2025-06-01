import PropTypes from "prop-types";
import { IoIosSend } from "react-icons/io";
import { useRef, useState } from "react";
import { IoImage } from "react-icons/io5";
import { toast } from "sonner";

const MessageInput = ({ onSendMessage, onTyping, onSendImage }) => {
    const [message, setMessage] = useState("");
    const fileInputRef = useRef();

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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image size must be below 10MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onSendImage(reader.result);
                fileInputRef.current.value = "";
            };
            reader.readAsDataURL(file);
        }
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
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="p-1 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex-shrink-0"
            >
                <IoImage className="h-8 w-8" />
            </button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImageUpload}
                accept="image/*"
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
    onSendImage: PropTypes.func.isRequired,
};

export default MessageInput;
