import React, { useState, FC } from "react";
import {
 
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
} from "reactstrap";
import SuccessModal from "./SuccessModal"; // Make sure this path is correct

// --- INLINED FAILURE MODAL COMPONENT ---
interface FailureModalProps {
  isOpen: boolean;
  toggle: () => void;
  message: string;
}

const FailureModal: FC<FailureModalProps> = ({ isOpen, toggle, message }) => {
  if (!isOpen) return null;
  // This is a custom-styled modal without using reactstrap
  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ display: "block" }}
      ></div>
      <div
        className="modal fade show"
        id="failureModal"
        style={{ display: "block" }}
        tabIndex={-1}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-5">
              <div
                className="mt-4"
                style={{
                  fontSize: "80px",
                  lineHeight: "1",
                  color: "#f06548",
                }}
              >
                <i className="ri-close-circle-line"></i>
              </div>
              <h4 className="mb-3 mt-4">Oops! An Error Occurred.</h4>
              <p className="text-muted mb-4">{message}</p>
              <div className="hstack gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={toggle}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN COMPONENT ---

const TRANSACTION_RECOVERY_API: string = "https://vendorgst.fibepe.com/api/User/Vendor/ReInitiateByLedger";

const TransactionRecovery = () => {
  const [ledgerID, setLedgerID] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for success modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // State for the Failure Modal
  const [isFailureModalOpen, setIsFailureModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const toggleSuccessModal = () => setIsSuccessModalOpen(!isSuccessModalOpen);
  const toggleFailureModal = () => setIsFailureModalOpen(!isFailureModalOpen);

  const handleRecoverTransaction = async () => {
    if (!ledgerID.trim()) {
      setErrorMessage("Ledger ID cannot be empty.");
      setIsFailureModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`${TRANSACTION_RECOVERY_API}?ledgerID=${ledgerID}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.IsSuccess && data.payLoad) {
        setSuccessMessage(`Successfully recovered the amount with the Revert Ledger ID: ${data.payLoad.DebitRevertLedgerId}`);
        setIsSuccessModalOpen(true);
        setLedgerID("");
      } else {
        const apiErrorMessage = data.payLoad?.StatusCode || data.Message || "Failed to recover the transaction.";
        setErrorMessage(apiErrorMessage);
        setIsFailureModalOpen(true);
      }
    } catch (err: any) {
      console.error("Recovery failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setIsFailureModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. UPDATED the handler to a more robust method
  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This will remove any character that is not a digit
    const numericValue = e.target.value.replace(/\D/g, "");
    setLedgerID(numericValue);
  };

  return (
    <>
      
          <Form onSubmit={(e) => { e.preventDefault(); handleRecoverTransaction(); }}>
            <Row className="align-items-end">
              <Col md={6}>
                <FormGroup>
                  <Label for="ledgerID">Ledger ID</Label>
                  {/* 2. Changed type to "tel" for better mobile experience */}
                  <Input
                    id="ledgerID"
                    type="tel"
                    placeholder="Enter Ledger ID"
                    value={ledgerID}
                    onChange={handleNumericInputChange} // Use the new handler
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <Button
                  color="primary"
                  onClick={handleRecoverTransaction}
                  disabled={isSubmitting}
                  className="fw-semibold mb-3"
                >
                  {isSubmitting ? "Recovering..." : "Recover Transaction"}
                </Button>
              </Col>
            </Row>
          </Form>
      
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        toggle={toggleSuccessModal}
        message={successMessage}
      />

      {/* FailureModal component */}
      <FailureModal
        isOpen={isFailureModalOpen}
        toggle={toggleFailureModal}
        message={errorMessage}
      />
    </>
  );
};

export default TransactionRecovery;

