import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { isValidFileType, formatFileSize } from '@/lib/importUtils';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function FileDropzone({ onFileSelect, isLoading }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!isValidFileType(file)) {
        setError('Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }

      // Max file size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndSelect(files[0]);
      }
    },
    [validateAndSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndSelect(files[0]);
      }
    },
    [validateAndSelect]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          {isDragOver ? (
            <FileSpreadsheet className="w-12 h-12 text-cyan-400 animate-pulse" />
          ) : (
            <Upload className="w-12 h-12 text-white/30" />
          )}

          <div className="space-y-2">
            <p className="text-sm text-white/60">
              {isDragOver ? (
                <span className="text-cyan-400 font-medium">Drop your file here</span>
              ) : (
                <>
                  <span className="text-cyan-400 font-medium">Click to upload</span>
                  {' or drag and drop'}
                </>
              )}
            </p>
            <p className="text-xs text-white/30">
              CSV, Excel (.xlsx, .xls) up to 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
