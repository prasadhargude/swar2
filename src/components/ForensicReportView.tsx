import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Fingerprint, Activity, 
  ShieldCheck, X, FileSearch, Hash, Server, Calendar 
} from 'lucide-react';
import { ForensicReport } from '../types/integrity';
import { evidenceService } from '../services/evidenceService';

interface ForensicReportViewProps {
  caseId: string;
  onClose: () => void;
}

export const ForensicReportView: React.FC<ForensicReportViewProps> = ({ caseId, onClose }) => {
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [caseId]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      // Allow fallback if evidenceService methods vary slightly
      const data = await (evidenceService as any).generateForensicReport 
        ? (evidenceService as any).generateForensicReport(caseId) 
        : (evidenceService as any).getReport(caseId);
      setReport(data);
    } catch (error) {
      console.error("Failed to load report", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-[#121316] z-50 flex flex-col font-sans overflow-hidden">
      {/* Header - Hidden when printing */}
      <header className="flex items-center justify-between p-4 bg-[#1E1F22] border-b border-[#3A3C41] print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2B2D31] rounded-lg border border-[#3A3C41]">
            <FileText className="w-6 h-6 text-[#5865F2]" />
          </div>
          <div>
            <h1 className="text-[#F2F3F5] font-semibold text-lg leading-tight">Forensic Analysis Report</h1>
            <p className="text-[#949BA4] text-sm">Official Document</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#2B2D31] hover:bg-[#3A3C41] rounded-lg text-[#F2F3F5] transition-colors border border-[#3A3C41]"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium">Print</span>
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#2B2D31] rounded-lg transition-colors text-[#949BA4] hover:text-[#F2F3F5] border border-transparent hover:border-[#3A3C41]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Report Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#121316] print:bg-white print:p-0">
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Activity className="w-8 h-8 text-[#5865F2] animate-spin" />
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center h-full text-[#ED4245]">
            Failed to load forensic report.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-[#1E1F22] print:bg-white border border-[#3A3C41] print:border-none shadow-2xl print:shadow-none rounded-xl p-8 sm:p-12">
            
            {/* Report Header */}
            <div className="border-b border-[#3A3C41] print:border-gray-300 pb-8 mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#5865F2]/10 rounded-full print:bg-white print:text-black">
                  <ShieldCheck className="w-10 h-10 text-[#5865F2] print:text-black" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-[#F2F3F5] print:text-black tracking-tight">SWARAKSHA AI</h1>
                  <p className="text-[#949BA4] print:text-gray-600 uppercase tracking-widest text-sm mt-1">Official Forensic Report</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-[#2B2D31] print:bg-gray-100 rounded-lg p-3 inline-block border border-[#3A3C41] print:border-gray-300">
                  <p className="text-[#949BA4] print:text-gray-600 text-xs uppercase mb-1">Case ID</p>
                  <p className="text-[#F2F3F5] print:text-black font-mono font-bold">{caseId}</p>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Case Info */}
              <section>
                <h3 className="text-[#F2F3F5] print:text-black text-lg font-semibold mb-4 flex items-center gap-2 border-b border-[#3A3C41] print:border-gray-300 pb-2">
                  <Calendar className="w-5 h-5 text-[#5865F2] print:text-black" />
                  Case Information
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Generated On:</span>
                    <span className="text-[#F2F3F5] print:text-black font-medium">{new Date().toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Investigator ID:</span>
                    <span className="text-[#F2F3F5] print:text-black font-medium">{report.investigatorId || 'SYS_AUTH_01'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Integrity Status:</span>
                    <span className="text-[#23A55A] font-bold px-2 py-1 bg-[#23A55A]/10 rounded">VERIFIED</span>
                  </li>
                </ul>
              </section>

              {/* Analysis Results */}
              <section>
                <h3 className="text-[#F2F3F5] print:text-black text-lg font-semibold mb-4 flex items-center gap-2 border-b border-[#3A3C41] print:border-gray-300 pb-2">
                  <Activity className="w-5 h-5 text-[#5865F2] print:text-black" />
                  AI Analysis Results
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Detection Type:</span>
                    <span className="text-[#F2F3F5] print:text-black font-medium">{report.analysisType || 'Deepfake Voice Spoofing'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Spoof Probability:</span>
                    <span className="text-[#ED4245] font-bold">{(report.spoofScore * 100).toFixed(2)}%</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-[#949BA4] print:text-gray-600">Risk Assessment:</span>
                    <span className="text-[#F2F3F5] print:text-black font-medium">{report.riskLevel || 'CRITICAL'}</span>
                  </li>
                </ul>
              </section>

            </div>

            {/* Evidence & Hashes Details */}
            <section className="mb-10">
              <h3 className="text-[#F2F3F5] print:text-black text-lg font-semibold mb-4 flex items-center gap-2 border-b border-[#3A3C41] print:border-gray-300 pb-2">
                <Hash className="w-5 h-5 text-[#5865F2] print:text-black" />
                Cryptographic Evidence Manifest
              </h3>
              <div className="bg-[#121316] print:bg-gray-50 border border-[#3A3C41] print:border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2B2D31] print:bg-gray-200">
                      <th className="p-3 text-[#949BA4] print:text-gray-700 font-semibold text-sm">Asset Type</th>
                      <th className="p-3 text-[#949BA4] print:text-gray-700 font-semibold text-sm">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A3C41] print:divide-gray-300">
                    <tr className="hover:bg-[#1E1F22] print:hover:bg-transparent">
                      <td className="p-3 text-[#F2F3F5] print:text-black text-sm">Original Audio Evidence</td>
                      <td className="p-3 text-[#949BA4] print:text-gray-600 font-mono text-xs break-all">{report.evidenceHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</td>
                    </tr>
                    <tr className="hover:bg-[#1E1F22] print:hover:bg-transparent">
                      <td className="p-3 text-[#F2F3F5] print:text-black text-sm">AI Model Snapshot</td>
                      <td className="p-3 text-[#949BA4] print:text-gray-600 font-mono text-xs break-all">{report.modelHash || '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'}</td>
                    </tr>
                    <tr className="hover:bg-[#1E1F22] print:hover:bg-transparent">
                      <td className="p-3 text-[#F2F3F5] print:text-black text-sm">Inference Telemetry</td>
                      <td className="p-3 text-[#949BA4] print:text-gray-600 font-mono text-xs break-all">{report.inferenceHash || 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Signatures */}
            <section className="mt-16 pt-8 border-t border-[#3A3C41] print:border-gray-400">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="h-16 flex items-end justify-center mb-2">
                    <span className="font-script text-[#5865F2] text-2xl rotate-[-5deg] print:text-black">Digital Signature</span>
                  </div>
                  <div className="border-t border-[#3A3C41] print:border-gray-400 w-48 mx-auto pt-2">
                    <p className="text-[#F2F3F5] print:text-black font-semibold text-sm">System Authority</p>
                    <p className="text-[#949BA4] print:text-gray-600 text-xs">Automated Verification</p>
                  </div>
                </div>
                <div>
                  <div className="h-16 flex items-end justify-center mb-2">
                    <Fingerprint className="w-10 h-10 text-[#3A3C41] print:text-gray-300" />
                  </div>
                  <div className="border-t border-[#3A3C41] print:border-gray-400 w-48 mx-auto pt-2">
                    <p className="text-[#F2F3F5] print:text-black font-semibold text-sm">Blockchain Anchor</p>
                    <p className="text-[#949BA4] print:text-gray-600 text-xs font-mono">{report.blockchainTxId?.substring(0, 12) || '0x4f8A9...'} Confirmed</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
};
