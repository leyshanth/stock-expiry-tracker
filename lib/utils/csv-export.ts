import { format } from 'date-fns';
import { ExpiryItem } from '../appwrite/database-service';

/**
 * Exports data to CSV and triggers download
 * @param data Array of objects to export
 * @param filename Name of the file without extension
 */
export function exportToCsv(data: any[], filename: string): void {
  // Convert object array to CSV string
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header]?.toString() || '';
      // If value contains comma, quote, or newline, wrap it in quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        // Double up any quotes
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    
    csvContent += row.join(',') + '\n';
  });
  
  // Trigger download
  downloadCSV(csvContent, filename);
}

/**
 * Converts an array of expiry items to CSV format
 * @param items Array of expiry items to convert
 * @returns CSV string
 */
export function convertToCSV(items: ExpiryItem[]): string {
  // Define CSV headers
  const headers = [
    'Barcode',
    'Item Name',
    'Quantity',
    'Expiry Date',
    'Deletion Date'
  ];
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  items.forEach(item => {
    const expiryDate = item.expiry_date instanceof Date 
      ? format(item.expiry_date, 'yyyy-MM-dd') 
      : format(new Date(item.expiry_date), 'yyyy-MM-dd');
    
    const deletionDate = item.deleted_at 
      ? (item.deleted_at instanceof Date 
        ? format(item.deleted_at, 'yyyy-MM-dd') 
        : format(new Date(item.deleted_at), 'yyyy-MM-dd'))
      : 'N/A';
    
    // We need to fetch the product name separately since it's not in the expiry item
    // For now, we'll use placeholder
    const row = [
      item.barcode,
      'Product Name', // This will be replaced with actual product name in the component
      item.quantity.toString(),
      expiryDate,
      deletionDate
    ];
    
    // Escape any commas in the data
    const escapedRow = row.map(field => {
      // If field contains comma, quote, or newline, wrap it in quotes
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        // Double up any quotes
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });
    
    csvContent += escapedRow.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * Downloads data as a CSV file
 * @param csvContent CSV content as string
 * @param filename Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add link to document
  document.body.appendChild(link);
  
  // Click the link to trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
