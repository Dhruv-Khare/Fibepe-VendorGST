import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

//import Scss
import "./assets/scss/themes.scss";

//imoprt Route
import { Routes, Route } from "react-router-dom";
// Import Redux hooks
import { useDispatch } from "react-redux";
import { Spinner } from "reactstrap";

// Import actions and helpers
import { loginSuccess } from "./slices/auth/login/reducer"; // Adjust the import path as per your project structure
import { setAuthorization } from "./helpers/api_helper"; // Adjust the import path

//import components
import CoverSignIn from "./pages/AuthenticationInner/Login/CoverSignIn";
import DashboardJobs from "./pages/DashboardJob/index";
import AuthProtected from "./Routes/AuthProtected";
import PublicRoute from "./Routes/PublicRoutes";
import VerticalLayout from "../src/Layouts/index";
import SelectVendor from "./pages/VendorList/SelectVendor/index";
import VendorData from "./pages/VendorList/VendorData/index";

// Fake Backend (if you are using it)
import fakeBackend from "./helpers/AuthType/fakeBackend";
import RechargeDetailTable from "pages/VendorList/RechargeDetails/index";
import UtilityDetailTable from "pages/VendorList/UtilityDetails/index";

import TransactionRecovery from "pages/VendorList/transactionrecovery/index";
import SuperRefundProcess from "pages/VendorList/SuperRefundProcess/index";
import RefundDetailsTable from "pages/VendorList/GetRefundDetails/index";
import Initiatefund from "pages/VendorList/FundInitiate/index";
fakeBackend();

function App() {
  const dispatch = useDispatch();
  // 1. Add a loading state
  const [loading, setLoading] = useState(true);

  // 2. Add useEffect to check for auth token on initial load
  useEffect(() => {
    try {
      const authUser = localStorage.getItem("authUser");
      if (authUser) {
        const userData = JSON.parse(authUser);

        // Restore the session in Redux
        dispatch(loginSuccess(userData));

        // Set the authorization token for API calls
        if (userData.token) {
          setAuthorization(userData.token);
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth from localStorage:", error);
    } finally {
      // Finish loading, whether token was found or not
      setLoading(false);
    }
  }, [dispatch]);

  // 3. Render a loading indicator while checking for the token
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        {/* Replaced the h2 tag with a Spinner component */}
        <Spinner color="primary">Loading...</Spinner>
      </div>
    );
  }

  // 4. Once loading is false, render the routes
  return (
    <React.Fragment>
      <Routes>
        {/* Public Routes - NOW WRAPPED WITH PublicRoute */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <CoverSignIn />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <AuthProtected>
              <VerticalLayout>
                <DashboardJobs />
              </VerticalLayout>
            </AuthProtected>
          }
        />

        <Route
          path="/Select-Vendor"
          element={
            <AuthProtected>
              <VerticalLayout>
                <SelectVendor />
              </VerticalLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/vendor-Data"
          element={
            <AuthProtected>
              <VerticalLayout>
                <VendorData />
              </VerticalLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/recharge-Details"
          element={
            <AuthProtected>
              <VerticalLayout>
                <RechargeDetailTable />
              </VerticalLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/utility-Details"
          element={
            <AuthProtected>
              <VerticalLayout>
                <UtilityDetailTable />
              </VerticalLayout>
            </AuthProtected>
          }
        />
  <Route
          path="/recover-transaction-amt"
          element={
            <AuthProtected>
              <VerticalLayout>
                <TransactionRecovery />
              </VerticalLayout>
            </AuthProtected>
          }
        />
         <Route
          path="/process-superRefund"
          element={
            <AuthProtected>
              <VerticalLayout>
                <SuperRefundProcess />
              </VerticalLayout>
            </AuthProtected>
          }
        />
         <Route
          path="/refund-details"
          element={
            <AuthProtected>
              <VerticalLayout>
                <RefundDetailsTable />
              </VerticalLayout>
            </AuthProtected>
          }
        />
         <Route
          path="/initiate-fund"
          element={
            <AuthProtected>
              <VerticalLayout>
                <Initiatefund />
              </VerticalLayout>
            </AuthProtected>
          }
        />
        {/* Catch-all route - ALSO WRAPPED WITH PublicRoute */}
        <Route
          path="*"
          element={
            <PublicRoute>
              <CoverSignIn />
            </PublicRoute>
          }
        />
      </Routes>
    </React.Fragment>
  );
}

export default App;
