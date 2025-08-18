import React, { useState, useEffect, useMemo, FC } from "react";
import SuccessModal from "./SuccessModal";

// --- TYPE DEFINITIONS ---
type OfflineDTHRecord = {
  RecordID: number;
  Number: string;
  OperatorName: string;
  Circle: string;
  Amount: number;
  ServiceNumber: number; // This is the key field for the refund
  RechargeUserId: number;
};

type ModalCustomerData = {
  id: number;
  phone: string;
  company: string; // This represents OperatorName
  circle: string;
  serviceNumber: number; // Now available for the refund payload
  rechargeUserId: number;
};

type SortDirection = "ascending" | "descending";

interface SortConfig {
  key: keyof OfflineDTHRecord;
  direction: SortDirection;
}

// --- NEW: PAYLOAD TYPE DEFINITIONS FOR API CALLS ---
// Shape of the data for the Update API call
interface UpdatePayload {
  recordId: number | undefined;
  fibepeId: number | undefined;
  confNumber: string;
  opRefId: string;
}

// Shape of the data for the Refund API call
interface RefundPayload {
  serviceNumber: number;
  fibepeId: number | undefined;
}

// --- CONFIGURATION ---
const ITEMS_PER_PAGE = 10;
const POLLING_INTERVAL_MS = 5000;
const BASE_API_URL =
  "https://adminmanagement.fibepe.com/api/User/Admin/GetOfflineData";
const LOCK_API_URL =
  "https://adminmanagement.fibepe.com/api/User/Admin/LockOfflineRecord";
const UPDATE_API_URL =
  "https://adminmanagement.fibepe.com/api/User/Admin/UpdateOfflineRecord";
const REFUND_API_URL =
  "https://adminmanagement.fibepe.com/api/User/Admin/Refund";

