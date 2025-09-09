import React, { FC } from "react";
import { Card, CardBody, Col, Row, Spinner } from "reactstrap";

// Define the type for the summary data it will receive
export type ProviderSummary = {
  providerName: string;
  successAmount: number;
  failedAmount: number;
  totalAmount: number;
};

// Define the component's props interface
interface ProviderHeaderProps {
  data: ProviderSummary[];
  isLoading: boolean;
}

const ProviderHeader: FC<ProviderHeaderProps> = ({ data, isLoading }) => {
  // Helper to format numbers as Indian Rupees (₹)
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  // Show placeholder spinners while the parent component is loading data
  if (isLoading) {
    return (
      <Row>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Col key={idx} lg={3} md={6} className="mb-3">
            <Card className="h-100">
              <CardBody className="d-flex justify-content-center align-items-center">
                <Spinner size="sm" />
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  // If loading is finished but there's no data, render nothing
  if (!data || data.length === 0) {
    return null;
  }

  // Render the summary cards once data is available
  return (
    <Row>
      {data.map((summary) => (
        <Col key={summary.providerName} lg={3} md={6} className="mb-3">
          <Card className="h-100 shadow-sm mb-1 border-1">
            <CardBody>
              <h5 className="mb-3 text-center text-uppercase fw-bold text-muted">
                {summary.providerName}
              </h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-medium text-success">Success:</span>
                <span className="fw-bold text-success">
                  {formatCurrency(summary.successAmount)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-medium text-danger">Failed:</span>
                <span className="fw-bold text-danger">
                  {formatCurrency(summary.failedAmount)}
                </span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-medium text-primary">Total:</span>
                <span className="fw-bold text-primary">
                  {formatCurrency(summary.totalAmount)}
                </span>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ProviderHeader;