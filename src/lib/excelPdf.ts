import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadSampleStudentTemplate() {
  const sampleData = [
    {
      'Register Number': '24CS001',
      'Student Name': 'Arun Kumar',
      Program: 'CSE',
      Class: 'CSE-A',
      Year: 3,
      Section: 'A',
      'Subject Code': 'CS501',
    },
    {
      'Register Number': '24CS002',
      'Student Name': 'Bhavya Sharma',
      Program: 'CSE',
      Class: 'CSE-A',
      Year: 3,
      Section: 'A',
      'Subject Code': 'CS501',
    },
    {
      'Register Number': '24EC001',
      'Student Name': 'Chetan Reddy',
      Program: 'ECE',
      Class: 'ECE-A',
      Year: 3,
      Section: 'A',
      'Subject Code': 'EC501',
    },
    {
      'Register Number': '24EE001',
      'Student Name': 'Divya Patel',
      Program: 'EEE',
      Class: 'EEE-A',
      Year: 3,
      Section: 'A',
      'Subject Code': 'EE501',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, 'Student_Import_Template.xlsx');
}

export function exportToExcel(filename: string, sheetName: string, data: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(filename: string, data: any[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(title: string, headers: string[], rows: any[][], filename: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EXAM HALL ROOM & SEAT ALLOTMENT SYSTEM', 14, 13);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 220, 13);

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.text(title, 14, 28);

  autoTable(doc, {
    startY: 32,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`${filename}.pdf`);
}
