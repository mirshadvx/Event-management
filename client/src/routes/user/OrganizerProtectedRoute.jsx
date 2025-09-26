import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

const OrganizerProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.user);

  useEffect(() => {
    if (isAuthenticated && !user?.organizerVerified) {
      toast.error("Verify your account for Organizer!!", {
        id: "organizer-verification-toast",
        duration: 1000,
        className: "text-white p-4 rounded-md",
      });
    }
  }, [isAuthenticated, user?.organizerVerified]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.organizerVerified) {
    return <Navigate to="/profile/" replace />;
  }

  return children;
};

export default OrganizerProtectedRoute;
// import React from "react";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";
// import { toast } from "sonner";

// const OrganizerProtectedRoute = ({ children }) => {
//     const { isAuthenticated, user } = useSelector((state) => state.user);

//     if (!isAuthenticated) {
//         return <Navigate to="/login" replace />;
//     }

//     if (!user?.organizerVerified) {
//         return (
//             <>
//                 <Navigate to="/profile/" replace />
//                 {toast.error("Verify your account for Organizer!!", {
//                     duration: 1000,
//                     className: "text-white p-4 rounded-md",
//                 })}
//             </>
//         );
//     }

//     return children;
// };

// export default OrganizerProtectedRoute;
