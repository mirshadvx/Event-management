import api from "@/services/api";
import { get_ProfileData } from "@/store/user/userSlice";
import { Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const EditProfileModal = ({ isOpen, onClose, userData, handleInputChange, handleSave }) => {
    const dispatch = useDispatch();
    if (!isOpen) return null;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            username: userData.name || "",
            title: userData.title || "",
            phone: userData.phone || "",
            location: userData.location || "",
            bio: userData.bio || "",
        },
    });

    const onSubmit = async (data) => {
        handleSave(data);
        console.log(data);

        try {
            const response = await api.post("users/update-profile-info/", data);
            if (response.data.success) {
                toast.success("Profile Updated", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                handleSave(data);
                dispatch(get_ProfileData());
                onClose(); 
            } else {
                toast.error("Profile Update Failed", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Update Failed", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className="bg-[#252543] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#00EF93]">Edit Profile</h2>
                    <button onClick={onClose} className="text-[#ffffff] hover:text-[#00EF93]">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-[#9ca3af] mb-2">Name</label>
                        <input
                            type="text"
                            {...register("username")}
                            className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
                        />
                    </div>

                    <div>
                        <label className="block text-[#9ca3af] mb-2">Title</label>
                        <input
                            type="text"
                            {...register("title")}
                            className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
                        />
                    </div>

                    <div>
                        <label className="block text-[#9ca3af] mb-2">Phone</label>
                        <input
                            type="text"
                            {...register("phone", {
                                pattern: {
                                    value: /^\d{10}$/,
                                    message: "Phone number must be exactly 10 digits",
                                },
                            })}
                            className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
                        />
                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className="block text-[#9ca3af] mb-2">Location</label>
                        <input
                            type="text"
                            {...register("location")}
                            className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
                        />
                    </div>

                    <div>
                        <label className="block text-[#9ca3af] mb-2">Bio</label>
                        <textarea
                            {...register("bio")}
                            rows="4"
                            className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] resize-y focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
                        />
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-[#2a2a4a] text-[#ffffff] px-5 py-3 rounded-lg hover:bg-[#3d3d6b] transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-[#10b981] text-[#252543] px-5 py-3 rounded-lg hover:bg-[#0d9f72] transition-all duration-200 flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;

// import api from "@/services/api";
// import { Save, X } from "lucide-react";
// import { useForm} from "react-hook-form";
// import { toast } from "sonner";

// const EditProfileModal = ({ isOpen, onClose, userData, handleInputChange, handleSave }) => {
//     if (!isOpen) return null;

//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//     } = useForm({
//         defaultValues: {
//             username: userData.name || "",
//             title: userData.title || "",
//             phone: userData.phone || "",
//             location: userData.location || "",
//             bio: userData.bio || "",
//         },
//     });

//     const onSubmit = async (data) => {
//         handleSave(data);
//         console.log(data);

//         try {
//             const response = await api.post("users/update-profile-info/", data);
//             if (response.data.success) {
//                 toast.success("Profile Updated", {
//                     duration: 3000,
//                     className: "text-white p-4 rounded-md",
//                 });
//             } else {
//                 toast.error("Profile Update Failed", {
//                     duration: 3000,
//                     className: "text-white p-4 rounded-md",
//                 });
//             }
//         } catch (error) {
//             console.error("Update error:", error);
//             toast.error(error.response?.data?.message || "Update Failed", {
//                 duration: 3000,
//                 className: "text-white p-4 rounded-md",
//             });
//         }
//     };
//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div
//                 className="bg-[#252543] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
//                 style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
//             >
//                 <div className="flex justify-between items-center mb-6">
//                     <h2 className="text-2xl font-bold text-[#00EF93]">Edit Profile</h2>
//                     <button onClick={onClose} className="text-[#ffffff] hover:text-[#00EF93]">
//                         <X size={24} />
//                     </button>
//                  </div>

//                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//                     <div>
//                         <label className="block text-[#9ca3af] mb-2">Name</label>
//                         <input
//                             type="text"
//                             {...register("username")}
//                             className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-[#9ca3af] mb-2">Title</label>
//                         <input
//                             type="text"
//                             {...register("title")}
//                             className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-[#9ca3af] mb-2">Phone</label>
//                         <input
//                             type="text"
//                             {...register("phone")}
//                             className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-[#9ca3af] mb-2">Location</label>
//                         <input
//                             type="text"
//                             {...register("location")}
//                             className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-[#9ca3af] mb-2">Bio</label>
//                         <textarea
//                             {...register("bio")}
//                             rows="4"
//                             className="bg-[#2a2a4a] border border-[#3d3d6b] rounded-lg p-3 w-full text-[#ffffff] resize-y focus:outline-none focus:ring-2 focus:ring-[#00EF93]"
//                         />
//                     </div>

//                     <div className="flex justify-end gap-4">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="bg-[#2a2a4a] text-[#ffffff] px-5 py-3 rounded-lg hover:bg-[#3d3d6b] transition-all duration-200"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             className="bg-[#10b981] text-[#252543] px-5 py-3 rounded-lg hover:bg-[#0d9f72] transition-all duration-200 flex items-center gap-2"
//                         >
//                             <Save size={18} />
//                             Save Changes
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default EditProfileModal;
