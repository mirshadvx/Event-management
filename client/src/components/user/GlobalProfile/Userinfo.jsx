import { MessageSquare, Share2, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import chatApi from "@/services/user/chat/chatApi";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import FollowButton from "./FollowButton";

const UserInfo = ({ userData, isFollowing, toggleFollow, isFollowLoading }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.user);

  const handleMessageClick = async () => {
    if (!userData) return;

    try {
      const userId = userData.id || userData.user_id;

      if (!userId) {
        toast.error("Unable to start conversation");
        return;
      }

      const conversation = await chatApi.createConversation(userId);
      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error(
        error.response?.data?.error || "Failed to start conversation"
      );
    }
  };

  const handleShareClick = () => {
    const profileUrl = `${window.location.origin}/user/${userData.username}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${userData.username}'s Profile`,
          text: `Check out ${userData.username}'s profile on Evenxo`,
          url: profileUrl,
        })
        .catch(() => {
          navigator.clipboard.writeText(profileUrl);
          toast.success("Profile link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-4">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        <div className="relative">
          <img
            src={userData.profile_picture}
            alt={`${userData.username}'s profile`}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-green-400"
            loading="lazy"
          />
          {userData.organizerVerified && (
            <span className="absolute bottom-0 right-0 bg-green-400 text-slate-900 text-xs font-medium px-2 py-1 rounded-full">
              Verified
            </span>
          )}
        </div>

        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {userData.username}
              </h1>
              <p className="text-sm text-slate-400">{userData.title}</p>
            </div>

            <div className="flex justify-center md:justify-end gap-2">
              <FollowButton
                isFollowing={isFollowing}
                toggleFollow={toggleFollow}
                isFollowLoading={isFollowLoading}
              />
              {currentUser && currentUser.username !== userData.username && (
                <button
                  onClick={handleMessageClick}
                  className="p-2 rounded-full bg-slate-700 hover:bg-green-400 hover:text-slate-900 transition-colors"
                  title="Send message"
                >
                  <MessageSquare size={16} />
                </button>
              )}
              <button
                onClick={handleShareClick}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600"
                title="Share profile"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 mb-4">
            <div className="text-center">
              <div className="font-bold text-lg md:text-xl">
                {userData.organized_events_count}
              </div>
              <div className="text-xs md:text-sm text-slate-400">Organized</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg md:text-xl">
                {userData.participated_events_count}
              </div>
              <div className="text-xs md:text-sm text-slate-400">
                Participated
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg md:text-xl">
                {userData.followers_count}
              </div>
              <div className="text-xs md:text-sm text-slate-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg md:text-xl">
                {userData.following_count}
              </div>
              <div className="text-xs md:text-sm text-slate-400">Following</div>
            </div>
          </div>

          <p className="text-slate-300 text-sm md:text-base">{userData.bio}</p>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
