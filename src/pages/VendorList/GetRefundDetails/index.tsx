import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import UiContent from "../../../Components/Common/UiContent";
import RefundDetailsTable from "./RefundDetailsTable";

const Refund = () => {
  document.title = "Fibepe-Refund-Details";
  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Refund Details" pageTitle="Tables" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardBody>
                  <RefundDetailsTable />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Refund;
