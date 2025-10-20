import React, { useState, useEffect } from 'react';
import { Search, Clock, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { getThreatColor, getThreatBgColor, formatFileSize } from '../utils/fileUtils';
import { createClient } from '@supabase/supabase-js';
import type { ThreatIntelligence } from '../types/scan';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ThreatIntelligence() {
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');

  useEffect(() => {
    fetchThreatIntelligence();
  }, []);

  const fetchThreatIntelligence = async () => {
    try {
      const { data, error } = await supabase
        .from('file_hashes')
        .select(`
          id,
          sha256_hash,
          file_name,
          file_size,
          last_seen,
          scan_count,
          scan_results (
            overall_verdict,
            threat_score
          )
        `)
        .order('last_seen', { ascending: false })
        .limit(50);

      if (error) throw error;

      const threatData: ThreatIntelligence[] = data?.map(item => ({
        id: item.id,
        sha256Hash: item.sha256_hash,
        fileName: item.file_name,
        fileSize: item.file_size,
        overallVerdict: item.scan_results?.[0]?.overall_verdict || 'unknown',
        threatScore: item.scan_results?.[0]?.threat_score || 0,
        lastSeen: item.last_seen,
        scanCount: item.scan_count
      })) || [];

      setThreats(threatData);
    } catch (error) {
      console.error('Error fetching threat intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = 
      threat.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterVerdict === 'all' || threat.overallVerdict === filterVerdict;
    
    return matchesSearch && matchesFilter;
  });

  const verdictStats = threats.reduce((acc, threat) => {
    acc[threat.overallVerdict] = (acc[threat.overallVerdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <Shield className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading threat intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Threat Intelligence</h2>
        <p className="text-gray-600">Recent malware detections and security insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(verdictStats).map(([verdict, count]) => (
          <div key={verdict} className={`rounded-lg border-2 p-4 ${getThreatBgColor(verdict)} border-current`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${getThreatColor(verdict)}`}>{count}</p>
                <p className="text-gray-700 capitalize">{verdict}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${getThreatColor(verdict)}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by filename or hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verdicts</option>
            <option value="safe">Safe</option>
            <option value="suspicious">Suspicious</option>
            <option value="malicious">Malicious</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Threat List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Threats</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredThreats.length > 0 ? (
            filteredThreats.map((threat) => (
              <div key={threat.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getThreatBgColor(threat.overallVerdict)} ${getThreatColor(threat.overallVerdict)}`}>
                        {threat.overallVerdict}
                      </span>
                      <span className="text-gray-500 text-sm">{threat.threatScore}/100</span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 truncate">{threat.fileName}</h4>
                    <p className="text-sm text-gray-500 font-mono mt-1 truncate">
                      {threat.sha256Hash}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {formatFileSize(threat.fileSize)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(threat.lastSeen).toLocaleDateString()}
                      </span>
                      <span>{threat.scanCount} scan{threat.scanCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p>No threats found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}