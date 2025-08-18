// SuccessModal.tsx
import React, { useEffect } from "react";
import { Modal, ModalBody } from "reactstrap";

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
  // Automatically close the modal after 2 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        toggle();
      }, 2000); // 2 seconds

      // Cleanup the timer if the component unmounts or modal is closed manually
      return () => clearTimeout(timer);
    }
  }, [isOpen, toggle]);

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
    </Modal>
  );
};

export default SuccessModal;
