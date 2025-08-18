import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/thunks";

const Logout = () => {
  // FIX: Explicitly type dispatch as 'any' to allow thunks.
  const dispatch: any = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: You can still dispatch to your API to invalidate the session on the server.
    // This part of your original code is fine.
    const authUserString = localStorage.getItem("authUser");
    if (authUserString) {
      try {
        const user = JSON.parse(authUserString);
        const fibepeId = user.FibePeID;
        if (fibepeId) {
          dispatch(logoutUser(fibepeId));
        }
      } catch (e) {
        console.error("Failed to parse authUser for logout API call", e);
      }
    }

    // --- THE CRITICAL FIX ---
    // Immediately remove the user's data from local storage.
    // This is the most important step.
    localStorage.removeItem("authUser");

    // Immediately redirect the user to the login page.
    // We don't need to wait for the API call to finish or check a Redux state.
    // The user should be logged out of the UI instantly.
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  // This component doesn't need to render anything.
  return null;
};

export default Logout;
