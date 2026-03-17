import React, { useState } from 'react';
import { Link as LinkIcon, AlertCircle } from 'lucide-react';
import type { URLInput } from '../types/scan';

interface URLInputProps {
  onURLSubmit: (urlInput: URLInput) => void;
  isScanning: boolean;
}

export default function URLInput({ onURLSubmit, isScanning }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateURL = (urlString: string): string | null => {
    if (!urlString.trim()) {
      return 'Please enter a URL';
    }

    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'Only HTTP and HTTPS URLs are supported';
      }
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateURL(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    const fullURL = url.startsWith('http') ? url : `https://${url}`;
    onURLSubmit({ url: fullURL });
    setUrl('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check URL Safety</h2>
            <p className="text-gray-600 text-sm">Scan any link for malicious content</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com or example.com"
              disabled={isScanning}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isScanning || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-5 h-5" />
            {isScanning ? 'Scanning URL...' : 'Scan URL'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            SafeScanX checks URLs against VirusTotal's extensive threat database to detect malicious, phishing, and suspicious websites in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
