import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/admin/Login_layout";
import { admin_login } from "@/services/adminApi";
import { useDispatch } from "react-redux";
import { setAuthenticated, setRole } from "../../store/user/userSlice";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    const loginFormData = async (data) => {
        try {
            const response = await admin_login({
                username: data.username,
                password: data.password,
            });
            
            if (response.data.success) {
                dispatch(setAuthenticated(true));
                dispatch(setRole({ admin: true, user: false }));
                toast.success("Login Successfully", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                navigate("/admin");
            } else {
                toast.error("Login failed", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            const { data } = error.response
            toast.error(data.message || "Login failed", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };
    
    return (
        <Layout>
            <form onSubmit={handleSubmit(loginFormData)}>
                {/* Username Field */}
                <div className="mb-4">
                    <label className="text-gray-700 block mb-2">Enter your username*</label>
                    <div className="relative">
                        <input
                            type="text"
                            className={`w-full bg-white text-gray-900 px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                                errors.username ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Username"
                            {...register("username", {
                                required: "Username is required",
                                pattern: {
                                    value: /^[a-zA-Z0-9._]{3,20}$/,
                                    message: "Invalid username (3-20 chars, letters, numbers, ., _ only)",
                                },
                            })}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-gray-400"
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
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-6">
                    <label className="text-gray-700 block mb-2">Enter your password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`w-full bg-white text-gray-900 px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                                errors.password ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message: "Password must be at least 6 characters",
                                },
                                pattern: {
                                    value: /^[a-zA-Z0-9._]{6,20}$/,
                                    message: "Invalid password (6-20 chars, letters, numbers, ., _ only)",
                                },
                            })}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                                className="h-5 w-5 text-gray-400"
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
                                <FaEyeSlash className="h-5 w-5 text-gray-500" />
                            ) : (
                                <FaEye className="h-5 w-5 text-gray-500" />
                            )}
                        </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end items-center mb-4">
                    <button
                        type="submit"
                        className="bg-[#00FF82] text-black px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center cursor-pointer font-bold"
                    >
                        Login <span className="ml-1">→</span>
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default Login;
