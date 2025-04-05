import { useState } from "react";
import { Save, Camera, X } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

const ImageEditModal = ({ isOpen, onClose, currentImage, onImageChange }) => {
    const [previewUrl, setPreviewUrl] = useState(currentImage);
    const [selectedFile, setSelectedFile] = useState(null);

    // console.log('preview image ',previewUrl, currentImage);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            onImageChange(URL.createObjectURL(file));
        }
    };

    const onSubmit = async () => {
        if (!selectedFile) {
            alert("Please select an image first");
            return;
        }

        const formData = new FormData();
        formData.append("profile_picture", selectedFile);
        onClose();
        try {
            const response = await api.post(`users/update-profile-picture/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success("Image uploaded successfully", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                onClose();
            } else {
                toast.error(`Upload failed: + ${response.data.message}`, {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(`Upload failed: add below 8MB`, {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#252543] rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#00EF93]">Edit Profile Image</h2>
                    <button onClick={onClose} className="text-[#ffffff] hover:text-[#00EF93]">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-[#00EF93] flex items-center justify-center overflow-hidden mb-4">
                            {currentImage ? (
                                <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="text-[#ffffff]" size={40} />
                            )}
                        </div>
                        <label className="bg-[#2a2a4a] text-[#ffffff] px-4 py-2 rounded-lg cursor-pointer hover:bg-[#3d3d6b]">
                            Upload New Image
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="bg-[#2a2a4a] text-[#ffffff] px-5 py-3 rounded-lg hover:bg-[#3d3d6b]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            className="bg-[#10b981] text-[#252543] px-5 py-3 rounded-lg hover:bg-[#0d9f72] flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditModal;
