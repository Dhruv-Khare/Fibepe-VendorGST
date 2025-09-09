import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
} from "reactstrap";
// 1. Import Redux hooks and the logoutUser action
import { useDispatch } from "react-redux";
import { logoutUser } from "../../slices/auth/login/thunk";

// Import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";

interface AuthUser {
  UserName: string;
  FibePeID?: string | number; // Make sure to include the ID property
}
const ProfileDropdown = () => {
  const dispatch = useDispatch<any>();
  // State to hold the user's name, with a default value
  const [userName, setUserName] = useState("Admin");

  // State for managing the dropdown's visibility
  const [isProfileDropdown, setIsProfileDropdown] = useState(false);

  useEffect(() => {
    // sessionStorage.getItem returns `string | null`.
    const authUserString = localStorage.getItem("authUser");

    if (authUserString) {
      // 3. Type the parsed user object to avoid the default `any` type.
      const loggedInUser: AuthUser = JSON.parse(authUserString);

      // TypeScript now knows `loggedInUser` has a `UserName` property.
      setUserName(loggedInUser.UserName || "Admin");
    }
  }, []);

  // Function to toggle the dropdown menu
  const toggleProfileDropdown = () => {
    setIsProfileDropdown(!isProfileDropdown);
  };

  // --- THIS IS THE CORRECTED LOGOUT FUNCTION ---
  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const authUserString = localStorage.getItem("authUser");
    let fibepeId: string | number | null = null;

    if (authUserString) {
      try {
        const loggedInUser: AuthUser = JSON.parse(authUserString);
        fibepeId = loggedInUser.FibePeID ?? null; // Use the correct key for the user ID
      } catch (e) {
        console.error("Failed to parse authUser for logout", e);
      }
    }

    // 1. Dispatch the action to the server (optional but good practice)
    dispatch(logoutUser(fibepeId));

    // 2. Immediately clear the user's session from the browser
    localStorage.removeItem("authUser");

    // 3. Redirect the user to the login page
    window.location.href = "/login";
  };

  return (
    <React.Fragment>
      <Dropdown
        isOpen={isProfileDropdown}
        toggle={toggleProfileDropdown}
        className="ms-sm-3 header-item topbar-user"
      >
        <DropdownToggle tag="button" type="button" className="btn shadow-none">
          <span className="d-flex align-items-center">
            <img
              className="rounded-circle header-profile-user"
              src={avatar1}
              alt="Header Avatar"
            />
            <span className="text-start ms-xl-2">
              {/* Display the user's name from the state */}
              <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">
                {userName}
              </span>
              <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">
                Founder
              </span>
            </span>
          </span>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          {/* Welcome the user with their name */}
          <h6 className="dropdown-header">Welcome {userName}!</h6>
          <DropdownItem className="p-0">
            <Link to="/profile" className="dropdown-item">
              <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
              <span className="align-middle">Profile</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to="/apps-chat" className="dropdown-item">
              <i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Messages</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to={"#"} className="dropdown-item">
              <i className="mdi mdi-calendar-check-outline text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Taskboard</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to="/pages-faqs" className="dropdown-item">
              <i className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Help</span>
            </Link>
          </DropdownItem>
          <div className="dropdown-divider"></div>
          <DropdownItem className="p-0">
            <Link to="/pages-profile" className="dropdown-item">
              <i className="mdi mdi-wallet text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">
                Balance : <b>$5971.67</b>
              </span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to="/pages-profile-settings" className="dropdown-item">
              <span className="badge bg-success-subtle text-success mt-1 float-end">
                New
              </span>
              <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Settings</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <Link to="/auth-lockscreen-basic" className="dropdown-item">
              <i className="mdi mdi-lock text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle">Lock screen</span>
            </Link>
          </DropdownItem>
          <DropdownItem className="p-0">
            <a href="/logout" onClick={handleLogout} className="dropdown-item">
              <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>{" "}
              <span className="align-middle" data-key="t-logout">
                Logout
              </span>
            </a>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

export default ProfileDropdown;
