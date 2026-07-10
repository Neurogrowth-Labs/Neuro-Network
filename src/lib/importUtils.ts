import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedRow {
  [key: string]: string | null;
}

export interface ParsedData {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string | null;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ContactFields {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  met_at?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

// Parse CSV file
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as ParsedRow[];
        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

// Parse Excel file
export async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
          header: 1,
          defval: null,
        });

        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [], totalRows: 0 });
          return;
        }

        // First row is headers
        const headers = (jsonData[0] as unknown as string[]).map((h) =>
          String(h || '').trim()
        );

        // Rest are data rows
        const rows: ParsedRow[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const rowArray = jsonData[i] as unknown as (string | null)[];
          const row: ParsedRow = {};
          headers.forEach((header, index) => {
            row[header] = rowArray[index] != null ? String(rowArray[index]) : null;
          });
          rows.push(row);
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length,
        });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${(error as Error).message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Parse file based on extension
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error(`Unsupported file type: ${extension}`);
  }
}

// Validate email format
export function validateEmail(email: string): boolean {
  if (!email) return true; // Empty is valid (optional field)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Validate phone format (basic validation)
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Empty is valid (optional field)
  // Allow digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7;
}

// Normalize phone number
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

// Validate a single row
export function validateRow(
  row: ParsedRow,
  mappings: Record<string, keyof ContactFields>,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check mapped fields
  for (const [sourceCol, targetField] of Object.entries(mappings)) {
    const value = row[sourceCol];

    if (targetField === 'email' && value && !validateEmail(value)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        value,
        message: 'Invalid email format',
      });
    }

    if (targetField === 'phone' && value && !validatePhone(value)) {
      errors.push({
        row: rowIndex,
        field: 'phone',
        value,
        message: 'Invalid phone format',
      });
    }
  }

  return errors;
}

// Validate all rows
export function validateAllRows(
  rows: ParsedRow[],
  mappings: Record<string, keyof ContactFields>
): ValidationResult {
  const allErrors: ValidationError[] = [];

  rows.forEach((row, index) => {
    const rowErrors = validateRow(row, mappings, index + 1);
    allErrors.push(...rowErrors);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

// Normalize contact data from parsed row
export function normalizeContact(
  row: ParsedRow,
  mappings: Record<string, keyof ContactFields>
): ContactFields {
  const contact: ContactFields = {};

  for (const [sourceCol, targetField] of Object.entries(mappings)) {
    let value = row[sourceCol]?.trim() || '';

    // Special normalization for specific fields
    if (targetField === 'phone') {
      value = normalizePhone(value);
    } else if (targetField === 'email') {
      value = value.toLowerCase();
    }

    if (value) {
      contact[targetField] = value;
    }
  }

  // Generate full_name if not mapped but first/last name are
  if (!contact.full_name && (contact.first_name || contact.last_name)) {
    contact.full_name = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ');
  }

  // Extract first/last from full_name if not present
  if (contact.full_name && !contact.first_name && !contact.last_name) {
    const parts = contact.full_name.split(' ');
    contact.first_name = parts[0] || '';
    contact.last_name = parts.slice(1).join(' ') || '';
  }

  return contact;
}

// Get sample values for a column
export function getSampleValues(rows: ParsedRow[], column: string, limit = 3): string[] {
  const samples: string[] = [];
  for (const row of rows) {
    const value = row[column];
    if (value && !samples.includes(value)) {
      samples.push(value);
      if (samples.length >= limit) break;
    }
  }
  return samples;
}

// Check if file is valid type
export function isValidFileType(file: File): boolean {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const validExtensions = ['csv', 'xlsx', 'xls'];

  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    validTypes.includes(file.type) ||
    (extension !== undefined && validExtensions.includes(extension))
  );
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
