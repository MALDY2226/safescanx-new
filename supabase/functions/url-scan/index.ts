import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface URLScanRequest {
  url: string;
}

interface URLScanResult {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const { url }: URLScanRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlCheckResult = await performURLCheck(supabase, url);

    // Store URL scan result
    const { data: scanResultData, error: scanError } = await supabase
      .from('url_scans')
      .insert({
        url: url,
        url_hash: await hashURL(url),
        detections: urlCheckResult.detections,
        verdict: urlCheckResult.verdict,
        categories: urlCheckResult.categories,
        analysis_stats: urlCheckResult.analysisStats
      })
      .select()
      .single();

    if (scanError) {
      console.error('Error storing scan result:', scanError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanId: scanResultData?.id || `scan_${Date.now()}`,
        result: urlCheckResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('URL scan error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function performURLCheck(supabase: any, url: string): Promise<URLScanResult> {
  try {
    const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');

    // Check local database first
    const urlHash = await hashURL(url);
    const { data: localData } = await supabase
      .from('url_scans')
      .select('*')
      .eq('url_hash', urlHash)
      .order('created_at', { ascending: false })
      .limit(1);

    if (localData && localData.length > 0) {
      const scan = localData[0];
      return {
        found: true,
        detections: scan.detections,
        categories: scan.categories || [],
        verdict: scan.verdict,
        lastAnalysisDate: scan.created_at
      };
    }

    // If VirusTotal API key is configured, query it
    if (virusTotalApiKey && virusTotalApiKey !== 'your-virustotal-api-key-here') {
      try {
        const urlId = btoa(url).replace(/[=+/]/g, (m) => ({ '=': '', '+': '-', '/': '_' }[m]));

        const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
          method: 'GET',
          headers: {
            'x-apikey': virusTotalApiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          const lastAnalysis = data.data?.attributes?.last_analysis_results || {};
          const analysisStats = data.data?.attributes?.last_analysis_stats || {};

          const categories = extractCategories(lastAnalysis);
          const maliciousCount = analysisStats.malicious || 0;
          const suspiciousCount = analysisStats.suspicious || 0;

          let verdict = 'clean';
          if (maliciousCount > 0) verdict = 'malicious';
          else if (suspiciousCount > 0) verdict = 'suspicious';

          return {
            found: true,
            detections: maliciousCount + suspiciousCount,
            categories: categories,
            verdict: verdict,
            lastAnalysisDate: data.data?.attributes?.last_analysis_date,
            analysisStats: analysisStats
          };
        }
      } catch (error) {
        console.warn('VirusTotal API error:', error);
      }
    }

    // Default safe response if API key not available
    return {
      found: false,
      detections: 0,
      categories: [],
      verdict: 'clean'
    };

  } catch (error) {
    console.error('URL check error:', error);
    return {
      found: false,
      detections: 0,
      categories: [],
      verdict: 'unknown'
    };
  }
}

function extractCategories(results: any): string[] {
  const categories = new Set<string>();

  for (const [, result] of Object.entries(results)) {
    const resultObj = result as { category?: string };
    if (resultObj?.category && resultObj.category !== 'undetected') {
      categories.add(resultObj.category);
    }
  }

  return Array.from(categories);
}

async function hashURL(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
