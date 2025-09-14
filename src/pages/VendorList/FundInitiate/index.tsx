import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import UiContent from "../../../Components/Common/UiContent";
import InitiateFund from "./InitiateFund";

const SuperRefundProcess = () => {
  document.title = "Fibepe-InitiateFund";
  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Initiate fund" pageTitle="Tables" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <InitiateFund/>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default SuperRefundProcess;
