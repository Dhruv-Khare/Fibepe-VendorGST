import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Container,
  Input,
  Label,
  Row,
  Button,
  Form,
  FormFeedback,
} from "reactstrap";
// import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { useSelector, useDispatch } from "react-redux";
// 👇 Add this import line
import { loginSuccess } from "../../../slices/auth/login/reducer";
// import { Link } from "react-router-dom";
// import withRouter from "../../Components/Common/withRouter";

import * as Yup from "yup";
import { useFormik } from "formik";
// import { setAuthorization } from "../../../helpers/api_helper";
import {
  loginUser,
  // socialLogin,
  resetLoginFlag,
} from "../../../slices/auth/login/thunk";

import { createSelector } from "reselect";
import AuthSlider from "../authCarousel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import sidelogo from "../../../assets/fibePeImages/logo3.png";
import { setUserProfile } from "slices/auth/login/reducer";
// import { co } from "@fullcalendar/core/internal-common";
// import { Navigate } from "react-router-dom";
import { setAuthorization } from "helpers/api_helper";

const CoverSignIn = (props: any) => {
  // document.title = "Cover SignIn | Velzon - React Admin & Dashboard Template";
  const dispatch: any = useDispatch();

  const selectLayoutState = (state: any) => state;
  const loginpageData = createSelector(selectLayoutState, (state) => ({
    user: state.Account.user,
    error: state.Login.error,
    errorMsg: state.Login.errorMsg,
  }));

  const { user, error, errorMsg } = useSelector(loginpageData);
  const [userLogin, setUserLogin] = useState<any>([]);
  const [loader, setLoader] = useState<boolean>(false);
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [err, setError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // --- START: CHANGE 1 ---
  // This useEffect hook runs when the component mounts.
  // It checks if user data already exists in localStorage.
  // useEffect(() => {
  //   // Try to get the user data from localStorage
  //   const authUser = localStorage.getItem("authUser");

  //   if (authUser) {
  //     // If data exists, parse it from JSON string to an object
  //     const userData = JSON.parse(authUser);

  //     // Dispatch the loginSuccess action to restore the user session in Redux
  //     dispatch(loginSuccess(userData));

  //     // Set the authorization token for future API calls
  //     if (userData.token) {
  //       setAuthorization(userData.token);
  //     }

  //     // Redirect the user to the dashboard
  //     navigate("/dashboard");
  //   }
  // }, [dispatch, navigate]);

  useEffect(() => {
    if (user) {
      const updatedMobileNumber =
        process.env.REACT_APP_DEFAULTAUTH === "firebase"
          ? user.multiFactor.user.phoneNumber
          : user.mobileNumber;

      const updatedOtp =
        process.env.REACT_APP_DEFAULTAUTH === "firebase" ? "" : user.otp;

      setUserLogin({
        mobileNumber: updatedMobileNumber,
        otp: updatedOtp,
      });
    }
  }, [user]);

  const validation: any = useFormik({
    enableReinitialize: true,
    initialValues: {
      mobileNumber: "",
      otp: "",
    },
    validationSchema: Yup.object({
      mobileNumber: Yup.string()
        .required("Please Enter Your mobile number")
        .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
      otp: Yup.string()
        .required("Please Enter Your OTP")
        .matches(
          /^[a-zA-Z0-9]{6}$/,
          "OTP must be exactly 6 alphanumeric characters"
        ),
    }),
    onSubmit: (values) => {
      navigate("/dashboard");
      dispatch(loginUser(values, props.router.navigate));
      setLoader(true);
    },
  });
  useEffect(() => {
    if (errorMsg) {
      setTimeout(() => {
        dispatch(resetLoginFlag());
        setLoader(false);
      }, 3000);
    }
  }, [dispatch, errorMsg]);

  const handleSendOTP = async () => {
    setIsButtonDisabled(true); // Disable the button immediately
    try {
      if (
        !mobileNumber ||
        mobileNumber.length !== 10 ||
        isNaN(Number(mobileNumber))
      ) {
        setError("Please enter a valid 10-digit mobile number");
        return;
      }
      setError("");

      const response: any = await axios.post(
        "https://adminmanagement.fibepe.com/api/User/Admin/Login",
        {
          Mobile: mobileNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.IsSuccess) {
        setShowOtpField(true);
        // setMobileNumber(response.payLoad?.Mobile || "");
      } else {
        setError(response.Message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Error sending OTP. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button in case of an error
    }
  };

  const handleVerifyOTP = async () => {
    setIsButtonDisabled(true); // Disable the button immediately

    try {
      const response: any = await axios.post(
        "https://adminmanagement.fibepe.com/api/User/Admin/VerifyOTP",
        {
          Mobile: validation.values.mobileNumber.toString(),
          MobileOTP: validation.values.otp.toString(),
          EmailOTP: "string",
          RequestCall: "true",
          FibePeId: 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      debugger;
      if (response.IsSuccess) {
        // The payload from the successful response
        const payload = response.payLoad;
        const token = payload?.FibePeID; // Assuming FibePeID is your token/unique ID

        if (token) {
          // Create the single object for both sessionStorage and Redux
          const authUserData = {
            ...payload,
            token: token,
          };

          // --- START: CHANGE 2 ---
          // Store the user data in localStorage instead of sessionStorage
          localStorage.setItem("authUser", JSON.stringify(authUserData));
          // --- END: CHANGE 2 --

          // 2. Dispatch the loginSuccess action with the same object
          // This is the key change!
          dispatch(loginSuccess(authUserData));

          // 3. Set the authorization header for subsequent API calls
          setAuthorization(token);

          // 4. Navigate to the dashboard
          navigate("/dashboard", { replace: true });
        }
      } else {
        setError(response.Message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError("Error verifying OTP. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button in case of an error

      setLoader(false);
    }
  };

  return (
    <React.Fragment>
      <div className="auth-page-wrapper auth-bg-cover py-5 d-flex justify-content-center align-items-center min-vh-100">
        <div className="bg-overlay"></div>
        <div className="auth-page-content overflow-hidden pt-lg-5">
          <Container>
            <Row>
              <Col lg={12}>
                <Card className="overflow-hidden">
                  <Row className="g-0">
                    <AuthSlider />
                    <Col lg={6}>
                      <div className="p-lg-5 p-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="text-primary">Welcome Back !</h5>
                            <p className="text-muted">
                              Sign in to continue to Velzon.
                            </p>
                          </div>
                        </div>

                        <div className="p-2 mt-4">
                          <Form
                            onSubmit={(e) => {
                              e.preventDefault();
                              validation.handleSubmit();
                              return false;
                            }}
                          >
                            <div className="mb-3">
                              <Label
                                htmlFor="mobileNumber"
                                className="form-label"
                              >
                                Mobile Number:
                              </Label>
                              <Input
                                name="mobileNumber"
                                className="form-control"
                                placeholder="Enter Mobile Number:"
                                type="text"
                                onChange={(e) => {
                                  setMobileNumber(e.target.value);
                                  validation.handleChange(e);
                                }}
                                onBlur={validation.handleBlur}
                                value={mobileNumber}
                                invalid={
                                  !!err ||
                                  (validation.touched.mobileNumber &&
                                    validation.errors.mobileNumber)
                                }
                              />
                              {validation.touched.mobileNumber &&
                              validation.errors.mobileNumber ? (
                                <FormFeedback type="invalid">
                                  {validation.errors.mobileNumber}
                                </FormFeedback>
                              ) : null}
                              <Button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={isButtonDisabled}
                                className="btn btn-success w-100 mt-2"
                              >
                                {showOtpField ? "Resend OTP" : "Send OTP"}
                              </Button>
                              {err && (
                                <div className="text-danger mt-2">{err}</div>
                              )}
                            </div>

                            {showOtpField && (
                              <div>
                                <Label htmlFor="otp" className="form-label">
                                  Enter OTP:
                                </Label>
                                <Input
                                  type="text"
                                  id="otp"
                                  name="otp"
                                  placeholder="Enter OTP"
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  value={validation.values.otp}
                                  invalid={
                                    validation.touched.otp &&
                                    validation.errors.otp
                                  }
                                  className="form-control pe-5"
                                  maxLength={6}
                                />
                                {validation.touched.otp &&
                                  validation.errors.otp && (
                                    <FormFeedback type="invalid">
                                      {validation.errors.otp}
                                    </FormFeedback>
                                  )}
                                <Button
                                  onClick={handleVerifyOTP}
                                  className="btn btn-success w-100 mt-2"
                                  disabled={isButtonDisabled}
                                >
                                  Submit OTP
                                </Button>
                              </div>
                            )}
                          </Form>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>

        <footer className="footer">
          <Container>
            <Row>
              <Col lg={12}>
                <div className="text-center">
                  <p className="mb-0">
                    &copy; {new Date().getFullYear()} Velzon. Crafted with
                    <i className="mdi mdi-heart text-danger"></i> by Themesbrand
                  </p>
                </div>
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    </React.Fragment>
  );
};

export default CoverSignIn;
