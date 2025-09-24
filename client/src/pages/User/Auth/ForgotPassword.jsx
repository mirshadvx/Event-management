import { useState } from "react";
import { useForm } from "react-hook-form";
import Layout from "../../../components/common/user/auth/layout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { forgotPassword } from "../../../services/api"; // Assume this is your API call for forgot password

const ForgotPassword = () => {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    const forgotPasswordFormData = async (data) => {
        try {
            const response = await forgotPassword({ email: data.email });
            if (response.data.success) {
                toast.success("Password reset email sent! Check your inbox.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                navigate("/login");
            } else {
                toast.error("Failed to send reset email. Please try again.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Forgot password failed:", error);
            toast.error( error?.response?.data?.message || "Something went wrong. Please try again.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    return (
        <Layout>
            <form onSubmit={handleSubmit(forgotPasswordFormData)}>
                {/* Email Field */}
                <div className="mb-4">
                    <label className="text-gray-300 block mb-2">Enter your email*</label>
                    <div className="relative">
                        <input
                            type="email"
                            className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.email ? "border border-red-500" : "border border-gray-700"
                            }`}
                            placeholder="Email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                    message: "Invalid email address",
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
                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                ></path>
                            </svg>
                        </div>
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
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
                        Send Reset Link <span className="ml-1">→</span>
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default ForgotPassword;