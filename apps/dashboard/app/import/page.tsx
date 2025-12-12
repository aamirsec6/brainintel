'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CSVUploadResponse {
  filename: string;
  file_path?: string; // Added file path from server
  rows_count: number;
  columns: string[];
  detected_mapping: Record<string, string>;
  preview: Record<string, string>[];
}

interface ImportResult {
  success: boolean;
  profiles_created: number;
  profiles_updated: number;
  errors: number;
  duration_ms: number;
}

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<CSVUploadResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload directly to onboarding service (port 3005) for file uploads
      const response = await fetch('http://localhost:3005/onboarding/csv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data: CSVUploadResponse = await response.json();
      setPreview(data);
      setColumnMapping(data.detected_mapping);
      
      // Store file path for import (the service stores it in /tmp/uploads/)
      // We'll use the filename to reconstruct the path
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !file) return;

    setImporting(true);
    setError(null);

    try {
      // Import the data using the file path from upload response
      if (!preview.file_path) {
        throw new Error('File path not available. Please upload the file again.');
      }

      const importResponse = await fetch('http://localhost:3005/onboarding/csv/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: preview.file_path, // Use file path from upload response
          column_mapping: columnMapping,
        }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error?.message || 'Import failed');
      }

      const result: ImportResult = await importResponse.json();
      setImportResult(result);

      // Refresh customer list after import
      setTimeout(() => {
        router.push('/customers');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const updateMapping = (csvColumn: string, targetField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvColumn]: targetField,
    }));
  };

  return (
    <div className="p-6 bg-gray-900 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Import Customers</h1>
        <p className="text-sm text-gray-400">Upload CSV file to import customer data</p>
      </div>

      <div className="max-w-4xl">
        {/* Step 1: File Upload */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Step 1: Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-300 mb-2">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-sm text-gray-400">
                CSV files only (phone, email, name, etc.)
              </p>
            </label>
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload & Preview'}
            </button>
          )}
        </div>

        {/* Step 2: Preview & Column Mapping */}
        {preview && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Step 2: Review & Map Columns
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                File: <strong className="text-white">{preview.filename}</strong> ({preview.rows_count} rows)
              </p>
              <p className="text-sm text-gray-400">
                Detected columns: {preview.columns.join(', ')}
              </p>
            </div>

            {/* Column Mapping */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 text-white">Map CSV Columns to Fields:</h3>
              <div className="space-y-2">
                {preview.columns.map((col) => (
                  <div key={col} className="flex items-center gap-4">
                    <label className="w-32 text-sm text-gray-300">{col}:</label>
                    <select
                      value={columnMapping[col] || ''}
                      onChange={(e) => updateMapping(col, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select field --</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="name">Full Name</option>
                      <option value="first_name">First Name</option>
                      <option value="last_name">Last Name</option>
                      <option value="city">City</option>
                      <option value="state">State</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Table */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Preview (first 5 rows):</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-700">
                    <tr>
                      {preview.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-700 divide-y divide-gray-600">
                    {preview.preview.map((row, idx) => (
                      <tr key={idx}>
                        {preview.columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-2 text-sm text-white"
                          >
                            {row[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={importing || !columnMapping.phone && !columnMapping.email}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : `Import ${preview.rows_count} Customers`}
            </button>

            {(!columnMapping.phone && !columnMapping.email) && (
              <p className="mt-2 text-sm text-red-600">
                ⚠️ Please map at least Phone or Email column
              </p>
            )}
          </div>
        )}

        {/* Step 3: Import Results */}
        {importResult && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Step 3: Import Results</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Profiles Created:</span>
                <span className="font-semibold text-green-400">
                  {importResult.profiles_created}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profiles Updated:</span>
                <span className="font-semibold text-blue-400">
                  {importResult.profiles_updated}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Errors:</span>
                <span className="font-semibold text-red-400">
                  {importResult.errors}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="font-semibold text-white">
                  {(importResult.duration_ms / 1000).toFixed(2)}s
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-medium">
                ✅ Import completed! Redirecting to customers page...
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 font-medium">❌ Error</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-white mb-2">CSV Format Guide</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• CSV should have headers in the first row</li>
            <li>• Required: At least one of Phone or Email</li>
            <li>• Supported columns: phone, email, name, first_name, last_name, city, state</li>
            <li>• The system will auto-detect column mappings</li>
            <li>• Duplicate customers will be merged automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

