import { useState } from "react";
import { Loader2 } from "lucide-react";

const FollowButton = ({ isFollowing, toggleFollow, isFollowLoading }) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <button
            onClick={toggleFollow}
            disabled={isFollowLoading}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 min-w-20 ${
                isFollowing
                    ? "bg-slate-700 text-white hover:bg-red-500 hover:text-white"
                    : "bg-green-400 text-slate-900 hover:bg-green-500"
            } ${isFollowLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {isFollowLoading && <Loader2 size={16} className="animate-spin" />}
            {isFollowing ? (isHovering ? "Unfollow" : "Following") : "Follow"}
        </button>
    );
};

export default FollowButton;
