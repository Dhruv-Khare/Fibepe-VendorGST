//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess } from "./reducer";

import {
  apiError,
  setUserProfile,
  setToken,
  reset_login_flag,
} from "./reducer";

export const loginUser = (user: any, history: any) => async (dispatch: any) => {
  try {
    let response;
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      let fireBaseBackend: any = getFirebaseBackend();
      response = fireBaseBackend.loginUser(user.email, user.password);
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      response = postJwtLogin({
        mobileNumber: user.mobileNumber,
        otp: user.otp,
      });
    } else if (process.env.REACT_APP_DEFAULTAUTH) {
      response = postFakeLogin({
        mobileNumber: user.mobileNumber,
        otp: user.otp,
      });
    }

    var data = await response;

    if (data) {
      localStorage.setItem("authUser", JSON.stringify(data));
      if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
        var finallogin: any = JSON.stringify(data);
        finallogin = JSON.parse(finallogin);
        data = finallogin.data;
        if (finallogin.status === "success") {
          dispatch(loginSuccess(data));
          history("/dashboard");
        } else {
          dispatch(apiError(finallogin));
        }
      } else {
        dispatch(loginSuccess(data));
        history("/dashboard");
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};
// export const requestOtp = (mobileNumber: string) => async (dispatch: any) => {
//   try {
//     const response = await fetch(
//       "https://adminmanagement.fibepe.com/api/User/Admin/Login",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ mobileNumber }),
//       }
//     );
//     const data = await response.json();
//     if (data.IsSuccess) {
//       // Handle success case
//     } else {
//       dispatch(
//         apiError(data.Message || "Failed to request OTP. Please try again.")
//       );
//     }
//   } catch (error) {
//     dispatch(apiError("An error occurred. Please try again."));
//   }
// };

// export const verifyOtp =
//   (mobileNumber: string, otp: string,  navigate: any) =>
//   async (dispatch: any) => {
//     try {
//       const response = await fetch(
//         "https://adminmanagement.fibepe.com/api/User/Admin/VerifyOTP",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ mobileNumber, otp}),
//         }
//       );
//       const data = await response.json();
//       if (data.IsSuccess && data.token) {
//         dispatch(setUserProfile(data.userProfile));
//         dispatch(setToken(data.token));
//         sessionStorage.setItem("authUser", JSON.stringify(data));
//         // Navigate to dashboard
//         navigate("/dashboard-job");
//       } else {
//         dispatch(apiError(data.Message || "Invalid OTP. Please try again."));
//       }
//     } catch (error) {
//       dispatch(apiError("An error occurred. Please try again."));
//     }
//   };

// REPLACE the old logoutUser function with this new one
// In your slices/auth/login/thunk.ts file

export const logoutUser =
  (fibepeId: string | number | null) => async (dispatch: any) => {
    try {
      if (fibepeId) {
        // 1. Construct the URL with the query parameter
        const apiUrl = `https://adminmanagement.fibepe.com/api/User/Admin/Logout?fibepeId=${fibepeId}`;

        const response = await fetch(apiUrl, {
          method: "POST", // The method is still POST
          // 2. Remove the headers and body, as they are no longer needed
        });

        if (!response.ok) {
          throw new Error("API logout failed");
        }
      }

      sessionStorage.removeItem("authUser");
      dispatch(logoutUserSuccess(true));
    } catch (error) {
      dispatch(apiError(error));
    }
  };

export const socialLogin =
  (type: any, history: any) => async (dispatch: any) => {
    try {
      let response;

      if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
        const fireBaseBackend: any = getFirebaseBackend();
        response = fireBaseBackend.socialLoginUser(type);
      }
      //  else {
      //   response = postSocialLogin(data);
      // }

      const socialdata = await response;
      if (socialdata) {
        sessionStorage.setItem("authUser", JSON.stringify(response));
        dispatch(loginSuccess(response));
        history("/dashboard");
      }
    } catch (error) {
      dispatch(apiError(error));
    }
  };

export const resetLoginFlag = () => async (dispatch: any) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};
