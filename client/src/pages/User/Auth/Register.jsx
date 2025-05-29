import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { RegisterApi, verifyOTP, checkUsername } from "../../../services/api";
import Layout from "../../../components/common/user/auth/layout";
import { useNavigate } from "react-router-dom";
import handleGoogleLogin from "../../../components/layout/user/auth/handleGoogleLogin";
import { toast } from "sonner";

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [timeLeft, setTimeLeft] = useState(120);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
    const otpRefs = useRef([]);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setValue,
    } = useForm({
        mode: "onChange",
    });

    useEffect(() => {
        if (otpSent && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
        if (timeLeft === 0) {
            toast.error("OTP has expired. Please request a new one.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    }, [otpSent, timeLeft]);

    useEffect(() => {
        const username = watch("username");
        const checkUsernameAvailability = async () => {
            if (username) {
                try {
                    const response = await checkUsername(username);
                    setIsUsernameAvailable(!response.data.exists);
                } catch (error) {
                    console.error("Error checking username availability:", error);
                }
            }
        };

        const debounceTimer = setTimeout(checkUsernameAvailability, 500);
        return () => clearTimeout(debounceTimer);
    }, [watch("username")]);

    const registerFormData = async (data) => {
        if (!isUsernameAvailable) {
            toast.error("Username is already taken. Please choose another one.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
            return;
        }

        try {
            const response = await RegisterApi({
                username: data.username,
                email: data.email,
                password: data.password,
            });
            if (response.data.success) {
                toast.success("OTP sent successfully", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                setRegisteredEmail(data.email);
                setOtpSent(true);
                setTimeLeft(120);
            }
        } catch (error) {
            toast.error("Registration failed. Please try again.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    const verifyOtpSubmit = async (data) => {
        if (timeLeft === 0) {
            toast.error("OTP has expired. Please request a new one.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
            return;
        }

        const enteredOtp = data.otp.join("");
        try {
            const response = await verifyOTP({
                email: registeredEmail,
                otp: enteredOtp,
            });

            if (response.data.success) {
                toast.success("Registration successful", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                navigate("/login");
            } else {
                toast.error(response.data.error || "Invalid OTP", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
            }
        } catch (error) {
            toast.error("Invalid OTP. Please try again.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    const handleOtpInput = (index, e) => {
        const value = e.target.value;
        if (!/^\d?$/.test(value)) return;
        setValue(`otp[${index}]`, value);
        if (value.length === 1 && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !watch(`otp[${index}]`) && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleResendOtp = async () => {
        if (timeLeft > 0) {
            toast.info("Please wait until the current OTP expires", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
            return;
        }

        try {
            const response = await RegisterApi({
                username: watch("username"),
                email: registeredEmail,
                password: watch("password"),
            });
            if (response.data.success) {
                toast.success("OTP resent successfully!", {
                    duration: 3000,
                    className: "text-white p-4 rounded-md",
                });
                setTimeLeft(120);
            }
        } catch (error) {
            toast.error("Failed to resend OTP. Please try again.", {
                duration: 3000,
                className: "text-white p-4 rounded-md",
            });
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" + secs : secs}`;
    };

    return (
        <Layout>
            {!otpSent ? (
                <form onSubmit={handleSubmit(registerFormData)}>
                    <div className="mb-4">
                        <span className="text-gray-300 block mb-2">Enter your Username*</span>
                        <div className="relative">
                            <input
                                type="text"
                                className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    errors.username || !isUsernameAvailable
                                        ? "border border-red-500"
                                        : "border border-gray-700"
                                }`}
                                placeholder="Username"
                                {...register("username", {
                                    required: "Username is required",
                                    pattern: {
                                        value: /^[a-zA-Z0-9._]{5,20}$/,
                                        message: "Invalid username (5-20 chars, letters, numbers, ., _ only)",
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
                                        d="M5.121 17.804A4 4 0 0110 16h4a4 4 0 014.879 1.804M12 14a4 4 0 100-8 4 4 0 000 8z"
                                    ></path>
                                </svg>
                            </div>
                        </div>
                        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                        {!isUsernameAvailable && <p className="text-red-500 text-sm mt-1">Username is already taken.</p>}
                    </div>

                    <div className="mb-4">
                        <span className="text-gray-300 block mb-2">Enter your Email*</span>
                        <div className="relative">
                            <input
                                type="email"
                                className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    errors.email ? "border border-red-500" : "border border-gray-700"
                                }`}
                                placeholder="Email address"
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

                    <div className="mb-4">
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
                    </div>

                    <div className="mb-6">
                        <span className="text-gray-300 block mb-2">Confirm password</span>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`w-full bg-gray-800 text-white px-10 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    errors.confirmPassword ? "border border-red-500" : "border border-gray-700"
                                }`}
                                placeholder="Confirm password"
                                {...register("confirmPassword", {
                                    required: "Confirm password is required",
                                    validate: (value) => value === watch("password") || "Passwords do not match",
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
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <FaEye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400 cursor-pointer" onClick={() => navigate("/login")}>
                            Already have account
                        </span>
                        <button
                            type="submit"
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
                        >
                            Get OTP <span className="ml-1">→</span>
                        </button>
                    </div>

                    <div className="flex items-center mb-4">
                        <div className="flex-grow h-px bg-gray-700"></div>
                        <span className="px-4 text-gray-500">OR</span>
                        <div className="flex-grow h-px bg-gray-700"></div>
                    </div>
                    <button
                        type="button"
                        className="w-full bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition flex items-center justify-center"
                        onClick={() => handleGoogleLogin()}
                    >
                        <FcGoogle className="mr-2 size-6" /> Continue with Google
                    </button>
                </form>
            ) : (
                <form onSubmit={handleSubmit(verifyOtpSubmit)}>
                    <div className="mb-6">
                        <label className="text-gray-300 block mb-4 text-center text-lg">Enter your 6-digit OTP</label>
                        <div className="flex justify-center space-x-2 mb-4">
                            {[...Array(6)].map((_, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength={1}
                                    className={`w-12 h-16 bg-gray-800 text-white text-center text-xl rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border ${
                                        errors.otp?.[index] ? "border-red-500" : "border-gray-700"
                                    } hover:border-purple-500 transition-all`}
                                    placeholder="-"
                                    {...register(`otp[${index}]`, {
                                        required: "OTP is required",
                                        pattern: {
                                            value: /^[0-9]$/,
                                            message: "Only numbers are allowed",
                                        },
                                    })}
                                    ref={(el) => (otpRefs.current[index] = el)}
                                    onChange={(e) => handleOtpInput(index, e)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={timeLeft === 0}
                                />
                            ))}
                        </div>
                        <div className="text-center text-gray-400 mb-4">
                            Time remaining:{" "}
                            <span className={timeLeft <= 10 ? "text-red-500" : "text-white"}>{formatTime(timeLeft)}</span>
                        </div>
                        {timeLeft === 0 && (
                            <p className="text-red-500 text-center mb-4">OTP has expired. Please request a new one.</p>
                        )}
                    </div>
                    <div className="flex gap-8">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            className={`w-full py-3 rounded-md transition font-medium ${
                                timeLeft > 0
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-[#402853] text-white hover:bg-purple-700"
                            }`}
                            disabled={timeLeft > 0}
                        >
                            Resend OTP
                        </button>
                        <button
                            type="submit"
                            className={`w-full py-3 rounded-md transition font-medium ${
                                timeLeft === 0
                                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                            disabled={timeLeft === 0}
                        >
                            Verify OTP
                        </button>
                    </div>
                </form>
            )}
        </Layout>
    );
};

export default Register;
