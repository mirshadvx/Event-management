import { useEffect, useRef, useState } from "react";
import { get_ProfileData } from "@/store/user/userSlice";
import { Edit2, Save, AlertCircle, Camera, MapPin, Mail, Phone, X, Award, Calendar, Users, TrendingUp } from "lucide-react";
import { MdVerifiedUser } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import EditProfileModal from "@/components/common/user/Profile/profile/EditProfileModal";
import ImageEditModal from "@/components/common/user/Profile/profile/ImageEditModal";
import { toast } from "sonner";
import api from "@/services/api";
import { CheckOrganizerStatus } from "@/services/api";

const Profile_outlet = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.user);

    const [userData, setUserData] = useState({
        name: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        profilePicture: "",
        socialLinks: {},
        preferences: {
            notifications: true,
            marketingEmails: false,
            twoFactorAuth: true,
        },
    });

    const [profileStats, setProfileStats] = useState({
        organized_events_count: 0,
        participated_events_count: 0,
        event_success_rate: 0,
        achieved_badges: [],
    });
    const [statsLoading, setStatsLoading] = useState(true);

    const [userOrgaVeri, setuserOrgaVeri] = useState(false);
    const [organizerStatus, setOrganizerStatus] = useState(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [organizerVerified, setOrganizerVerified] = useState(false);
    const wsRef = useRef();
    const baseWebSocketURL = import.meta.env.VITE_WEBSOCKET_URL;

    const fetchProfileStats = async () => {
        try {
            setStatsLoading(true);
            const response = await api.get("/profile/profile-data/");
            setProfileStats(response.data);
        } catch (error) {
            console.error("Error fetching profile stats:", error);
            toast.error("Failed to load profile statistics", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (!user && !loading) {
            dispatch(get_ProfileData());
            console.log(user);
        }

        if (user) {
            setUserData({
                name: user.username || "",
                title: user.title || "",
                email: user.email || "",
                phone: user.phone || "",
                location: user.location || "",
                bio: user.bio || "",
                profilePicture: user.profile_picture || "",
                socialLinks: transformSocialLinks(user.social_media_links || []),
                preferences: {
                    notifications: user.settings?.notification || false,
                    marketingEmails: user.settings?.marketing_emails || false,
                    twoFactorAuth: user.settings?.two_factor_auth || false,
                },
            });
            setuserOrgaVeri(user.organizerVerified);
            setOrganizerVerified(user.organizerVerified || false);
            fetchOrganiserStatus();
            fetchProfileStats();
        }
    }, [user, loading, dispatch]);

    const fetchOrganiserStatus = async () => {
        try {
            const response = await CheckOrganizerStatus();
            setOrganizerStatus(response.data.status);
            setAdminNotes(response.data.admin_notes);
            setOrganizerVerified(response.data.organizerVerified);
        } catch (error) {
            console.log(error);
            setOrganizerStatus(null);
            setAdminNotes("");
        }
    };

    useEffect(() => {
        if (user && organizerVerified === false) {
            wsRef.current = new WebSocket(`${baseWebSocketURL}/ws/organizer/${user.id}/`);

            wsRef.current.onopen = () => {
                console.log("web socket connected");
            };
            wsRef.current.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === "status_update") {
                    setOrganizerStatus(data.status);
                    setAdminNotes(data.admin_notes);
                    setOrganizerVerified(data.organizerVerified);
                    if (data.status === "approved") {
                        toast.success("Your organizer request has been approved!", {
                            duration: 3000,
                            className: "text-white p-4 rounded-md",
                        });
                    } else if (data.status === "rejected") {
                        toast.error(`Your organizer request was rejected. ${data.admin_notes || ""}`, {
                            duration: 5000,
                            className: "text-white p-4 rounded-md",
                        });
                    }
                }
            };

            wsRef.current.onclose = () => {
                console.log("WebSocket disconnected");
            };

            wsRef.current.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [user, organizerVerified]);

    const transformSocialLinks = (links) => {
        const result = {};
        links.forEach((link) => {
            result[link.platform] = link.url;
        });
        return result;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setUserData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setUserData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleImageChange = (newImage) => {
        console.log(newImage, "new image");
        setUserData((prev) => ({
            ...prev,
            profilePicture: newImage,
        }));
    };

    const handleSave = (updatedData) => {
        setUserData((prev) => ({
            ...prev,
            ...updatedData,
        }));
        setIsModalOpen(false);
        setIsEditing(false);
    };

    const toggleEditMode = () => {
        setIsModalOpen(true);
        setIsEditing(true);
    };

    const statCards = [
        {
            label: "Events Organized",
            value: statsLoading ? "..." : profileStats.organized_events_count.toString(),
            icon: Calendar,
            color: "text-blue-400",
        },
        {
            label: "Events Participated",
            value: statsLoading ? "..." : profileStats.participated_events_count.toString(),
            icon: Users,
            color: "text-green-400",
        },
        {
            label: "Success Rate",
            value: statsLoading ? "..." : `${profileStats.event_success_rate}%`,
            icon: TrendingUp,
            color: "text-purple-400",
        },
        {
            label: "Badges Earned",
            value: statsLoading ? "..." : profileStats.achieved_badges.length.toString(),
            icon: Award,
            color: "text-yellow-400",
        },
    ];

    const skills = ["Event Planning", "Team Management", "Budget Control", "Marketing"];

    const isProfileComplete = () => {
        return (
            userData.name.trim() !== "" &&
            userData.title.trim() !== "" &&
            userData.email.trim() !== "" &&
            userData.phone.trim() !== "" &&
            userData.location.trim() !== "" &&
            userData.bio.trim() !== ""
        );
    };

    const SubmitOrganizerRequest = async () => {
        if (!isProfileComplete()) {
            toast.error("Complete Your Profile Details!", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
            return;
        }

        try {
            const response = await api.post("users/request-organizer/");
            const message = response.data.message || "Organizer request sent successfully!";

            if (response.data.success) {
                toast.success(message, {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            } else {
                toast.error(message || "Request failed. Please try again.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Error submitting organizer request:", error);
            if (error.response) {
                const { data } = error.response;
                toast.error(data.message || "Something went wrong. Try again later.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            } else {
                toast.error("Network error. Please check your internet connection.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-[#1e1e2f]">Loading...</div>;
    }

    return (
        <div className="min-h-screen text-white bg-[#1e1e2f] rounded-2xl p-5">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="bg-[#252543] rounded-2xl p-6 md:p-8 shadow-lg flex-1 flex flex-col w-full">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group w-28 h-28 md:w-32 md:h-32">
                            <div className="w-full h-full rounded-full bg-[#00EF93] flex items-center justify-center overflow-hidden transition-all duration-300">
                                {userData.profilePicture ? (
                                    <img
                                        src={userData.profilePicture}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-[#ffffff] text-3xl md:text-4xl font-bold">
                                        {user.username?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div
                                    onClick={() => setIsImageModalOpen(true)}
                                    className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="text-[#ffffff]" size={28} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <div className="flex flex-row justify-center md:justify-start items-center gap-2">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#ffffff]">{userData.name}</h2>
                                {user.organizerVerified && (
                                    <MdVerifiedUser className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
                                )}
                            </div>
                            <p className="text-[#10b981] text-lg">{userData.title}</p>
                            {organizerStatus === "rejected" && adminNotes && (
                                <div className="mt-4 p-3 bg-red-900/20 rounded-lg text-red-300 text-sm">
                                    {adminNotes && `Reason for Reject: ${adminNotes}`}
                                </div>
                            )}
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {statCards.map((stat, index) => {
                                    const IconComponent = stat.icon;
                                    return (
                                        <div
                                            key={index}
                                            className="bg-[#2a2a4a] rounded-lg p-4 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 shadow-md"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <IconComponent className={`${stat.color}`} size={16} />
                                                <span className="text-[#9ca3af] text-sm">{stat.label}</span>
                                            </div>
                                            <p className="font-bold text-xl text-[#ffffff]">{stat.value}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex m-auto flex-row md:flex-row justify-center items-center w-1/2 gap-4 bg-[#252543] p-3 rounded-lg">
                        <button
                            onClick={() => toggleEditMode()}
                            className="rounded-lg px-5 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-lg w-full md:w-48 bg-[#2a2a4a] text-[#ffffff] hover:bg-[#3d3d6b]"
                        >
                            <Edit2 size={18} />
                            Edit Profile
                        </button>
                        {!organizerVerified && organizerStatus !== "pending" && !userOrgaVeri && (
                            <button
                                onClick={() => SubmitOrganizerRequest()}
                                className="rounded-lg px-5 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-lg w-full bg-[#f59e0b] text-[#252543] hover:bg-[#d97706] cursor-pointer"
                            >
                                <span>
                                    {organizerStatus === "rejected" ? "ReInitiate Organizer Request" : "Request Organizer"}
                                </span>
                            </button>
                        )}

                        {organizerStatus === "pending" && (
                            <div className="rounded-lg px-1 py-3 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-lg w-full bg-blue-900 text-[#252543] hover:bg-[#d97706] cursor-pointer">
                                <div className="text-yellow-300 text-sm">Organizer request pending approval</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#252543] rounded-2xl p-6 md:p-8 shadow-lg flex-1 flex flex-col w-full">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Personal Information</h3>
                    <div className="space-y-6 flex-grow">
                        <div className="flex items-start gap-4">
                            <Mail className="text-[#00EF93]" size={20} />
                            <div className="w-full">
                                <label className="block text-[#9ca3af] mb-2">Email</label>
                                <p className="text-[#ffffff]">{userData.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Phone className="text-[#00EF93]" size={20} />
                            <div className="w-full">
                                <label className="block text-[#9ca3af] mb-2">Phone</label>
                                <p className="text-[#ffffff]">{userData.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <MapPin className="text-[#00EF93]" size={20} />
                            <div className="w-full">
                                <label className="block text-[#9ca3af] mb-2">Location</label>
                                <p className="text-[#ffffff]">{userData.location}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-full">
                                <label className="block text-[#9ca3af] mb-2">Bio</label>
                                <p className="text-[#ffffff] leading-relaxed">{userData.bio}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#252543] rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93] flex items-center gap-2">
                        <Award className="text-[#00EF93]" size={24} />
                        Achievements & Badges
                    </h3>
                    {statsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-[#9ca3af]">Loading badges...</div>
                        </div>
                    ) : profileStats.achieved_badges.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profileStats.achieved_badges.map((badge, index) => (
                                <div
                                    key={index}
                                    className="bg-[#2a2a4a] rounded-lg p-4 hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#00EF93] flex items-center justify-center">
                                            {badge.icon ? (
                                                <img
                                                    src={badge.icon}
                                                    alt={badge.badge_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Award className="text-white" size={24} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-[#ffffff] text-sm">{badge.badge_name}</h4>
                                            <p className="text-[#9ca3af] text-xs mt-1">{badge.description}</p>
                                            <p className="text-[#00EF93] text-xs mt-1">{formatDate(badge.date)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Award className="mx-auto text-[#9ca3af] mb-4" size={48} />
                            <p className="text-[#9ca3af] text-lg">No badges earned yet</p>
                            <p className="text-[#9ca3af] text-sm mt-2">Participate in events to earn your first badge!</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#252543] rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Performance Overview</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2 items-center">
                                <span className="text-[#ffffff]">Event Success Rate</span>
                                <span className="text-[#10b981] font-bold">
                                    {statsLoading ? "..." : `${profileStats.event_success_rate}%`}
                                </span>
                            </div>
                            <div className="h-2 bg-[#2a2a4a] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#10b981] rounded-full transition-all duration-1000"
                                    style={{ width: statsLoading ? "0%" : `${profileStats.event_success_rate}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-[#2a2a4a] rounded-lg p-4 text-center">
                                <Calendar className="mx-auto text-blue-400 mb-2" size={24} />
                                <p className="text-[#ffffff] font-bold text-lg">
                                    {statsLoading ? "..." : profileStats.organized_events_count}
                                </p>
                                <p className="text-[#9ca3af] text-sm">Organized</p>
                            </div>
                            <div className="bg-[#2a2a4a] rounded-lg p-4 text-center">
                                <Users className="mx-auto text-green-400 mb-2" size={24} />
                                <p className="text-[#ffffff] font-bold text-lg">
                                    {statsLoading ? "..." : profileStats.participated_events_count}
                                </p>
                                <p className="text-[#9ca3af] text-sm">Participated</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userData={userData}
                handleInputChange={handleInputChange}
                handleSave={handleSave}
            />
            <ImageEditModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                currentImage={userData.profilePicture}
                onImageChange={handleImageChange}
            />
        </div>
    );
};

export default Profile_outlet;
