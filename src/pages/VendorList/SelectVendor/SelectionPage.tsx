import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
  Alert,
} from "reactstrap";

const VENDOR_LIST_API_URL: string =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetVendorGSTList";

// Helper functions (month and year options) ko yahan bhi copy kar lein
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear - 5; i <= currentYear; i++) {
    years.push(i);
  }
  return years;
};

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

interface Vendor {
  VendorName: string;
  FibePeID: number;
}

const SelectionPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // ✅ ADD THIS STATE

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // useNavigate hook ka istemal page change karne ke liye
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(VENDOR_LIST_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "*/*",
          },
        });
        const data = await response.json();
        if (data.IsSuccess) {
          setVendors(data.payLoad.VendorGSTListResponse || []);
        } else {
          throw new Error(data.Message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const handleViewReport = () => {
    // ✅ Set to true immediately to disable the button
    setIsSubmitting(true);
    if (!selectedVendorId || !selectedMonth || !selectedYear) {
      setError("Please select all three options.");
      setIsSubmitting(false);

      return;
    }
    // Navigate to the ledger page with selected values as URL query parameters
    navigate(
      `/vendor-Data?vendorId=${selectedVendorId}&month=${selectedMonth}&year=${selectedYear}`
    );
  };

  return (
    <Card>
      <CardBody>
        {/* <h5 className="card-title">Select Report Criteria</h5>
        <p className="card-subtitle mb-3">Choose a vendor, month, and year.</p> */}

        {error && <Alert color="danger">{error}</Alert>}

        <Form>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="vendorSelect">Vendor Name</Label>
                <Input
                  type="select"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">
                    {isLoading ? "Loading..." : "Select Vendor"}
                  </option>
                  {vendors.map((v) => (
                    <option key={v.FibePeID} value={v.FibePeID}>
                      {v.VendorName}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="monthSelect">Month</Label>
                <Input
                  type="select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Select Month</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={2}>
              <FormGroup>
                <Label for="yearSelect">Year</Label>
                <Input
                  type="select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Select Year</option>
                  {generateYearOptions().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Button
            color="primary"
            block
            onClick={handleViewReport}
            disabled={isSubmitting} // ✅ DISABLE THE BUTTON WHEN isSubmitting IS TRUE
            className="mt-3 fw-semibold"
          >
            {isSubmitting ? "Loading..." : "View Report"}
          </Button>
        </Form>
      </CardBody>
    </Card>
  );
};

export default SelectionPage;
