import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import FileUpload from './components/FileUpload';
import ScanProgress from './components/ScanProgress';
import ScanResults from './components/ScanResults';
import { readFileAsText } from './utils/fileUtils';
import type { FileUpload as FileUploadType, ScanProgress as ScanProgressType, CompleteScanData } from './types/scan';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type AppState = 'upload' | 'scanning' | 'results';

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [currentFile, setCurrentFile] = useState<FileUploadType | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgressType>({
    stage: 'uploading',
    progress: 0,
    message: 'Preparing to scan...'
  });
  const [scanResults, setScanResults] = useState<CompleteScanData | null>(null);

  const handleFileSelect = async (fileUpload: FileUploadType) => {
    setCurrentFile(fileUpload);
    setAppState('scanning');
    
    // Start scanning process
    await performScan(fileUpload);
  };

  const performScan = async (fileUpload: FileUploadType) => {
    try {
      // Stage 1: Uploading (already done)
      setScanProgress({
        stage: 'uploading',
        progress: 10,
        message: 'File uploaded successfully'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Hashing (already done during file selection)
      setScanProgress({
        stage: 'hashing',
        progress: 20,
        message: 'SHA-256 hash generated'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Read file content for static analysis
      let fileContent = '';
      try {
        fileContent = await readFileAsText(fileUpload.file);
      } catch (error) {
        console.log('Could not read file as text, continuing without content analysis');
      }

      // Stage 3: Hash Check
      setScanProgress({
        stage: 'hash-check',
        progress: 30,
        message: 'Checking hash against threat databases...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 4: Heuristic Analysis
      setScanProgress({
        stage: 'heuristic',
        progress: 50,
        message: 'Performing heuristic analysis...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 5: Static Analysis
      setScanProgress({
        stage: 'static',
        progress: 70,
        message: 'Analyzing file content for malicious patterns...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 6: Behavioral Analysis
      setScanProgress({
        stage: 'behavioral',
        progress: 85,
        message: 'Querying behavioral analysis databases...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call the Supabase Edge Function for comprehensive analysis
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co' || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
        throw new Error('Supabase configuration missing or using placeholder values. Please update your .env file with actual Supabase URL and anon key.');
      }
      
      const apiUrl = `${supabaseUrl}/functions/v1/malware-scan`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha256Hash: fileUpload.sha256Hash,
          fileName: fileUpload.file.name,
          fileSize: fileUpload.file.size,
          fileContent: fileContent
        })
      });

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      const scanData = await response.json();

      if (!scanData.success) {
        throw new Error(scanData.error || 'Scan failed');
      }

      // Stage 7: Complete
      setScanProgress({
        stage: 'complete',
        progress: 100,
        message: 'Analysis complete!'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Prepare complete scan data
      const completeScanData: CompleteScanData = {
        scanId: scanData.scanId,
        fileName: fileUpload.file.name,
        fileSize: fileUpload.file.size,
        sha256Hash: fileUpload.sha256Hash,
        scanTimestamp: new Date().toISOString(),
        result: scanData.result
      };

      setScanResults(completeScanData);
      setAppState('results');

    } catch (error) {
      console.error('Scan error:', error);
      setScanProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An error occurred during scanning'
      });
    }
  };

  const handleNewScan = () => {
    setCurrentFile(null);
    setScanResults(null);
    setScanProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Preparing to scan...'
    });
    setAppState('upload');
  };

  const handleBackToScan = () => {
    setAppState('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleBackToScan}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg 
                  className="w-7 h-7 text-white" 
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
              <h1 className="text-xl font-bold text-gray-900">SafeScanX</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === 'upload' && (
          <FileUpload 
            onFileSelect={handleFileSelect}
            isScanning={false}
          />
        )}

        {appState === 'scanning' && currentFile && (
          <ScanProgress
            progress={scanProgress}
            fileName={currentFile.file.name}
            sha256Hash={currentFile.sha256Hash}
          />
        )}

        {appState === 'results' && scanResults && (
          <ScanResults
            scanData={scanResults}
            onNewScan={handleNewScan}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 SafeScanX. Advanced malware detection for everyone.</p>
            <p className="text-sm mt-2">
              Made with ❤ by Rushikesh | Viraj
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;