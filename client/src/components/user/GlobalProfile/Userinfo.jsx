import { MessageSquare, Share2 } from "lucide-react";
import FollowButton from "./FollowButton";

const UserInfo = ({ userData, isFollowing, toggleFollow, isFollowLoading }) => (
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
                        <h1 className="text-xl md:text-2xl font-bold">{userData.username}</h1>
                        <p className="text-sm text-slate-400">{userData.title}</p>
                    </div>

                    <div className="flex justify-center md:justify-end gap-2">
                        <FollowButton
                            isFollowing={isFollowing}
                            toggleFollow={toggleFollow}
                            isFollowLoading={isFollowLoading}
                        />
                        <button className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
                            <MessageSquare size={16} />
                        </button>
                        <button className="p-2 rounded-full bg-slate-700 hover:bg-slate-600">
                            <Share2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 mb-4">
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl">{userData.organized_events_count}</div>
                        <div className="text-xs md:text-sm text-slate-400">Organized</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl">{userData.participated_events_count}</div>
                        <div className="text-xs md:text-sm text-slate-400">Participated</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl">{userData.followers_count}</div>
                        <div className="text-xs md:text-sm text-slate-400">Followers</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl">{userData.following_count}</div>
                        <div className="text-xs md:text-sm text-slate-400">Following</div>
                    </div>
                </div>

                <p className="text-slate-300 text-sm md:text-base">{userData.bio}</p>
            </div>
        </div>
    </div>
);

export default UserInfo;
