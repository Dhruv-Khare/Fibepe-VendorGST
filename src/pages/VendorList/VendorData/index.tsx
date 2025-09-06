import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import UiContent from "../../../Components/Common/UiContent";
// import { Link } from "react-router-dom";

// Import the CustomerList component you created
// import UpdateFrom from "./updateForm";
import LedgerPage from "./LedgerPage ";

// NOTE: The code below for static tables is kept for context from your template
// You can remove these if they are not needed for the code snippets feature
// import {
//   DefaultTables,
//   StrippedRow,
//   TablesColors,
//   HoverableRows,
//   CardTables,
//   ActiveTables,
//   BorderedTables,
//   TablesBorderColors,
//   TablesWithoutBorders,
//   SmallTables,
//   TableHead,
//   TableFoot,
//   Captions,
//   TableNesting,
//   Variants,
//   VerticalAlignment,
//   ResponsiveTables,
//   StripedColumnsTables,
// } from "./BasicTablesCode";

const UpdateSubscriber = () => {
  document.title = "Fibepe-VendorGST";
  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Vendor Credit Ledger Report" pageTitle="Tables" />

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
                  <LedgerPage />
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