// --- INLINED COMPONENTS ---
const FailureModal: FC<{
  isOpen: boolean;
  toggle: () => void;
  message: string;
}> = ({ isOpen, toggle, message }) => {
  if (!isOpen) return null;
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

const Button: FC<{
  color?: string;
  size?: string;
  outline?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}> = ({
  color = "primary",
  size = "md",
  outline = false,
  children,
  type = "button",
  ...props
}) => {
  const sizeClass = size === "sm" ? "btn-sm" : "";
  const colorClass = outline ? `btn-outline-${color}` : `btn-${color}`;
  const className = `btn ${colorClass} ${sizeClass}`;
  return (
    <button type={type} className={className} {...props}>
      {children}
    </button>
  );
};

const CustomerModal: FC<{
  isOpen: boolean;
  toggle: () => void;
  onSave: (data: UpdatePayload) => void; // Use the specific payload type
  onRefund: (data: RefundPayload) => void; // Use the specific payload type
  customer: ModalCustomerData | null;
}> = ({ isOpen, toggle, onSave, onRefund, customer }) => {
  const [confNumber, setConfNumber] = useState("");
  const [opRefId, setOpRefId] = useState("");
  // --- 1. ADD NEW STATE FOR QR CODE LOADING ---
  const [isQrLoading, setIsQrLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setConfNumber("");
      setOpRefId("");
      // --- 2. RESET LOADING STATE WHEN MODAL OPENS ---
      setIsQrLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updateData: UpdatePayload = {
      recordId: customer?.id,
      fibepeId: customer?.rechargeUserId,
      confNumber: confNumber,
      opRefId: opRefId, // NameDescription has been removed
    };
    onSave(updateData);
  };

  // CORRECTED: This now uses serviceNumber for the payload.
  const handleRefund = () => {
    if (!customer?.serviceNumber || !customer?.rechargeUserId) {
      console.error(
        "Cannot process refund: Missing service number or fibepe ID."
      );
      return;
    }
    const refundData: RefundPayload = {
      serviceNumber: customer.serviceNumber, // Using the correct field
      fibepeId: customer.rechargeUserId,
    };
    onRefund(refundData);
  };

  const qrCodeUrl = customer?.phone
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        customer.phone
      )}`
    : "";

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ display: "block" }}
      ></div>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
        role="dialog"
      >
        <div
          className="modal-dialog modal-dialog-centered"
          role="document"
          style={{ maxWidth: "420px", maxHeight: "90%" }}
        >
          <div
            className="modal-content"
            style={{ borderRadius: "8px", border: "1px solid #ddd" }}
          >
            <div
              className="modal-header"
              style={{
                justifyContent: "space-between",
                backgroundColor: "#f8f9fa",
                borderBottom: "1px solid #ddd",
                padding: "12px 10px",
              }}
            >
              <h6
                className="modal-title text-dark fw-semibold mb-0"
                style={{ fontSize: "15px" }}
              >
                Process Data
              </h6>
              <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleRefund}
                  className="btn btn-sm"
                  style={{
                    fontSize: "13px",
                    padding: "6px 12px",
                    color: "white",
                    backgroundColor: "#f06548",
                    border: "1px solid #f06548",
                    borderRadius: "4px",
                  }}
                >
                  Refund
                </button>
                <button
                  type="button"
                  className="btn-close"
                  onClick={toggle}
                  style={{ fontSize: "10px" }}
                ></button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: "10px" }}>
                {/* --- 3. QR CODE & SPINNER RENDERING LOGIC --- */}
                <div
                  className="d-flex align-items-center justify-content-center mb-3"
                  style={{ minWidth: "100px", minHeight: "100px" }}
                >
                  {qrCodeUrl ? (
                    <>
                      {isQrLoading && (
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      )}
                      <img
                        src={qrCodeUrl}
                        alt="QR Code for mobile number"
                        style={{
                          width: "100px",
                          height: "100px",
                          // Hide the image element until it has loaded
                          display: isQrLoading ? "none" : "block",
                        }}
                        // Set loading to false when the image loads successfully
                        onLoad={() => setIsQrLoading(false)}
                        // Also handle the error case
                        onError={() => setIsQrLoading(false)}
                      />
                    </>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center text-muted"
                      style={{
                        width: "100px",
                        height: "100px",
                        background: "#f8f9fa",
                        border: "1px dashed #ddd",
                      }}
                    >
                      <span style={{ fontSize: "12px" }}>No QR</span>
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <label
                    className="form-label text-dark fw-normal"
                    style={{ fontSize: "13px", marginBottom: "4px" }}
                  >
                    Number
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={customer?.phone || ""}
                    readOnly
                    style={{
                      fontSize: "13px",
                      padding: "6px 8px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label
                    className="form-label text-dark fw-normal"
                    style={{ fontSize: "13px", marginBottom: "4px" }}
                  >
                    Operator Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={customer?.company || ""}
                    readOnly
                    style={{
                      fontSize: "13px",
                      padding: "6px 8px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label
                    className="form-label text-dark fw-normal"
                    style={{ fontSize: "13px", marginBottom: "4px" }}
                  >
                    Circle
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={customer?.circle || ""}
                    readOnly
                    style={{
                      fontSize: "13px",
                      padding: "6px 8px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label
                    htmlFor="confNumber"
                    className="form-label text-dark fw-normal"
                    style={{ fontSize: "13px", marginBottom: "4px" }}
                  >
                    Confirmation Number
                  </label>
                  <input
                    type="text"
                    name="confNumber"
                    id="confNumber"
                    required
                    className="form-control form-control-sm"
                    placeholder="Enter confirmation number"
                    value={confNumber}
                    onChange={(e) => setConfNumber(e.target.value)}
                    autoComplete="off"
                    style={{
                      fontSize: "13px",
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div className="mb-2">
                  <label
                    htmlFor="opRefId"
                    className="form-label text-dark fw-normal"
                    style={{ fontSize: "13px", marginBottom: "4px" }}
                  >
                    Operator Reference ID
                  </label>
                  <input
                    type="text"
                    name="opRefId"
                    id="opRefId"
                    required
                    className="form-control form-control-sm"
                    placeholder="Enter operator reference ID"
                    value={opRefId}
                    onChange={(e) => setOpRefId(e.target.value)}
                    autoComplete="off"
                    style={{
                      fontSize: "13px",
                      padding: "6px 8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div
                className="modal-footer"
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid #ddd",
                  justifyContent: "center",
                }}
              >
                <button
                  type="submit"
                  className="btn"
                  style={{
                    fontSize: "13px",
                    padding: "8px 24px",
                    color: "white",
                    border: "1px solid #0ab39c",
                    borderRadius: "4px",
                    backgroundColor: "#0ab39c",
                    width: "100%",
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN COMPONENT ---
const OfflineDTHDataTable: FC = () => {
  const [records, setRecords] = useState<OfflineDTHRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "RecordID",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<OfflineDTHRecord | null>(
    null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [fibepeId, setFibepeId] = useState<string | null>(null);
  const [lockedRecords, setLockedRecords] = useState<Set<number>>(new Set());

  // NEW: State for the failure modal
  const [isFailureModalOpen, setIsFailureModalOpen] = useState<boolean>(false);
  const [failureMessage, setFailureMessage] = useState<string>("");

  useEffect(() => {
    const userString = localStorage.getItem("authUser");
    let id: string | null = null;
    if (userString) {
      try {
        const user = JSON.parse(userString);
        id = user.FibePeID;
        setFibepeId(id);
      } catch (e) {
        console.error("Failed to parse user data from sessionStorage", e);
        setError("Invalid user data in session. Please log in again.");
        setIsLoading(false);
        return;
      }
    }
    if (!id) {
      setError("User ID not found in session. Please log in again.");
      setIsLoading(false);
      return;
    }
    const dynamicApiUrl = `${BASE_API_URL}?fibepeId=${id}`;
    const fetchOfflineDTHData = async () => {
      setError(null);
      try {
        const response = await fetch(dynamicApiUrl, {
          method: "POST",
          headers: { Accept: "*/*" },
          body: "",
        });
        if (!response.ok)
          throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.IsSuccess && data.payLoad?.OfflineData) {
          setRecords(data.payLoad.OfflineData);
        } else {
          setRecords([]);
        }
      } catch (e: any) {
        setError(e.message);
        console.error("Fetch error:", e);
      } finally {
        if (isLoading) setIsLoading(false);
      }
    };
    fetchOfflineDTHData();
    const intervalId = setInterval(fetchOfflineDTHData, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const paginatedRecords = useMemo(() => {
    const filteredRecords = records.filter(
      (record) =>
        record.OperatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.Number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.Circle.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sortedRecords = [...filteredRecords].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [records, searchTerm, sortConfig, currentPage]);

  const handleSort = (key: keyof OfflineDTHRecord) => {
    const direction: SortDirection =
      sortConfig.key === key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleUpdateClick = async (record: OfflineDTHRecord) => {
    if (lockedRecords.has(record.RecordID) || !fibepeId) return;
    setLockedRecords((prev) => new Set(prev).add(record.RecordID));
    // // Construct the URL with query parameters
    // const urlWithParams = new URL(LOCK_API_URL);
    // urlWithParams.searchParams.append("recordId", record.RecordID.toString());
    // urlWithParams.searchParams.append(
    //   "fibepeId",
    //   record.RechargeUserId.toString()
    // );
    const dynamicApiUrl = `${LOCK_API_URL}?recordId=${record.RecordID}&fibepeId=${record.RechargeUserId}`;
    try {
      const response = await fetch(dynamicApiUrl, {
        method: "POST",
        headers: { Accept: "*/*" },
      });
      console.log(response);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();
      if (result.IsSuccess) {
        setEditingRecord(record);
        setIsEditModalOpen(true);
      } else {
        throw new Error(result.Message || "Failed to lock the record.");
      }
    } catch (error: any) {
      console.error("Failed to lock record:", error.message);

      // UPDATED: Show failure modal instead of alert
      setFailureMessage(error.message);
      setIsFailureModalOpen(true);
      setLockedRecords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(record.RecordID);
        return newSet;
      });
    }
  };

  // --- FIX: Added explicit type for 'data' parameter ---
  const handleSave = async (data: UpdatePayload) => {
    const dynamicApiUrl = `${UPDATE_API_URL}?recordId=${data.recordId}&fibepeId=${data.fibepeId}&confNumber=${data.confNumber}&opRefId=${data.opRefId}`;

    try {
      const response = await fetch(dynamicApiUrl, {
        method: "POST",
        headers: {
          Accept: "*/*",
        },
        // body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.IsSuccess) {
        setSuccessMessage("Record updated successfully!");
        setIsSuccessModalOpen(true);
        toggleEditModal(); // Close the edit modal on success
      } else {
        throw new Error(result.Message || "Failed to update record.");
      }
    } catch (error: any) {
      console.error("Update failed:", error.message);
      // UPDATED: Show failure modal instead of alert
      setFailureMessage(error.message);
      setIsFailureModalOpen(true);
    }
  };

  // --- FIX: Added explicit type for 'data' parameter ---
  const handleRefund = async (data: RefundPayload) => {
    const dynamicApiUrl = `${REFUND_API_URL}?ledgerId=${data.serviceNumber}&fibepeId=${data.fibepeId}`;
    try {
      const response = await fetch(dynamicApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.IsSuccess) {
        setSuccessMessage("Refund processed successfully!");
        setIsSuccessModalOpen(true);
        toggleEditModal(); // Close the edit modal on success
      } else {
        throw new Error(result.Message || "Failed to process refund.");
      }
    } catch (error: any) {
      console.error("Refund failed:", error.message);
      // UPDATED: Show failure modal instead of alert
      setFailureMessage(error.message);
      setIsFailureModalOpen(true);
    }
  };

  const toggleEditModal = () => {
    if (isEditModalOpen && editingRecord) {
      setLockedRecords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(editingRecord.RecordID);
        return newSet;
      });
      setEditingRecord(null);
    }
    setIsEditModalOpen((prevState) => !prevState);
  };

  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);

  const customerForModal: ModalCustomerData | null = useMemo(() => {
    if (!editingRecord) return null;
    return {
      id: editingRecord.RecordID,
      customer_name: `User ${editingRecord.RechargeUserId}`,
      subscriber_id: editingRecord.Number,
      subscriber_name: "N/A",
      phone: editingRecord.Number,
      company: editingRecord.OperatorName,
      amount: editingRecord.Amount,
      circle: editingRecord.Circle,
      serviceNumber: editingRecord.ServiceNumber,
      rechargeUserId: editingRecord.RechargeUserId,
    };
  }, [editingRecord]);

  if (isLoading)
    return (
      <div className="text-center p-10">
        <h5>Loading...</h5>
      </div>
    );
  if (error)
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
      </div>
    );

  return (
    <div className="card-body">
      <div className="row g-4 mb-3">
        <div className="col-sm">
          <div className="d-flex justify-content-sm-end">
            <div className="search-box ms-2" style={{ position: "relative" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <i
                className="ri-search-line search-icon"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                }}
              ></i>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive table-card mt-3 mb-1">
        <table
          className="table align-middle table-nowrap text-center"
          id="customerTable"
        >
          <thead className="table-light">
            <tr>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("RecordID")}
              >
                Record ID
              </th>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Number")}
              >
                Number
              </th>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("OperatorName")}
              >
                Operator
              </th>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Circle")}
              >
                Circle
              </th>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("Amount")}
              >
                Amount
              </th>
              <th
                className="sort"
                style={{ cursor: "pointer" }}
                onClick={() => handleSort("RechargeUserId")}
              >
                User ID
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="list form-check-all">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <tr key={record.RecordID}>
                  <td>{record.RecordID}</td>
                  <td>{record.Number}</td>
                  <td>{record.OperatorName}</td>
                  <td>{record.Circle}</td>
                  <td>₹{record.Amount}</td>
                  <td>{record.RechargeUserId}</td>
                  <td>
                    <div className="d-flex gap-2 justify-content-center">
                      <Button
                        style={{
                          width: "100px",
                          padding: "5px",
                          fontSize: "0.8rem",
                        }}
                        color="primary"
                        size="sm"
                        onClick={() => handleUpdateClick(record)}
                        disabled={lockedRecords.has(record.RecordID)}
                      >
                        {lockedRecords.has(record.RecordID)
                          ? "Processing..."
                          : "Proceed"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  <h5>Sorry! No Result Found</h5>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <div className="pagination-wrap hstack gap-2">
          <Button
            color="secondary"
            outline
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="p-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            color="secondary"
            outline
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>

      <CustomerModal
        isOpen={isEditModalOpen}
        toggle={toggleEditModal}
        onSave={handleSave}
        onRefund={handleRefund}
        customer={customerForModal}
      />
      <SuccessModal
        isOpen={isSuccessModalOpen}
        toggle={() => setIsSuccessModalOpen(false)}
        message={successMessage}
      />
      {/* NEW: Render the FailureModal */}
      <FailureModal
        isOpen={isFailureModalOpen}
        toggle={() => setIsFailureModalOpen(false)}
        message={failureMessage}
      />
    </div>
  );
};

export default OfflineDTHDataTable;
