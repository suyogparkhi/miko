import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center bg-gray-900/80 border border-gray-700/50 rounded-2xl p-12 shadow-2xl">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">404</h1>
        <p className="text-2xl text-gray-300 mb-6">Oops! Page not found</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
