import React, { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { calculateSHA256, formatFileSize, getFileIcon } from '../utils/fileUtils';
import type { FileUpload } from '../types/scan';

interface FileUploadProps {
  onFileSelect: (fileUpload: FileUpload) => void;
  isScanning: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

export default function FileUpload({ onFileSelect, isScanning }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setIsHashing(true);

    try {
      const sha256Hash = await calculateSHA256(file);
      
      const fileUpload: FileUpload = {
        file,
        sha256Hash,
        uploadProgress: 0
      };

      onFileSelect(fileUpload);
    } catch (error) {
      console.error('Error calculating file hash:', error);
      setError('Error processing file. Please try again.');
    } finally {
      setIsHashing(false);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
          <svg 
            className="w-10 h-10 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">SafeScanX</h1>
        <p className="text-xl text-gray-600">Advanced Malware Detection System</p>
        <p className="text-gray-500 mt-2">Upload files up to {formatFileSize(MAX_FILE_SIZE)} for comprehensive security analysis</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <X className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Upload Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Drop your file here or click to browse
          </h3>
          <p className="text-gray-500 mb-6">
            Supports all file types • Maximum {formatFileSize(MAX_FILE_SIZE)}
          </p>
          
          <input
            type="file"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isScanning}
          />
          
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
            disabled={isScanning}
          >
            Select File
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{getFileIcon(selectedFile.name)}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                {isHashing && (
                  <p className="text-blue-600 text-sm mt-1">Calculating SHA-256 hash...</p>
                )}
              </div>
            </div>
            
            {!isScanning && !isHashing && (
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>🔒 Files are analyzed securely and results are shared anonymously for threat intelligence</p>
      </div>
    </div>
  );
}