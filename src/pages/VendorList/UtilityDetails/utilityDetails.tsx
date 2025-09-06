import React, { useState, useMemo, FC, useCallback, useEffect } from "react";

// NEW: Import the libraries for Excel export
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- TYPE DEFINITIONS ---
type RechargeRecord = {
  LedgerId: number;
  FibepeId: number;
  ConsumerNumber: string;
  CategoryName: string;
  Amount: number;

  ConfirmationNumber: string;
  FinalStatus: string;
  CreatedDate: string;
  CustomerName: string;
  OrderNumber: string;
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

// --- CONFIGURATION ---
const ITEMS_PER_PAGE = 10;
const RechargeAPI_URL =
  "https://vendorgst.fibepe.com/api/User/Vendor/GetUtilityDetail";

// --- REUSABLE BUTTON COMPONENT ---
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
const UtilityDetailTable: FC = () => {
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
  // MODIFIED: All state now initializes from sessionStorage
  const [records, setRecords] = useState<RechargeRecord[]>(() => getInitialState('utility_records', []));
  const [searchTerm, setSearchTerm] = useState<string>(""); // Search term doesn't need to persist
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => getInitialState('utility_sortConfig', { key: "LedgerId", direction: "descending" }));
  const [currentPage, setCurrentPage] = useState<number>(() => getInitialState('utility_currentPage', 1));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(() => getInitialState('utility_hasSearched', false));
  const [isFormDirty, setIsFormDirty] = useState<boolean>(true); // This should always start as true

  const [year, setYear] = useState<number>(() => getInitialState('utility_year', new Date().getFullYear()));
  const [month, setMonth] = useState<number>(() => getInitialState('utility_month', new Date().getMonth() + 1));
  const [day, setDay] = useState<number>(() => getInitialState('utility_day', new Date().getDate()));
  
  // --- USEEFFECT HOOKS TO SAVE STATE TO SESSIONSTORAGE ---
  useEffect(() => { sessionStorage.setItem('utility_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { sessionStorage.setItem('utility_sortConfig', JSON.stringify(sortConfig)); }, [sortConfig]);
  useEffect(() => { sessionStorage.setItem('utility_currentPage', JSON.stringify(currentPage)); }, [currentPage]);
  useEffect(() => { sessionStorage.setItem('utility_hasSearched', JSON.stringify(hasSearched)); }, [hasSearched]);
  useEffect(() => { sessionStorage.setItem('utility_year', JSON.stringify(year)); }, [year]);
  useEffect(() => { sessionStorage.setItem('utility_month', JSON.stringify(month)); }, [month]);
  useEffect(() => { sessionStorage.setItem('utility_day', JSON.stringify(day)); }, [day]);


  // --- DATA FETCHING ---
  const fetchRechargeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
     // ✅ 1. FORMAT MONTH AND DAY WITH A LEADING ZERO
    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    
    try {
      const response = await fetch(`${RechargeAPI_URL}?date=${formattedDay}&month=${formattedMonth}&year=${year}`, {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data.IsSuccess && data.payLoad?.AllUtilityDetail) {
        setRecords(data.payLoad.AllUtilityDetail);
      } else {
        setRecords([]);
      }
    } catch (e: any) {
      setError(e.message || "An unknown error occurred while fetching data.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [day, month, year]);

  // --- MEMOIZED COMPUTATIONS ---
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

  const totalAmount = useMemo(() => {
    if (!hasSearched) return 0;
    return records.reduce((sum, record) => {
      if (record.FinalStatus.toLowerCase() === "success") {
        return sum + record.Amount;
      }
      return sum;
    }, 0);
  }, [records, hasSearched]);

  // --- EVENT HANDLERS ---
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
        setIsFormDirty(false); // Mark as clean after submission

    setHasSearched(true);
    setCurrentPage(1);
    fetchRechargeData();
  };
  // NEW: Function to handle the Excel export
    const handleExportToExcel = useCallback(() => {
      // We use the 'records' state which contains ALL data from the API
      if (records.length === 0) {
        alert("No data to export!");
        return;
      }
  
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      const fileExtension = '.xlsx';
      const fileName = 'utility_details';
  
      // 1. Create a new worksheet from our records (JSON data)
      const ws = XLSX.utils.json_to_sheet(records);
  
      // 2. Create a new workbook and append the worksheet
      const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
  
      // 3. Create the Excel file buffer
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
      // 4. Create a Blob to be saved
      const data = new Blob([excelBuffer], { type: fileType });
  
      // 5. Trigger the file download
      saveAs(data, fileName + fileExtension);
    }, [records]); // This function depends on the 'records' state
  
  // --- UI CONSTANTS ---
  const tableHeaders: TableHeader[] = [
    { key: "LedgerId", label: "Ledger Id" },
    { key: "FibepeId", label: "Fibepe Id" },
    { key: "ConsumerNumber", label: "Number" },
    {key:"CategoryName", label:"Category Name"},
    { key: "Amount", label: "Amount" },
    {key:"ConfirmationNumber", label:"Confirmation Number"},
    { key: "FinalStatus", label: "Final Status" },
    // { key: "CreatedDate", label: "Created Date" },
    {key:"CustomerName", label:"Customer Name"},
    { key: "OrderNumber", label: "Order Number" },
   
  ];

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  // NEW: Root element is now a React.Fragment <>
  return (
    <div className="card-body">
      <div className="p-3 mb-3 border rounded">
        <div className="row g-3 align-items-end">
            <div className="col-md-3">
            <label htmlFor="day-select" className="form-label">Day</label>
            {/* CHANGED: onChange now marks the form as dirty */}
            <select id="day-select" className="form-select" value={day} onChange={(e) => {
                setDay(Number(e.target.value));
                setIsFormDirty(true);
            }}>
              {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="month-select" className="form-label">Month</label>
            {/* CHANGED: onChange now marks the form as dirty */}
            <select id="month-select" className="form-select" value={month} onChange={(e) => {
                setMonth(Number(e.target.value));
                setIsFormDirty(true);
            }}>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="year-select" className="form-label">Year</label>
            {/* CHANGED: onChange now marks the form as dirty */}
            <select id="year-select" className="form-select" value={year} onChange={(e) => {
                setYear(Number(e.target.value));
                setIsFormDirty(true);
            }}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          
          <div className="col-md-3">
             {/* CHANGED: The disabled logic is updated */}
             <Button color="primary" onClick={handleFetchClick} disabled={isLoading || !isFormDirty}>
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
          <div className="row g-4 mb-3">
            <div className="col-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <h5 style={{ fontWeight: "bold" }}>
                    Total Amount:{" "}
                    <span className="text-success fw-bold">
                      {totalAmount.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })}
                    </span>
                  </h5>
                </div>
                {/* NEW: Wrapper for the export button and search bar */}
                <div className="d-flex align-items-center gap-2">
                   <Button 
                      color="success" 
                      outline 
                      onClick={handleExportToExcel}
                      disabled={isLoading || records.length === 0}
                    >
                     <i className="ri-file-excel-2-line align-bottom me-1"></i> Export
                   </Button>
                  <div className="search-box ms-2" style={{ position: "relative" }}>
                    <input
                      id="recharge-search" type="text" className="form-control"
                      placeholder="Search..." value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    <i className="ri-search-line search-icon" style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", pointerEvents: "none" }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="table-responsive table-card mt-3 mb-1">
            <table className="table align-middle table-nowrap text-center" id="rechargeTable">
              <thead className="table-light">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header.key} style={{ cursor: "pointer", verticalAlign: "middle" }} onClick={() => handleSort(header.key)}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.5rem" }}>
                        <span>{header.label}</span>
                        <span style={{ width: "1em", visibility: sortConfig.key === header.key ? "visible" : "hidden" }}>
                          {sortConfig.direction === "ascending" ? "▲" : "▼"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="list form-check-all">
                {isLoading ? (
                  <tr><td colSpan={10} className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td></tr>
                ) : paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <tr key={record.LedgerId}>
                      <td>{record.LedgerId}</td>
                      <td>{record.FibepeId}</td>
                      <td>{record.ConsumerNumber}</td>
                      <td>{record.CategoryName}</td>
                      <td>₹{record.Amount}</td>
                      <td>{record.ConfirmationNumber}</td>
                    <td><span className={`badge ${record.FinalStatus.toLowerCase() === "success" ? "bg-success-subtle text-success" : record.FinalStatus.toLowerCase() === "failed" ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"}`}>{record.FinalStatus}</span></td>
                   
                      <td>{record.CustomerName}</td>
                        <td>{record.OrderNumber}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={10} className="text-center py-5">
                    <h5>Sorry! No Result Found For The Selected Date</h5>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            <div className="pagination-wrap hstack gap-2">
              <Button outline onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
              <span className="p-2">Page {currentPage} of {totalPages || 1}</span>
              <Button outline onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
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

export default UtilityDetailTable;