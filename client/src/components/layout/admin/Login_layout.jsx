import { useNavigate } from "react-router-dom";

const Login_layout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gray-100 p-4">
      <div className="bg-white rounded-xl p-8 pt-6 shadow-md w-full max-w-md">
        <h2 className="text-gray-900 text-2xl font-medium mb-1">Hola, to Evenxo Admin</h2>
        {children}
      </div>
    </div>
  );
};

export default Login_layout;
