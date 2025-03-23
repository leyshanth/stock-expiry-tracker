import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ExpiryItem, Product } from '../appwrite/database-service';
import { formatDate } from './date-utils';

// Add the autotable plugin to the jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Exports data to PDF and triggers download
 * @param items Array of expiry items to export
 * @param filename Name of the file without extension
 */
export function exportToPdf(items: (ExpiryItem & { product?: Product })[], filename: string): void {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(0, 75, 254); // #004BFE
  doc.text('Deleted Items Report', 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
  
  // Prepare data for table
  const tableData = items.map(item => [
    item.product?.barcode || 'N/A',
    item.product?.name || 'Unknown Product',
    item.quantity?.toString() || '1',
    item.expiry_date ? formatDate(new Date(item.expiry_date)) : 'N/A',
    item.deleted_at ? formatDate(new Date(item.deleted_at)) : 'N/A'
  ]);
  
  // Define table headers
  const headers = [
    'Barcode',
    'Item Name',
    'Quantity',
    'Expiry Date',
    'Deletion Date'
  ];
  
  // Add table to PDF
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 35,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [0, 75, 254], // #004BFE
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 35 },
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      'Stock Expiry Tracker - Deleted Items Report',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
}
