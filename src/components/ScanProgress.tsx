import React from 'react';
import { Shield, Hash, Search, FileText, Activity, CheckCircle, XCircle, Loader } from 'lucide-react';
import type { ScanProgress } from '../types/scan';

interface ScanProgressProps {
  progress: ScanProgress;
  fileName: string;
  sha256Hash?: string;
}

export default function ScanProgress({ progress, fileName, sha256Hash }: ScanProgressProps) {
  const stages = [
    { id: 'uploading', label: 'Uploading File', icon: Shield },
    { id: 'hashing', label: 'Generating Hash', icon: Hash },
    { id: 'hash-check', label: 'Hash Database Check', icon: Search },
    { id: 'heuristic', label: 'Heuristic Analysis', icon: FileText },
    { id: 'static', label: 'Static Analysis', icon: FileText },
    { id: 'behavioral', label: 'Behavioral Analysis', icon: Activity },
    { id: 'complete', label: 'Analysis Complete', icon: CheckCircle }
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === progress.stage);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Scanning: {fileName}</h3>
            {sha256Hash && (
              <p className="text-sm text-gray-500 font-mono mt-1">
                SHA-256: {sha256Hash}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {progress.stage === 'error' ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : progress.stage === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress.progress)}%
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.stage === 'error' ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-gray-600">{progress.message}</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex || progress.stage === 'complete';
            const isError = progress.stage === 'error' && index === currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center space-x-3 transition-all duration-200 ${
                  isActive ? 'scale-105' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
                    isError
                      ? 'bg-red-100 text-red-600'
                      : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted && !isError ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                
                <span
                  className={`font-medium transition-colors duration-200 ${
                    isError
                      ? 'text-red-600'
                      : isCompleted
                      ? 'text-green-600'
                      : isActive
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>

                {isActive && (
                  <div className="flex-1 ml-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.progress - (index * 100 / stages.length)) * stages.length / 100 * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {progress.stage === 'error' && (
        <div className="p-6 border-t border-gray-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Scan Failed</span>
          </div>
          <p className="text-red-700 mt-1">{progress.message}</p>
        </div>
      )}
    </div>
  );
}