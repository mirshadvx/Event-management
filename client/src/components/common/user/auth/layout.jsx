import { useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const is_login = location.pathname === "/login";

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 to-gray-950 flex items-center justify-center p-4">
            <div className="absolute top-0 w-full flex justify-between items-center p-4">
                <div className="flex items-center">
                    <div className="bg-white h-8 w-10 rounded-sm mr-2"></div>
                    <span className="text-white text-xl">Evenxo</span>
                </div>
                {is_login ? (
                    <button
                        className="bg-transparent border border-gray-600 text-white px-4 py-1 rounded-md hover:bg-gray-800 transition"
                        onClick={() => navigate("/register")}
                    >
                        Register
                    </button>
                ) : (
                    <button
                        className="bg-transparent border border-gray-600 text-white px-4 py-1 rounded-md hover:bg-gray-800 transition"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                )}
            </div>
            <div className="login_div flex w-full max-w-4xl mt-7">
                <div className="bg-gray-900 bg-opacity-60 rounded-xl p-8 pt-6 backdrop-blur-sm w-full max-w-md">
                    <h2 className="text-white text-2xl font-medium mb-1">Hola, to Evenxo</h2>
                    <p className="text-gray-400 mb-3">
                        {is_login ? "Login now to access your account!" : "Sign In now to make your event Awesome!"}
                    </p>
                    {children}
                </div>

                {/* Mascot Image */}
                <div className="hidden md:flex items-center justify-center flex-1">
                    <div className="relative">
                        <div className="w-48 h-48 bg-red-400 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-8 left-0 right-0 flex justify-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full absolute -top-8 left-1/2 transform -translate-x-1/2"></div>
                                <div className="flex space-x-6 mt-4">
                                    <div className="w-8 h-4 bg-black rounded-t-full"></div>
                                    <div className="w-8 h-4 bg-black rounded-t-full"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                <div className="w-20 h-10 bg-red-500 rounded-t-full overflow-hidden flex justify-center">
                                    <div className="w-14 h-3 bg-white rounded-lg mt-1"></div>
                                </div>
                            </div>
                            <div className="absolute top-12 left-6 w-6 h-4 bg-pink-300 rounded-full"></div>
                            <div className="absolute top-12 right-6 w-6 h-4 bg-pink-300 rounded-full"></div>
                        </div>
                        <div className="absolute -left-6 top-20 w-4 h-12 bg-green-400 rounded-full"></div>
                        <div className="absolute -right-6 top-20 w-4 h-12 bg-green-400 rounded-full"></div>
                        <div className="absolute -bottom-8 left-10 w-4 h-12 bg-green-400 rounded-full"></div>
                        <div className="absolute -bottom-8 right-10 w-4 h-12 bg-green-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
