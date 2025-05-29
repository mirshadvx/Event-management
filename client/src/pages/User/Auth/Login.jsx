import { useState, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { login, RegisterApi, verifyOTP } from "../../../services/api";
import Layout from "../../../components/common/user/auth/layout";
import { useNavigate } from "react-router-dom";
import handleGoogleLogin from "../../../components/layout/user/auth/handleGoogleLogin";
import { useDispatch } from "react-redux";
import { setAuthenticated, setIsUser } from "../../../store/user/userSlice";
import { toast } from "sonner";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    // const [is_login, setLogin] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    const loginFormData = async (data) => {
        try {
            const response = await login({
                username: data.username,
                password: data.password,
            });
            console.log(response);
            if (response.data.success) {
                toast.success("Login Successfully", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                dispatch(setIsUser());
                dispatch(setAuthenticated(true));
                navigate("/");
            } else {
                toast.error("Login failed. Please try again.", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            console.error("Login failed:", error);
            toast.error("Login failed. Please try again.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
        console.log(data);
    };

    return (
        <Layout>
            <form onSubmit={handleSubmit(loginFormData)}>
                {/* Email Field */}
                <div className="mb-4">
                    <span className="text-gray-300 block mb-2">Enter your username*</span>
                    <div className="relative">
                        <input
                            type="text"
                            className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.username ? "border border-red-500" : "border border-gray-700"
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
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-2">
                    <span className="text-gray-300 block mb-2">Enter your password</span>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                errors.password ? "border border-red-500" : "border border-gray-700"
                            }`}
                            placeholder="Password"
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
                    <span className="text-gray-400 cursor-pointer hover:text-blue-900" onClick={() => navigate("/forgot-password")}>
                        forgot password
                    </span>
                </div>

                {/* Login Button */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 cursor-pointer" onClick={() => navigate("/register")}>
                        Need an account?
                    </span>
                    <button
                        type="submit"
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center cursor-pointer"
                    >
                        Login <span className="ml-1">→</span>
                    </button>
                </div>

                {/* Google Sign-In */}
                <div className="flex items-center mb-4">
                    <div className="flex-grow h-px bg-gray-700"></div>
                    <span className="px-4 text-gray-500">OR</span>
                    <div className="flex-grow h-px bg-gray-700"></div>
                </div>
            </form>
            <button
                onClick={() => handleGoogleLogin()}
                className="w-full bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition flex items-center justify-center"
            >
                <FcGoogle className="mr-2 size-6" /> Continue with Google
            </button>
            {/* </form> */}
        </Layout>
    );
};

export default Login;
