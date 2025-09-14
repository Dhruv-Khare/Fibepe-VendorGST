import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import UiContent from "../../../Components/Common/UiContent";
// import { Link } from "react-router-dom";

import TransactionRecovery from "./TransactionRecovery";


const UpdateSubscriber = () => {
  document.title = "Fibepe-VendorGST";
  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Transaction Recovery" pageTitle="Tables" />

          {/* ================================================================== */}
          {/* == YOUR NEW DYNAMIC CUSTOMER LIST TABLE IS ADDED HERE == */}
          {/* ================================================================== */}
          <Row>
            <Col lg={12}>
              <Card>
                {/* <PreviewCardHeader title="Dynamic Customer List (With Search, Sort & Pagination)" /> */}
                <CardBody>
                  {/* The component is placed directly here */}
                  {/* <UpdateFrom isOpen={true} toggle={() => {}} /> */}
                  <TransactionRecovery />
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* ================================================================== */}
          {/* == ALL THE STATIC TABLE EXAMPLES FROM YOUR TEMPLATE ARE BELOW == */}
          {/* ================================================================== */}

          {/* ... (the rest of your static table examples remain unchanged) ... */}
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UpdateSubscriber;
