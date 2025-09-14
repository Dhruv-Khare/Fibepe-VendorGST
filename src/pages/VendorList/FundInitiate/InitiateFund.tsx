import React, { useState, useEffect } from "react";
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
  CardHeader,
  CardTitle,
} from "reactstrap";

import SuccessModal from "./SuccessModal";
import FailureModal from "./FailureModal";

// API URLs
const VENDOR_LIST_API_URL = "https://vendorgst.fibepe.com/api/User/Vendor/GetVendorGSTList";
const FUND_INITIATE_API_URL = "https://vendorgst.fibepe.com/api/User/Vendor/FundInitiate";

// Interface for Vendor data
interface Vendor {
  VendorName: string;
  FibePeID: number;
}

// Main component
const InitiateFund: React.FC = () => {
  // State for form fields
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [refNumber, setRefNumber] = useState<string>("");

  // State for UI feedback
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // State for modal messages and visibility
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showFailureModal, setShowFailureModal] = useState<boolean>(false);

  // Fetch vendors when the component mounts
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(VENDOR_LIST_API_URL, {
          method: "POST",
          headers: { "Content-Type": "*/*" },
        });
        const data = await response.json();
        if (data.IsSuccess) {
          setVendors(data.payLoad.VendorGSTListResponse || []);
        } else {
          throw new Error(data.Message || "Could not fetch vendors.");
        }
      } catch (err: any) {
        setError(err.message);
                setShowFailureModal(true); // Show failure modal on vendor fetch error

      } finally {
        setIsLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  
  // Toggle functions for modals
  const toggleSuccessModal = () => setShowSuccessModal(!showSuccessModal);
  const toggleFailureModal = () => setShowFailureModal(!showFailureModal);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload on form submission

    

     // 1. Validation
    if (!selectedVendorId || !selectedBank || !amount || !date || !refNumber) {
      setError("Please fill in all the fields before submitting.");
      setShowFailureModal(true);
      return;
    }
// Clear previous messages
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    // 2. Prepare request body
    const requestBody = {
      FibePeId: parseInt(selectedVendorId, 10), // Convert ID to a number
      BankName: selectedBank,
      Amount: amount,
      Date: date,
      RefNumber: refNumber,
    };

    // 3. Make API POST request
    try {
      const response = await fetch(FUND_INITIATE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.IsSuccess) {
setSuccessMessage(result.Message || "Fund initiated successfully!");
        setShowSuccessModal(true);
        // Reset form fields after success
        setSelectedVendorId("");
        setSelectedBank("");
        setAmount("");
        setDate("");
        setRefNumber("");
      } else {
        throw new Error(result.Message || "An unknown error occurred.");
      }
    } catch (err: any) {
       setError(err.message);
      setShowFailureModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Card>
      <CardBody>
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Vendor Dropdown */}
            <Col md={6}>
              <FormGroup>
                <Label for="vendorSelect">Vendor Name</Label>
                <Input
                  id="vendorSelect"
                  type="select"
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  disabled={isLoadingVendors}
                  required
                >
                  <option value="">
                    {isLoadingVendors ? "Loading Vendors..." : "Select a Vendor"}
                  </option>
                  {vendors.map((vendor) => (
                    <option key={vendor.FibePeID} value={vendor.FibePeID}>
                      {vendor.VendorName}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </Col>

            {/* Bank Dropdown */}
            <Col md={6}>
              <FormGroup>
                <Label for="bankSelect">Bank Name</Label>
                <Input
                  id="bankSelect"
                  type="select"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  required
                >
                  <option value="">Select a Bank</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            {/* Amount Input */}
            <Col md={6}>
              <FormGroup>
                <Label for="amountInput">Amount</Label>
                <Input
                  id="amountInput"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </FormGroup>
            </Col>

            {/* Date Picker */}
            <Col md={6}>
              <FormGroup>
                <Label for="datePicker">Date</Label>
                <Input
                  id="datePicker"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </FormGroup>
            </Col>
          </Row>

          {/* Reference Number Input */}
          <FormGroup>
            <Label for="refNumberInput">Reference Number</Label>
            <Input
              id="refNumberInput"
              type="text"
              placeholder="Enter reference number"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              required
            />
          </FormGroup>

          {/* Submit Button */}
          <Button
            color="primary"
            block
            type="submit"
            disabled={isSubmitting}
            className="mt-3 fw-semibold"
          >
            {isSubmitting ? "Submitting..." : "Initiate Fund"}
          </Button>
        </Form>
      </CardBody>
    </Card>
     {/* Modals */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        toggle={toggleSuccessModal} 
        message={successMessage} 
      />
      <FailureModal 
        isOpen={showFailureModal} 
        toggle={toggleFailureModal} 
        message={error} 
      />

      </>
  );
};

export default InitiateFund;