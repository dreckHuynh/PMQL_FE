/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToExcel(data: any[], fileName: string = "export.xlsx") {
  if (!data.length) {
    console.warn("No data to export.");
    return;
  }

  // Convert JSON to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create a workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate buffer and create Blob
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const excelBlob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Save file
  saveAs(excelBlob, fileName);
}
