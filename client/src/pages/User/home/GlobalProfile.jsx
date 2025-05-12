import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/common/user/Home/Header";
import api from "@/services/api";
import { toast } from "sonner";

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
            const response = await api.post("organizer/toggle-follow/", {
                username,
                follow: newFollowStatus,
            });

            setIsFollowing(newFollowStatus);
            setFollowersCount((prevCount) => (newFollowStatus ? prevCount + 1 : prevCount - 1));
            toast.success(newFollowStatus ? "Following successfully!" : "Unfollowed successfully!");

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
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
                </div>
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
                <Suspense fallback={<div className="text-center py-8">Loading user info...</div>}>
                    <UserInfo userData={userData} isFollowing={isFollowing}
                        toggleFollow={toggleFollow} isFollowLoading={isFollowLoading}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default GlobalProfile;

{
    /* <Suspense fallback={<div className="text-center py-8">Loading events...</div>}>
                    <EventTabs userData={userData} />
                </Suspense> */
}

// const fetchUserData = async (username) => {
//     await new Promise((resolve) => setTimeout(resolve, 0));
//     return {
//         username,
//         fullName: "Mirshad",
//         bio: "Event enthusiast | Music lover | Professional networker",
//         profileImage: "https://via.placeholder.com/150",
//         followers: 1248,
//         following: 563,
//         stats: {
//             organized: 17,
//             participated: 42,
//         },
//         organizedEvents: [
//             {
//                 id: 1,
//                 title: "Tech Conference 2025",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "May 15, 2025",
//                 attendees: 156,
//                 likes: 47,
//             },
//             {
//                 id: 2,
//                 title: "Web Development Workshop",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "May 22, 2025",
//                 attendees: 78,
//                 likes: 23,
//             },
//             {
//                 id: 3,
//                 title: "UI/UX Design Meetup",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "May 30, 2025",
//                 attendees: 92,
//                 likes: 35,
//             },
//         ],
//         participatedEvents: [
//             {
//                 id: 4,
//                 title: "JavaScript Conference",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "Apr 25, 2025",
//                 attendees: 214,
//                 likes: 89,
//             },
//             {
//                 id: 5,
//                 title: "Startup Networking Night",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "Apr 12, 2025",
//                 attendees: 178,
//                 likes: 67,
//             },
//             {
//                 id: 6,
//                 title: "Product Management Seminar",
//                 image: "https://via.placeholder.com/320x200",
//                 date: "Mar 30, 2025",
//                 attendees: 124,
//                 likes: 42,
//             },
//         ],
//     };
// };
