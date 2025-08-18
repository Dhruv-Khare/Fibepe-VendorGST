import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
} from "reactstrap";

type Customer = {
  id: string;
  customer_name: string; // Operator Name
  subscriber_id: string;
  subscriber_name: string;
  email: string;
  phone: string;
  date: string;
  status: "Active" | "Block";
};

interface CustomerModalProps {
  isOpen: boolean;
  toggle: () => void;
  onSave: (subscriberId: string, newSubscriberName: string) => void; // Updated onSave signature
  customer: Customer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  toggle,
  onSave,
  customer,
}) => {
  // Use a separate state for the single input field that the user can change
  const [newSubscriberName, setNewSubscriberName] = useState("");

  useEffect(() => {
    // When the modal opens, reset the input field
    if (isOpen) {
      setNewSubscriberName("");
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validation: Enforce uppercase and allow only letters and spaces
    const formattedValue = e.target.value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "");
    setNewSubscriberName(formattedValue);
  };

  const handleSave = () => {
    if (!newSubscriberName) {
      alert("Please enter a subscriber name.");
      return;
    }
    // The customer object is guaranteed to exist here because this modal is now only for editing
    if (customer) {
      onSave(customer.subscriber_id, newSubscriberName);
    }
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered>
      <ModalHeader toggle={toggle}>Update Subscriber Name</ModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="customer_name">Operator Name</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={customer?.customer_name || ""}
              readOnly // This field is pre-filled and cannot be edited
            />
          </FormGroup>

          <FormGroup>
            <Label for="subscriber_id">Subscriber ID</Label>
            <Input
              id="subscriber_id"
              name="subscriber_id"
              value={customer?.subscriber_id || ""}
              readOnly // This field is pre-filled and cannot be edited
            />
          </FormGroup>

          <FormGroup>
            <Label for="subscriber_name">Subscriber Name</Label>
            <Input
              id="subscriber_name"
              name="subscriber_name"
              placeholder="Enter subscriber name"
              value={newSubscriberName}
              onChange={handleChange}
              autoFocus // Automatically focus this field when the modal opens
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        {/* <Button color="secondary" onClick={toggle}>
          Close
        </Button> */}
        <Button color="primary" onClick={handleSave} className="w-100">
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CustomerModal;
