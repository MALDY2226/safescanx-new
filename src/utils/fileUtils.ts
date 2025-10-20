export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap: { [key: string]: string } = {
    // Executables
    exe: '⚠️',
    bat: '⚠️',
    cmd: '⚠️',
    scr: '⚠️',
    msi: '⚠️',
    
    // Scripts
    js: '📄',
    py: '🐍',
    sh: '📜',
    ps1: '💻',
    
    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
  };
  
  return iconMap[extension || ''] || '📄';
}

export function getThreatColor(verdict: string): string {
  const colorMap: { [key: string]: string } = {
    'safe': 'text-green-600',
    'suspicious': 'text-yellow-600',
    'malicious': 'text-red-600',
    'critical': 'text-red-800'
  };
  
  return colorMap[verdict] || 'text-gray-600';
}

export function getThreatBgColor(verdict: string): string {
  const colorMap: { [key: string]: string } = {
    'safe': 'bg-green-100',
    'suspicious': 'bg-yellow-100',
    'malicious': 'bg-red-100',
    'critical': 'bg-red-200'
  };
  
  return colorMap[verdict] || 'bg-gray-100';
}