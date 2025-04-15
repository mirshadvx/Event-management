import { useEffect, useRef, useState } from "react";
import { get_ProfileData } from "@/store/user/userSlice";
import {
    Edit2,
    Save,
    AlertCircle,
    Camera,
    Twitter,
    Linkedin,
    Instagram,
    Github,
    Globe,
    MapPin,
    Mail,
    Phone,
    X,
} from "lucide-react";
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
    const [userOrgaVeri, setuserOrgaVeri] = useState(false);
    const [organizerStatus, setOrganizerStatus] = useState(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [organizerVerified, setOrganizerVerified] = useState(false);
    const wsRef = useRef();
    const baseWebSocketURL = import.meta.env.VITE_WEBSOCKET_URL;

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

    const handleToggleChange = (name) => {
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setUserData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: !prev[parent][child],
                },
            }));
        }
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
        { label: "Events Managed", value: "128" },
        { label: "Attendees", value: "5.6k" },
        { label: "Rating", value: "4.5" },
    ];

    const skills = ["Event Planning", "Team Management", "Budget Control", "Marketing"];

    const renderSocialIcon = (platform) => {
        switch (platform) {
            case "twitter":
                return <Twitter className="text-[#00EF93]" size={20} />;
            case "linkedin":
                return <Linkedin className="text-[#00EF93]" size={20} />;
            case "instagram":
                return <Instagram className="text-[#00EF93]" size={20} />;
            case "github":
                return <Github className="text-[#00EF93]" size={20} />;
            case "website":
            default:
                return <Globe className="text-[#00EF93]" size={20} />;
        }
    };

    const isProfileComplete = () => {
        return (
            userData.name.trim() !== "" &&
            userData.title.trim() !== "" &&
            userData.email.trim() !== "" &&
            userData.phone.trim() !== "" &&
            userData.location.trim() !== "" &&
            userData.bio.trim() !== ""
            //  &&
            // Object.keys(userData.socialLinks).length > 0
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
                            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
                                {statCards.map((stat, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#2a2a4a] rounded-lg p-4 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 shadow-md"
                                    >
                                        <span className="text-[#9ca3af] text-sm block mb-1">{stat.label}</span>
                                        <p className="font-bold text-xl text-[#ffffff]">{stat.value}</p>
                                    </div>
                                ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="bg-[#252543] rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Social Links</h3>
                    <div className="space-y-6">
                        {user.social_media_links &&
                            user.social_media_links.map((link, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    {renderSocialIcon(link.platform)}
                                    <div className="w-full">
                                        <label className="block text-[#9ca3af] mb-2">
                                            {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                                        </label>
                                        <p className="text-[#ffffff]">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {link.url}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        {(!user.social_media_links || user.social_media_links.length === 0) && (
                            <p className="text-[#9ca3af]">No social links added yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-[#252543] rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Account Settings</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#ffffff]">Notifications</p>
                                <p className="text-[#9ca3af] text-sm mt-1">Receive event updates</p>
                            </div>
                            <div
                                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
                                    userData.preferences.notifications ? "bg-[#10b981]" : "bg-[#2a2a4a]"
                                } cursor-default`}
                                onClick={() => handleToggleChange("preferences.notifications")}
                            >
                                <div
                                    className={`absolute w-5 h-5 bg-white rounded-full top-[2px] transition-transform duration-200 ease-in-out shadow-md ${
                                        userData.preferences.notifications ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#ffffff]">Marketing Emails</p>
                                <p className="text-[#9ca3af] text-sm mt-1">Receive marketing emails</p>
                            </div>
                            <div
                                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
                                    userData.preferences.marketingEmails ? "bg-[#10b981]" : "bg-[#2a2a4a]"
                                } cursor-default`}
                                onClick={() => handleToggleChange("preferences.marketingEmails")}
                            >
                                <div
                                    className={`absolute w-5 h-5 bg-white rounded-full top-[2px] transition-transform duration-200 ease-in-out shadow-md ${
                                        userData.preferences.marketingEmails ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#ffffff]">Two-Factor Auth</p>
                                <p className="text-[#9ca3af] text-sm mt-1">Enable two-factor authentication</p>
                            </div>
                            <div
                                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${
                                    userData.preferences.twoFactorAuth ? "bg-[#10b981]" : "bg-[#2a2a4a]"
                                } cursor-default`}
                                onClick={() => handleToggleChange("preferences.twoFactorAuth")}
                            >
                                <div
                                    className={`absolute w-5 h-5 bg-white rounded-full top-[2px] transition-transform duration-200 ease-in-out shadow-md ${
                                        userData.preferences.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#252543] rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Performance</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2 items-center">
                                <span className="text-[#ffffff]">Event Success Rate</span>
                                <span className="text-[#10b981] font-bold">98%</span>
                            </div>
                            <div className="h-2 bg-[#2a2a4a] rounded-full overflow-hidden">
                                <div className="h-full w-[98%] bg-[#10b981] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2 items-center">
                                <span className="text-[#ffffff]">Client Satisfaction</span>
                                <span className="text-[#10b981] font-bold">95%</span>
                            </div>
                            <div className="h-2 bg-[#2a2a4a] rounded-full overflow-hidden">
                                <div className="h-full w-[95%] bg-[#10b981] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#252543] rounded-xl p-8 mt-8 shadow-lg">
                <h3 className="text-xl font-semibold mb-6 text-[#00EF93]">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-3">
                    {skills.map((skill, index) => (
                        <div
                            key={index}
                            className="bg-[#2a2a4a] rounded-lg px-4 py-2 border border-[#3d3d6b] hover:shadow-md hover:border-[#00EF93] transition-all duration-200"
                        >
                            <span className="text-[#ffffff]">{skill}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#252543] rounded-xl p-8 mt-8 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-[#00EF93]">Recent Activity</h3>
                    <a
                        href="/profile/events"
                        className="text-[#10b981] text-sm hover:underline transition-colors duration-200"
                    >
                        View All Events
                    </a>
                </div>
                <div className="space-y-4">
                    {/* <div className="bg-[#2a2a4a] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-200 shadow-sm cursor-pointer">
                        <div>
                            <h4 className="font-medium text-lg text-[#ffffff]">Music</h4>
                            <div className="flex items-center gap-3 text-[#9ca3af] text-sm mt-2">
                                <span>Mumbai</span>
                                <span>•</span>
                                <span>167 Attendees</span>
                                <span>•</span>
                                <span>₹299.00</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 md:mt-0">
                            <span className="text-[#9ca3af]">Mar 15-17, 2025</span>
                            <span className="bg-[#10b981] text-[#252543] px-3 py-1 rounded-md text-sm font-medium">
                                Upcoming
                            </span>
                        </div>
                    </div> */}
                    {/* Similar for Django Meet */}
                </div>
            </div>

            {/* <div className="bg-[#252543] rounded-xl p-8 mt-8 shadow-lg">
                <div className="flex items-start gap-4">
                    <AlertCircle className="text-[#f59e0b]" size={24} />
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-[#00EF93]">Security Notice</h3>
                        <p className="text-[#9ca3af] leading-relaxed">
                            To protect your account, please review your security settings regularly and ensure your contact
                            information is up to date.
                        </p>
                    </div>
                </div>
            </div> */}

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
