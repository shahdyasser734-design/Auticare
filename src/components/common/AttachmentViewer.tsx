import { useState } from 'react';
import { FileIcon, FileDown, ExternalLink, Maximize2, X } from 'lucide-react';
import { Button } from './Button';

// Utility for formatting URL
// eslint-disable-next-line react-refresh/only-export-components
export const getFullFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'https://auticare-production-828c.up.railway.app';
  // Remove trailing slash from baseUrl if exists, ensure path has leading slash
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'zip': return 'application/zip';
    default: return 'application/octet-stream';
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export const forceDownload = async (url: string, filename: string) => {
  try {
    // Attempt to bypass CORS locally by stripping the backend host if present,
    // so the request goes through the local Vite proxy.
    let fetchUrl = url;
    if (url.startsWith('https://auticare-production-828c.up.railway.app/uploads')) {
      fetchUrl = url.replace('https://auticare-production-828c.up.railway.app', '');
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const rawBlob = await response.blob();
    const mimeType = getMimeType(filename) || rawBlob.type;
    const blob = new Blob([rawBlob], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Blob download failed, attempting native anchor download', error);
    // Fallback: Use standard anchor tag download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    // We intentionally do NOT use target="_blank" here, as the user strictly 
    // requested we do not open a new tab/preview for downloads.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

interface AttachmentViewerProps {
  content: string;
}

export const AttachmentViewer = ({ content }: AttachmentViewerProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!content) return null;

  const match = content.match(/Attached File:\s*(.+)/);
  if (!match) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  const rawText = content.replace(/(\n\n)?Attached File:\s*.+/, '').trim();
  const rawPath = match[1].trim();
  const fileUrl = getFullFileUrl(rawPath);
  let fileName = fileUrl.split('/').pop() || 'document';
  // remove query params if any
  fileName = fileName.split('?')[0];
  
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

  return (
    <div className="flex flex-col gap-3 text-left w-full">
      {rawText && <span className="whitespace-pre-wrap">{rawText}</span>}
      
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 w-full max-w-[300px]">
        {isImage ? (
          <div className="flex flex-col gap-3">
            <div className="relative group cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
              <img src={fileUrl} alt={fileName} className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Maximize2 className="text-white drop-shadow-md" size={24} />
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button size="sm" variant="outline" className="flex-1 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 justify-center" onClick={() => window.open(fileUrl, '_blank')}>
                <ExternalLink size={14} className="mr-1" /> Open
              </Button>
              <Button size="sm" className="flex-1 justify-center" onClick={() => forceDownload(fileUrl, fileName)}>
                <FileDown size={14} className="mr-1" /> Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                <FileIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={fileName}>{fileName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Document</p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button size="sm" variant="outline" className="flex-1 bg-white hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 justify-center" onClick={() => window.open(fileUrl, '_blank')}>
                <ExternalLink size={14} className="mr-1" /> Open
              </Button>
              <Button size="sm" className="flex-1 justify-center" onClick={() => forceDownload(fileUrl, fileName)}>
                <FileDown size={14} className="mr-1" /> Download
              </Button>
            </div>
          </div>
        )}
      </div>

      {isPreviewOpen && isImage && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsPreviewOpen(false)}>
          <button className="absolute top-4 right-4 text-white hover:text-rose-400 bg-white/10 p-2 rounded-full transition-colors" onClick={() => setIsPreviewOpen(false)}>
            <X size={24} />
          </button>
          <img src={fileUrl} alt={fileName} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
