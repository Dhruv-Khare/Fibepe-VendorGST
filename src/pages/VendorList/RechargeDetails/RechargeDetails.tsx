import React, { useState, useMemo, FC, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- NEW: Import the ProviderHeader and its type ---
import ProviderHeader, { ProviderSummary } from "./ProviderHeader"; 

// --- (All type definitions and constants remain the same) ---
type RechargeRecord = {
  LedgerId: number;
  FibepeId: number;
  Number: string;
  OperatorName: string;
  CircleName: string;
  ServiceType: string;
  Amount: number;
  FinalStatus: string;
  ProviderName: string;
  CreatedDate: string;
  OperatorRefId: string;
};
type SortDirection = "ascending" | "descending";
interface SortConfig {
  key: keyof RechargeRecord;
  direction: SortDirection;
}
interface TableHeader {
  key: keyof RechargeRecord;
  label: string;
}
const ITEMS_PER_PAGE = 10;
const RechargeAPI_URL =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetRechargeDetail";

const RechargeMonthlyAPI_URL =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetRechargeMonthlyDetail";

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
const RechargeDetailTable: FC = () => {
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
  const [records, setRecords] = useState<RechargeRecord[]>(() =>
    getInitialState("recharge_records", [])
  );
  const [searchTerm, setSearchTerm] = useState<string>(""); // Search term doesn't need to persist
  const [sortConfig, setSortConfig] = useState<SortConfig>(() =>
    getInitialState("recharge_sortConfig", {
      key: "LedgerId",
      direction: "descending",
    })
  );
  const [currentPage, setCurrentPage] = useState<number>(() =>
    getInitialState("recharge_currentPage", 1)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(() =>
    getInitialState("recharge_hasSearched", false)
  );
  const [isFormDirty, setIsFormDirty] = useState<boolean>(true); // This should always start as true

  const [year, setYear] = useState<number>(() =>
    getInitialState("recharge_year", new Date().getFullYear())
  );
  const [month, setMonth] = useState<number>(() =>
    getInitialState("recharge_month", new Date().getMonth() + 1)
  );
  const [day, setDay] = useState<number>(() =>
    getInitialState("recharge_day", new Date().getDate())
  );

//   // --- USEEFFECT HOOKS TO SAVE STATE TO SESSIONSTORAGE ---
//    // --- NEW: Persist reportType state ---
//  useEffect(() => {
//     // Only save records to session storage if the report type is 'date'
//     if (reportType === "date") {
//       sessionStorage.setItem("recharge_records", JSON.stringify(records));
//     }
//   }, [records, reportType]); // <-- Make sure to add reportType here
  // useEffect(() => {
  //   sessionStorage.setItem("recharge_records", JSON.stringify(records));
  // }, [records]);
  useEffect(() => {
    sessionStorage.setItem("recharge_sortConfig", JSON.stringify(sortConfig));
  }, [sortConfig]);
  useEffect(() => {
    sessionStorage.setItem("recharge_currentPage", JSON.stringify(currentPage));
  }, [currentPage]);
  useEffect(() => {
    sessionStorage.setItem("recharge_hasSearched", JSON.stringify(hasSearched));
  }, [hasSearched]);
  useEffect(() => {
    sessionStorage.setItem("recharge_year", JSON.stringify(year));
  }, [year]);
  useEffect(() => {
    sessionStorage.setItem("recharge_month", JSON.stringify(month));
  }, [month]);
  useEffect(() => {
    sessionStorage.setItem("recharge_day", JSON.stringify(day));
  }, [day]);
   // --- NEW: useEffect to re-fetch data on page load ---
  useEffect(() => {
    // Check if a search was previously run in this session
    const previouslySearched = getInitialState("recharge_hasSearched", false);

    // If it was, automatically fetch the data using the restored state
    if (previouslySearched) {
      fetchRechargeData();
    }
  }, []);


  // --- NEW: Calculate provider summary data from records ---
  const providerSummary = useMemo<ProviderSummary[]>(() => {
    // Return empty array if there's nothing to process
    if (records.length === 0) {
      return [];
    }
    // Use a Map to aggregate data for each unique provider
    const summaryMap = new Map<string, Omit<ProviderSummary, "providerName">>();
    for (const record of records) {
      const providerName = record.ProviderName || "Unknown";
      // Initialize the provider if it's not in the map yet
      if (!summaryMap.has(providerName)) {
        summaryMap.set(providerName, {
          successAmount: 0,
          failedAmount: 0,
          totalAmount: 0,
        });
      }
      const current = summaryMap.get(providerName)!;
      // Add to total amount
      current.totalAmount += record.Amount;
      // Add to success or failed amount based on status
      const status = record.FinalStatus.toLowerCase();
      if (status === "success") {
        current.successAmount += record.Amount;
      } else if (status === "failed") {
        current.failedAmount += record.Amount;
      }
    }
    // Convert the map back to an array of objects for the component
    return Array.from(summaryMap.entries()).map(([providerName, amounts]) => ({
      providerName,
      ...amounts,
    }));
  }, [records]);



 // --- MODIFIED: fetchRechargeData now handles both report types ---
  const fetchRechargeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const formattedMonth = String(month).padStart(2, "0");

    // Determine the API URL and parameters based on the selected report type
    let apiUrl = "";
    if (reportType === "month") {
      apiUrl = `${RechargeMonthlyAPI_URL}?month=${formattedMonth}&year=${year}`;
    } else {
      const formattedDay = String(day).padStart(2, "0");
      apiUrl = `${RechargeAPI_URL}?date=${formattedDay}&month=${formattedMonth}&year=${year}`;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { Accept: "*/*", "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.IsSuccess && data.payLoad?.AllRechargeDetail) {
        setRecords(data.payLoad.AllRechargeDetail);
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

  // const totalAmount = useMemo(() => {
  //   if (!hasSearched) return 0;
  //   return records.reduce((sum, record) => {
  //     if (record.FinalStatus.toLowerCase() === "success") {
  //       return sum + record.Amount;
  //     }
  //     return sum;
  //   }, 0);
  // }, [records, hasSearched]);

  const handleSort = (key: keyof RechargeRecord) => {
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

  const handleExportToExcel = useCallback(() => {
    if (records.length === 0) {
      alert("No data to export!");
      return;
    }

    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const fileName = "recharge_details";

    const ws = XLSX.utils.json_to_sheet(records);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    saveAs(data, fileName + fileExtension);
  }, [records]);

  // --- (The rest of the component remains the same) ---
  const tableHeaders: TableHeader[] = [
    { key: "LedgerId", label: "Ledger Id" },
    { key: "FibepeId", label: "Fibepe Id" },
    { key: "Number", label: "Number" },
    { key: "OperatorName", label: "Operator Name" },
    { key: "CircleName", label: "Circle Name" },
    { key: "ServiceType", label: "Service Type" },
    { key: "Amount", label: "Amount" },
    { key: "FinalStatus", label: "Final Status" },
    { key: "ProviderName", label: "Provider Name" },
    { key: "OperatorRefId", label: "Operator Ref Id" },
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
          <div className="col-md-3">
            <label htmlFor="report-type-select" className="form-label">
              Report Type
            </label>
            <select
              id="report-type-select"
              className="form-select"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as "date" | "month");
                setIsFormDirty(true);
              }}
            >
              <option value="date">Date Wise</option>
              <option value="month">Month Wise</option>
            </select>
          </div>

          {/* --- MODIFIED: Day dropdown is now conditional --- */}
          {reportType === "date" && (
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
          )}

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


      {/* --- NEW: Render the ProviderHeader component --- */}
      {/* This section will appear after a search is initiated */}
      {(hasSearched || isLoading) && !error && (
        <div className="mb-4">
          <ProviderHeader data={providerSummary} isLoading={isLoading} />
        </div>
      )}


      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {hasSearched && !error && (
        <>
          <div className="row g-4 mb-3">
            <div className="col-sm">
              <div className="d-flex justify-content-end align-items-center mb-3">
                {/* <div className="d-flex align-items-center">
                  <h5 style={{ fontWeight: "bold" }}>
                    Total Success Amount:{" "}
                    <span className="text-success fw-bold">
                      {totalAmount.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })}
                    </span>
                  </h5>
                </div> */}
                <div className="d-flex align-items-center gap-2">
                  <Button
                    color="success"
                    outline
                    onClick={handleExportToExcel}
                    disabled={isLoading || records.length === 0}
                  >
                    <i className="ri-file-excel-2-line align-bottom me-1"></i>{" "}
                    Export
                  </Button>
                  <div
                    className="search-box ms-2"
                    style={{ position: "relative" }}
                  >
                    <input
                      id="recharge-search"
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
                        pointerEvents: "none",
                      }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    <tr key={record.LedgerId}>
                      <td>{record.LedgerId}</td>
                      <td>{record.FibepeId}</td>
                      <td>{record.Number}</td>
                      <td>{record.OperatorName}</td>
                      <td>{record.CircleName}</td>
                      <td>{record.ServiceType}</td>
                      <td>₹{record.Amount}</td>
                      <td>
                        <span
                          className={`badge ${
                            record.FinalStatus.toLowerCase() === "success"
                              ? "bg-success-subtle text-success"
                              : record.FinalStatus.toLowerCase() === "failed"
                              ? "bg-danger-subtle text-danger"
                              : "bg-warning-subtle text-warning"
                          }`}
                        >
                          {record.FinalStatus}
                        </span>
                      </td>
                      <td>{record.ProviderName}</td>
                      <td>{record.OperatorRefId}</td>
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

export default RechargeDetailTable;
