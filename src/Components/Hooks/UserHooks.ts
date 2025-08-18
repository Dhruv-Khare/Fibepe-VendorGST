import { useSelector } from "react-redux";
import { createSelector } from "reselect";

const useProfile = () => {
  // This selector efficiently gets the entire auth state from the Redux store.
  const profileSelector = createSelector(
    (state: any) => state.Login,
    (loginState) => ({
      userProfile: loginState.userProfile,
      loading: loginState.loading,
      token: loginState.token,
    })
  );

  // useSelector subscribes your component to Redux updates.
  const { userProfile, loading, token } = useSelector(profileSelector);

  // The hook's only job is to return the current Redux state.
  return { userProfile, loading, token };
};

export { useProfile };
