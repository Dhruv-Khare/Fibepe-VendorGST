import React from "react";
import { Routes, Route } from "react-router-dom";

// Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

// Dashboard
import DashboardJobs from "../pages/DashboardJob/index";

// Authentication Pages
import Logout from "../pages/Authentication/Logout";
import CoverSignIn from "../pages/AuthenticationInner/Login/CoverSignIn";
// import BasicTables from "pages/Tables/BasicTables/BasicTables";
// import UpdateSubscriber from "../pages/updateSubscriber/index";
import VendorList from "../pages/VendorList/SelectVendor/index"; // <-- 1. IMPORT THE NEW PAGE
import VendorData from "../pages/VendorList/VendorData/index";
// Route Protectors
import AuthProtected from "./AuthProtected";
import PublicRoute from "./PublicRoutes"; // <-- 1. IMPORT THE NEW COMPONENT
import RechargeDetails from "pages/VendorList/RechargeDetails/index";

// Routes
const authProtectedRoutes = [
  { path: "/dashboard", component: <DashboardJobs /> },
  // { path: "/tables-basic", component: <BasicTables /> },
  // { path: "/update-subscriber", component: <UpdateSubscriber /> },
  { path: "/vendor-list", component: <VendorList /> }, // <-- 2. ADD THE NEW ROUTE
  { path: "/vendor-data", component: <VendorData /> },
  {path: "/recharge-Details", component: <RechargeDetails /> }
];

const publicRoutes = [{ path: "/login", component: <CoverSignIn /> }];

const App = () => {
  return (
    <React.Fragment>
      <Routes>
        {/* Wrap Public Routes */}
        <Route path="/logout" element={<Logout />} />
        <Route>
          {publicRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                // 2. WRAP THE ELEMENT WITH PublicRoute
                <PublicRoute>
                  <NonAuthLayout>{route.component}</NonAuthLayout>
                </PublicRoute>
              }
              key={idx}
            />
          ))}
        </Route>

        {/* Protected Routes (No change needed here) */}
        <Route>
          {authProtectedRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <AuthProtected>
                  <VerticalLayout>{route.component}</VerticalLayout>
                </AuthProtected>
              }
              key={idx}
            />
          ))}
        </Route>
      </Routes>
    </React.Fragment>
  );
};

export default App;
