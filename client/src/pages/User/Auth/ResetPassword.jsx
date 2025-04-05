import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import Layout from "../../../components/common/user/auth/layout";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../../services/api"; // Assume this is your API call for reset password
import { toast } from "sonner";

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { token } = useParams();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    const resetPasswordFormData = async (data) => {
        console.log(token," tokensss  ");
        
        try {
            const response = await resetPassword({
                token,
                password: data.password,
            });
            if (response.data.success) {
                toast.success("Password reset successfully! You can now log in.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                navigate("/login");
            } else {
                toast.error( response.data.message || "Failed to reset password. Please try again.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Reset password failed:", error);
            toast.error("Invalid token or request failed.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    return (
        <Layout>
            <form onSubmit={handleSubmit(resetPasswordFormData)}>
                {/* Password Field */}
                <div className="mb-6">
                    <label className="text-gray-300 block mb-2">Enter your new password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.password ? "border border-red-500" : "border border-gray-700"
                            }`}
                            placeholder="New Password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters",
                                },
                            })}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                ></path>
                            </svg>
                        </div>
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <FaEyeSlash className="h-5 w-5 text-gray-400" />
                            ) : (
                                <FaEye className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 cursor-pointer" onClick={() => navigate("/login")}>
                        Back to Login
                    </span>
                    <button
                        type="submit"
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center cursor-pointer"
                    >
                        Reset Password <span className="ml-1">→</span>
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default ResetPassword;