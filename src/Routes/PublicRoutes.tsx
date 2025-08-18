import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  // Redux state (useProfile hook) par nirbhar hone ke bajaye,
  // hum seedhe localStorage check karenge. Ye turant result deta hai.
  const authUser = localStorage.getItem("authUser");

  if (authUser) {
    try {
      const userData = JSON.parse(authUser);
      // Check karein ki object mein token hai ya nahi.
      if (userData && userData.token) {
        // Agar token localStorage mein hai, to user logged in hai.
        // Use turant dashboard par bhej do.
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      // Agar JSON parse karne mein error aaye, to aage badhne do
      // taaki login page dikh sake.
      console.error("localStorage se authUser parse karne mein error:", error);
    }
  }

  // Agar localStorage mein token nahi hai, to user logged out hai.
  // Login page (ya jo bhi public page hai) dikhao.
  return <>{children}</>;
};

export default PublicRoute;
