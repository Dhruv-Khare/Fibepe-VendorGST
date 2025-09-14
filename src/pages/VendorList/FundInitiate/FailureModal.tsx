import React from "react";
import { Modal, ModalBody, ModalFooter, Button } from "reactstrap";

interface FailureModalProps {
  isOpen: boolean;
  toggle: () => void;
  message: string;
}
const FailureModal: React.FC<FailureModalProps> = ({
  isOpen,
  toggle,
  message,
}) => {
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

export default FailureModal;