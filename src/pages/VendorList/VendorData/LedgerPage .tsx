import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Table,
  Alert,
  Spinner,
  Row,
  Col,
  Button,
} from "reactstrap";

const VENDOR_LEDGER_API_URL: string =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetVendorLedger";

interface LedgerEntry {
  Credit: number;
  Payout: number;
  Date: string;
  Time: string;
  ProductCode: number;
  LedgerId: number;
}
// This interface will live in your LedgerPage.tsx file
interface Vendor {
  VendorName: string;
  GST: string;
  PAN: string;
  Aadhaar: string;
  FibePeID: number;
  Address: string;
}

const LedgerPage: React.FC = () => {
  const navigate = useNavigate(); // ✅ INITIALIZE THE HOOK

  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [vendorDetails, setVendorDetails] = useState<Vendor | null>(null); // ✅ ADD THIS STATE

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isBack, setIsBack] = useState<boolean>(false);

  // useSearchParams hook URL se query parameters (e.g., ?vendorId=123) nikalne ke liye
  const [searchParams] = useSearchParams();

  const handleBackToSelection = () => {
    setIsBack(true);
    navigate("/Select-Vendor");
  };

  const highlightStyle = {
    backgroundColor: "#e9f5ff", // A light blue background
    fontWeight: "600",
  };

  useEffect(() => {
    // URL se values nikalein
    const vendorId = searchParams.get("vendorId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!vendorId || !month || !year) {
      setError(
        "Required parameters are missing. Please go back and make a selection."
      );
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch both APIs at the same time for efficiency
        const [vendorListResponse, ledgerResponse] = await Promise.all([
          fetch(
            "https://vendorgst.fibepe.com/api/User/Vendor/GetVendorGSTList",
            { method: "POST" }
          ),
          fetch(
            `${VENDOR_LEDGER_API_URL}?fibepeId=${vendorId}&month=${month}&year=${year}`,
            { method: "POST" }
          ),
        ]);

        if (!vendorListResponse.ok || !ledgerResponse.ok) {
          throw new Error("A network response was not ok.");
        }

        const vendorListData = await vendorListResponse.json();
        const ledgerData = await ledgerResponse.json();

        // Process Vendor List Data
        if (vendorListData.IsSuccess) {
          const allVendors: Vendor[] =
            vendorListData.payLoad.VendorGSTListResponse;
          // Find the specific vendor from the list using the ID from the URL
          const currentVendor = allVendors.find(
            (v) => v.FibePeID === parseInt(vendorId, 10)
          );
          setVendorDetails(currentVendor || null);
        } else {
          throw new Error(
            vendorListData.Message || "Failed to fetch vendor details."
          );
        }

        // Process Ledger Data
        if (ledgerData.IsSuccess) {
          setLedgerData(ledgerData.payLoad?.VendorLedger || []);
        } else {
          throw new Error(ledgerData.Message || "Failed to fetch ledger data.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Vendor Ledger Data</h5>
          <Button
            color="secondary"
            size="sm"
            onClick={handleBackToSelection}
            disabled={isBack}
          >
            {isBack ? "Loading..." : "← Back to Selection"}
          </Button>
        </div>
        {!isLoading && vendorDetails && (
          <Card className="mb-4 bg-light">
            <CardBody>
              <h6 className="card-title text-primary">Vendor Details</h6>
              <hr className="mt-2 mb-3" />
              <Row>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Name:</strong> {vendorDetails.VendorName}
                  </p>
                  <p className="mb-2">
                    <strong>GSTIN:</strong> {vendorDetails.GST}
                  </p>
                  <p className="mb-0">
                    <strong>PAN:</strong> {vendorDetails.PAN}
                  </p>
                </Col>
                <Col md={6}>
                  <p className="mb-2">
                    <strong>Address:</strong> {vendorDetails.Address}
                  </p>
                </Col>
              </Row>
            </CardBody>
          </Card>
        )}

        {isLoading && (
          <div className="text-center p-4">
            <Spinner color="primary">Loading...</Spinner>
          </div>
        )}

        {error && <Alert color="danger">{error}</Alert>}

        {!isLoading && !error && ledgerData.length > 0 && (
          <Table striped bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th style={highlightStyle}>Credit</th>
                <th>Payout</th>
                <th>Date</th>
                <th>Time</th>
                <th>Product Code</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((entry) => (
                <tr key={entry.LedgerId}>
                  <td style={highlightStyle}>
                    {entry.Credit.toLocaleString()}
                  </td>
                  <td>{entry.Payout.toLocaleString()}</td>
                  <td>{entry.Date}</td>
                  <td>{entry.Time}</td>
                  <td>{entry.ProductCode}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {!isLoading && !error && ledgerData.length === 0 && (
          <Alert color="info">No data found for the selected criteria.</Alert>
        )}
      </CardBody>
    </Card>
  );
};

export default LedgerPage;
