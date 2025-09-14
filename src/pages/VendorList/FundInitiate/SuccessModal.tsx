import React from "react";
import { Modal, ModalBody, ModalFooter, Button } from "reactstrap";

interface SuccessModalProps {
  isOpen: boolean;
  toggle: () => void;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  toggle,
  message,
}) => {

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalBody className="text-center p-5">
        <div className="mb-4">
          {/* Checkmark Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="72"
            height="72"
            style={{ margin: "auto" }}
          >
            <circle
              cx="12"
              cy="12"
              r="11"
              fill="#fff"
              stroke="#28a745"
              strokeWidth="1"
            />
            <path fill="#28a745" d="M9.5 16.5l-3-3 1-1 2 2 5-5 1 1-6 6z" />
          </svg>
        </div>

        <h5>{message}</h5>
      </ModalBody>
      {/* 2. ADDED a ModalFooter with a manual "OK" button to close the modal. */}
      <ModalFooter className="border-0">
        <Button color="success" onClick={toggle} className="w-100">
          OK
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SuccessModal;
