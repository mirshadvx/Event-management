import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/common/user/Home/Header";
import api from "@/services/api";
import { toast } from "sonner";
import LoadingScreen from "@/components/common/LoadingScreen";

const UserInfo = lazy(() => import("@/components/user/GlobalProfile/Userinfo"));

const GlobalProfile = () => {
    const { username } = useParams();
    const [userData, setUserData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("organizer/user-details/", {
                params: { username },
            });
            const data = response.data;
            setUserData(data);
            setIsFollowing(data.following);
            setFollowersCount(data.followers_count);
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error.response?.data?.message || "Failed to load user profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [username]);

    const toggleFollow = async () => {
        if (isFollowLoading) return;
        try {
            setIsFollowLoading(true);
            const newFollowStatus = !isFollowing;
            const response = await api.post("profile/toggle-follow/", {
                username,
                follow: newFollowStatus,
            });

            setIsFollowing(newFollowStatus);
            setFollowersCount((prevCount) => (newFollowStatus ? prevCount + 1 : prevCount - 1));
            // toast.success(newFollowStatus ? "Following successfully!" : "Unfollowed successfully!");
            toast.success(response.data.message);

            if (userData) {
                setUserData({
                    ...userData,
                    followers_count: newFollowStatus ? userData.followers_count + 1 : userData.followers_count - 1,
                    following: newFollowStatus,
                });
            }
        } catch (error) {
            console.error("Error toggling follow status:", error);
            toast.error(error.response?.data?.error || "Failed to update follow status");
        } finally {
            setIsFollowLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-[#0f172b] min-h-screen text-white flex flex-col">
                <Header />
                <LoadingScreen fullScreen={false} message="Loading profile" className="flex-1" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="bg-[#0f172b] min-h-screen text-white flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-red-400">User not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f172b] min-h-screen text-white flex flex-col">
            <Header />
            <div className="pt-16 md:pt-20 flex-1">
                <Suspense fallback={<LoadingScreen fullScreen={false} message="Loading user info" />}>
                    <UserInfo
                        userData={userData}
                        isFollowing={isFollowing}
                        toggleFollow={toggleFollow}
                        isFollowLoading={isFollowLoading}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default GlobalProfile;