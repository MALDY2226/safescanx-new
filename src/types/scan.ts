export interface FileUpload {
  file: File;
  sha256Hash: string;
  uploadProgress: number;
}

export interface URLInput {
  url: string;
}

export interface ScanProgress {
  stage: 'uploading' | 'hashing' | 'hash-check' | 'heuristic' | 'static' | 'behavioral' | 'url-check' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface HashCheckResult {
  found: boolean;
  source: string;
  verdict: string;
  lastSeen?: string;
  scanCount?: number;
  threatInfo?: any;
  externalSources?: any;
}

export interface HeuristicResult {
  riskScore: number;
  flags: string[];
  details: any;
}

export interface StaticAnalysisResult {
  riskScore: number;
  flags: string[];
  detectedPatterns: Array<{
    name: string;
    pattern: string;
    matches: number;
    severity: string;
  }>;
}

export interface BehavioralAnalysisResult {
  found: boolean;
  verdict: string;
  threatScore?: number;
  analysisDate?: string;
  behaviors?: any[];
  networkActivity?: any[];
  processes?: any[];
  note?: string;
  error?: string;
}

export interface URLCheckResult {
  found: boolean;
  detections: number;
  categories: string[];
  verdict: string;
  lastAnalysisDate?: string;
  analysisStats?: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
  };
}

export interface ScanResult {
  fileHashId?: string;
  overallVerdict: 'safe' | 'suspicious' | 'malicious' | 'critical';
  threatScore: number;
  hashCheckResult?: HashCheckResult;
  heuristicResult?: HeuristicResult;
  staticAnalysisResult?: StaticAnalysisResult;
  behavioralAnalysisResult?: BehavioralAnalysisResult;
  urlCheckResult?: URLCheckResult;
  externalSources: any;
}

export interface CompleteScanData {
  scanId: string;
  fileName?: string;
  fileSize?: number;
  sha256Hash?: string;
  url?: string;
  scanType: 'file' | 'url';
  scanTimestamp: string;
  result: ScanResult;
}

export interface ThreatIntelligence {
  id: string;
  sha256Hash: string;
  fileName: string;
  fileSize: number;
  overallVerdict: string;
  threatScore: number;
  lastSeen: string;
  scanCount: number;
}