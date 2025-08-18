import React from "react";
import { Routes, Route } from "react-router-dom";

// Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

// Dashboard
import DashboardEcommerce from "../pages/DashboardEcommerce/index";

// Authentication Pages
import Logout from "../pages/Authentication/Logout";
import CoverSignIn from "../pages/AuthenticationInner/Login/CoverSignIn";
import BasicTables from "pages/Tables/offlineDataTable/OfflineTable";

// Route Protectors
import AuthProtected from "./AuthProtected";
import PublicRoute from "./PublicRoutes"; // <-- 1. IMPORT THE NEW COMPONENT

// Routes
const authProtectedRoutes = [
  { path: "/dashboard", component: <DashboardEcommerce /> },
  { path: "/tables-offileData", component: <BasicTables /> },
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
