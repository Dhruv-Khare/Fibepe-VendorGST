import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { setAuthorization } from "../helpers/api_helper";
import { useDispatch } from "react-redux";
import { useProfile } from "../Components/Hooks/UserHooks";
import { logoutUser } from "../slices/auth/login/thunk";

const AuthProtected = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<any>();
  const { userProfile, loading, token } = useProfile();

  useEffect(() => {
    if (token) {
      setAuthorization(token);
    }

    // If no user profile and not loading, trigger a local logout
    if (!userProfile && !loading && !token) {
      // FIX: Pass null to the logoutUser thunk
      // This will clear local session data without making an API call
      dispatch(logoutUser(null));
    }
  }, [token, userProfile, loading, dispatch]);

  // 👉 Still loading the user profile? Show a loading screen or nothing
  if (loading) {
    return <div>Loading...</div>; // or a loader spinner
  }

  // 👉 If no user after loading is complete, redirect to login
  if (!userProfile || !token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ All good, render the protected children
  return <>{children}</>;
};

export default AuthProtected;
