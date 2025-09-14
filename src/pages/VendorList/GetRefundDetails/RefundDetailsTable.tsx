import React, { useState, useMemo, FC, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- (All type definitions and constants remain the same) ---
type RefundRecord = {
  Ledger_Id: string;
  Product_Id: string;
  Trace_Id: string;
  FibePe_Id: string;
  Payment_Id: string;
  Payout: string;
  Discount: string;
  Surcharge: string;
  RefundAmount: string;
  InsertOn: string;
};
type SortDirection = "ascending" | "descending";
interface SortConfig {
  key: keyof RefundRecord;
  direction: SortDirection;
}
interface TableHeader {
  key: keyof RefundRecord;
  label: string;
}
const ITEMS_PER_PAGE = 10;
const REFUNDDETAILS_API =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetRefundDetail";

// --- (Button component remains the same) ---
const Button: FC<{
  color?: string;
  outline?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ color = "secondary", outline = false, children, ...props }) => {
  const colorClass = outline ? `btn-outline-${color}` : `btn-${color}`;
  const className = `btn ${colorClass}`;
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
};

// --- MAIN COMPONENT ---
const RefundDetailsTable: FC = () => {
  // HELPER FUNCTION to get item from sessionStorage
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    const savedItem = sessionStorage.getItem(key);
    if (savedItem) {
      try {
        return JSON.parse(savedItem);
      } catch (e) {
        console.error("Failed to parse sessionStorage item", e);
        return defaultValue;
      }
    }
    return defaultValue;
  };
  // --- STATE MANAGEMENT ---
  // --- NEW: State for report type selection ---
  const [reportType, setReportType] = useState<"date" | "month">(() =>
    getInitialState("recharge_reportType", "date")
  );

  // --- STATE MANAGEMENT ---
  // MODIFIED: All state now initializes from sessionStorage
  const [records, setRecords] = useState<RefundRecord[]>(() =>
    getInitialState("refund_records", [])
  );
  const [searchTerm, setSearchTerm] = useState<string>(""); // Search term doesn't need to persist
  const [sortConfig, setSortConfig] = useState<SortConfig>(() =>
    getInitialState("refund_sortConfig", {
      key: "Ledger_Id",
      direction: "descending",
    })
  );
  const [currentPage, setCurrentPage] = useState<number>(() =>
    getInitialState("refund_currentPage", 1)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(() =>
    getInitialState("refund_hasSearched", false)
  );
  const [isFormDirty, setIsFormDirty] = useState<boolean>(true); // This should always start as true

  const [year, setYear] = useState<number>(() =>
    getInitialState("refund_year", new Date().getFullYear())
  );
  const [month, setMonth] = useState<number>(() =>
    getInitialState("refund_month", new Date().getMonth() + 1)
  );
  const [day, setDay] = useState<number>(() =>
    getInitialState("refund_day", new Date().getDate())
  );
  useEffect(() => {
    sessionStorage.setItem("refund_sortConfig", JSON.stringify(sortConfig));
  }, [sortConfig]);
  useEffect(() => {
    sessionStorage.setItem("refund_currentPage", JSON.stringify(currentPage));
  }, [currentPage]);
  useEffect(() => {
    sessionStorage.setItem("refund_hasSearched", JSON.stringify(hasSearched));
  }, [hasSearched]);
  useEffect(() => {
    sessionStorage.setItem("refund_year", JSON.stringify(year));
  }, [year]);
  useEffect(() => {
    sessionStorage.setItem("refund_month", JSON.stringify(month));
  }, [month]);
  useEffect(() => {
    sessionStorage.setItem("refund_day", JSON.stringify(day));
  }, [day]);
  // --- NEW: useEffect to re-fetch data on page load ---
  useEffect(() => {
    // Check if a search was previously run in this session
    const previouslySearched = getInitialState("refund_hasSearched", false);

    // If it was, automatically fetch the data using the restored state
    if (previouslySearched) {
      fetchRechargeData();
    }
  }, []);

  // --- MODIFIED: fetchRechargeData now handles both report types ---
  const fetchRechargeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const formattedMonth = String(month).padStart(2, "0");

    // Determine the API URL and parameters based on the selected report type
    const formattedDay = String(day).padStart(2, "0");
    let apiUrl = `${REFUNDDETAILS_API}?date=${formattedDay}&month=${formattedMonth}&year=${year}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { Accept: "*/*", "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.IsSuccess && data.payLoad?.RefundDetailResponse) {
        setRecords(data.payLoad.RefundDetailResponse);
      } else {
        setRecords([]);
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [day, month, year, reportType]); // <-- Added reportType to dependency array

  const filteredRecords = useMemo(() => {
    return records.filter((record) =>
      Object.values(record).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const sortedRecords = [...filteredRecords].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, sortConfig, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  const handleSort = (key: keyof RefundRecord) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
    setCurrentPage(1);
  };

  const handleFetchClick = () => {
    setIsFormDirty(false);
    setHasSearched(true);
    setCurrentPage(1);
    fetchRechargeData();
  };

  //   const handleExportToExcel = useCallback(() => {
  //     if (records.length === 0) {
  //       alert("No data to export!");
  //       return;
  //     }

  //     const fileType =
  //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  //     const fileExtension = ".xlsx";
  //     const fileName = "recharge_details";

  //     const ws = XLSX.utils.json_to_sheet(records);
  //     const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
  //     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  //     const data = new Blob([excelBuffer], { type: fileType });
  //     saveAs(data, fileName + fileExtension);
  //   }, [records]);

  // --- (The rest of the component remains the same) ---
  const tableHeaders: TableHeader[] = [
    { key: "Ledger_Id", label: "Ledger Id" },
    { key: "Product_Id", label: "Product Id" },
    { key: "Trace_Id", label: "Trace Id" },
    { key: "FibePe_Id", label: "Fibepe Id" },
    // { key: "Payment_Id", label: "Payment Id" },
    { key: "Payout", label: "Payout" },
    { key: "Discount", label: "Discount" },
    // { key: "Surcharge", label: "Surcharge" },
    { key: "RefundAmount", label: "Refund Ammount" },
    // { key: "InsertOn", label: "Insert On" },
  ];
  const yearOptions = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="card-body">
      <div className="p-3 mb-3 border rounded">
        {/* --- MODIFIED: Form layout adjusted for the new dropdown --- */}
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label htmlFor="day-select" className="form-label">
              Day
            </label>
            <select
              id="day-select"
              className="form-select"
              value={day}
              onChange={(e) => {
                setDay(Number(e.target.value));
                setIsFormDirty(true);
              }}
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label htmlFor="month-select" className="form-label">
              Month
            </label>
            <select
              id="month-select"
              className="form-select"
              value={month}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setIsFormDirty(true);
              }}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label htmlFor="year-select" className="form-label">
              Year
            </label>
            <select
              id="year-select"
              className="form-select"
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setIsFormDirty(true);
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <Button
              color="primary"
              onClick={handleFetchClick}
              disabled={isLoading || !isFormDirty}
            >
              {isLoading ? "Fetching..." : "Fetch Data"}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {hasSearched && !error && (
        <>
          <div className="table-responsive table-card mt-3 mb-1">
            <table
              className="table align-middle table-nowrap text-center"
              id="rechargeTable"
            >
              <thead className="table-light">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header.key}
                      style={{ cursor: "pointer", verticalAlign: "middle" }}
                      onClick={() => handleSort(header.key)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span>{header.label}</span>
                        <span
                          style={{
                            width: "1em",
                            visibility:
                              sortConfig.key === header.key
                                ? "visible"
                                : "hidden",
                          }}
                        >
                          {sortConfig.direction === "ascending" ? "▲" : "▼"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="list form-check-all">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <tr key={record.Ledger_Id}>
                      <td>{record.Ledger_Id}</td>
                      <td>{record.Product_Id}</td>
                      <td>{record.Trace_Id}</td>
                      <td>{record.FibePe_Id}</td>
                      {/* <td>{record.Payment_Id}</td> */}
                      <td>{record.Payout}</td>
                      <td>₹{record.Discount}</td>
                      {/* <td>{record.Surcharge}</td> */}
                      <td>{record.RefundAmount}</td>
                      {/* <td>{record.InsertOn}</td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <h5>Sorry! No Result Found For The Selected Date</h5>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            <div className="pagination-wrap hstack gap-2">
              <Button
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
                outline
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {!hasSearched && !error && (
        <div className="text-center p-5 border rounded mt-3">
          <h5>Please select a date and click "Fetch Data" to view details.</h5>
        </div>
      )}
    </div>
  );
};

export default RefundDetailsTable;
