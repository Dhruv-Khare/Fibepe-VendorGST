import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  token: null as string | null, // Change this from string to string | null
  userProfile: null as any | null, // Add this property
  user: {} as any | null, // Good practice to also allow user to be null
  loading: false,
  error: "",
  isUserLogout: false,
  errorMsg: false,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    apiError(state, action) {
      state.error = action.payload.data;
      state.loading = false;
      state.isUserLogout = false;
      state.errorMsg = true;
    },
    // Inside your createSlice `reducers` object...

    loginSuccess(state, action) {
      // The 'action.payload' contains the user data from your login API
      state.token = action.payload.token;
      state.userProfile = action.payload; // Or action.payload.user, depending on your API response
      state.isUserLogout = false;
      state.loading = false; // Most important: set loading to false
    },
    logoutUserSuccess(state, action) {
      state.isUserLogout = true;
      state.userProfile = null; // Add this line
      state.token = null; // Add this line
      state.loading = false; // Also a good idea to reset loading state
    },
    reset_login_flag(state) {
      state.error = "";
      state.loading = false;
      state.errorMsg = false;
    },
    setUserProfile(state, action) {
      state.user = action.payload;
    },
    setToken(state, action) {
      state.token = action.payload;
    },
  },
});

export const {
  apiError,
  loginSuccess,
  logoutUserSuccess,
  reset_login_flag,
  setUserProfile,
  setToken,
} = loginSlice.actions;
export default loginSlice.reducer;
