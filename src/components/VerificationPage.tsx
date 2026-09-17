import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, FileKey, CheckSquare, XSquare, 
  AlertTriangle, RotateCcw, Activity, X, Database, BrainCircuit, Play
} from 'lucide-react';
import { EvidencePackage, VerificationChecklist } from '../types/integrity';
import { evidenceService } from '../services/evidenceService';

interface VerificationPageProps {
  caseId: string;
  onClose: () => void;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({ caseId, onClose }) => {
  const [evidence, setEvidence] = useState<EvidencePackage | null>(null);
  const [checklist, setChecklist] = useState<VerificationChecklist | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      // Allow fallback if evidenceService methods vary slightly
      const pkg = await (evidenceService as any).getEvidencePackage?.(caseId) as EvidencePackage | undefined;
      if (pkg) setEvidence(pkg);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const result = await evidenceService.verifyEvidencePackage(caseId);
      setChecklist(result);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamper = async (component: string) => {
    setIsTampering(true);
    try {
      await evidenceService.tamperEvidence(caseId, component);
      // Re-verify immediately to show the tampered state
      await handleVerify();
    } catch (err: any) {
      setError(err.message || "Failed to tamper");
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestore = async () => {
    setIsTampering(true);
    try {
      await evidenceService.restoreEvidence(caseId);
      await handleVerify();
    } catch (err: any) {
      setError(err.message || "Failed to restore");
    } finally {
      setIsTampering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#121316] z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-[#1E1F22] border-b border-[#3A3C41]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2B2D31] rounded-lg border border-[#3A3C41]">
            <ShieldCheck className="w-6 h-6 text-[#5865F2]" />
          </div>
          <div>
            <h1 className="text-[#F2F3F5] font-semibold text-lg leading-tight">Verification Console</h1>
            <p className="text-[#949BA4] text-sm">Case ID: {caseId}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-[#2B2D31] rounded-full transition-colors text-[#949BA4] hover:text-[#F2F3F5]"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Summary & Checklist */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Case Summary Card */}
          <div className="bg-[#1E1F22] rounded-xl border border-[#3A3C41] p-6 shadow-lg">
            <h2 className="text-[#F2F3F5] text-xl font-semibold mb-4 flex items-center gap-2">
              <FileKey className="w-5 h-5 text-[#5865F2]" />
              Cryptographic Manifest
            </h2>
            
            <div className="space-y-4">
              <div className="bg-[#121316] rounded-lg p-4 border border-[#3A3C41]">
                <p className="text-[#949BA4] text-xs uppercase tracking-wider mb-1">Overall Manifest Hash</p>
                <code className="text-[#F2F3F5] text-sm break-all font-mono">
                  {evidence?.manifestHash || "Awaiting verification..."}
                </code>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2B2D31] rounded-lg p-3">
                  <p className="text-[#949BA4] text-xs">Timestamp</p>
                  <p className="text-[#F2F3F5] text-sm">{evidence?.timestamp || new Date().toISOString()}</p>
                </div>
                <div className="bg-[#2B2D31] rounded-lg p-3">
                  <p className="text-[#949BA4] text-xs">Investigator</p>
                  <p className="text-[#F2F3F5] text-sm">{evidence?.investigatorId || "SYS_ADMIN"}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={isVerifying}
              className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                isVerifying 
                  ? 'bg-[#2B2D31] text-[#949BA4] cursor-not-allowed'
                  : 'bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_0_15px_rgba(88,101,242,0.3)]'
              }`}
            >
              {isVerifying ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isVerifying ? "Verifying Cryptographic Chains..." : "Verify Integrity"}
            </button>
            {error && <p className="mt-3 text-[#ED4245] text-sm text-center">{error}</p>}
          </div>

          {/* Verification Checklist */}
          {checklist && (
            <div className="bg-[#1E1F22] rounded-xl border border-[#3A3C41] p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-[#F2F3F5] text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#5865F2]" />
                Verification Results
              </h2>
              
              <div className="space-y-3">
                {Object.entries(checklist).map(([key, isValid]) => (
                  <div 
                    key={key} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                      isValid 
                        ? 'bg-[#121316] border-[#3A3C41]' 
                        : 'bg-[#ED4245]/10 border-[#ED4245]/50 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isValid ? (
                        <ShieldCheck className="w-5 h-5 text-[#23A55A]" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-[#ED4245]" />
                      )}
                      <span className="text-[#F2F3F5] capitalize font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div>
                      {isValid ? (
                        <span className="px-2 py-1 bg-[#23A55A]/20 text-[#23A55A] text-xs rounded font-medium">VERIFIED</span>
                      ) : (
                        <span className="px-2 py-1 bg-[#ED4245]/20 text-[#ED4245] text-xs rounded font-medium shadow-[0_0_10px_rgba(237,66,69,0.5)]">TAMPERED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Demo Controls */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-[#2B2D31] rounded-xl border border-[#ED4245]/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ED4245] to-[#5865F2]" />
            
            <h3 className="text-[#F2F3F5] text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ED4245]" />
              Tamper & Verify Demo
            </h3>
            <p className="text-[#949BA4] text-sm mb-6">
              Use these controls to deliberately corrupt specific components of the evidence package and observe the verification failure.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleTamper('evidence')}
                disabled={isTampering}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1E1F22] border border-[#3A3C41] hover:border-[#ED4245]/50 hover:bg-[#121316] transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-[#949BA4] group-hover:text-[#ED4245]" />
                  <span className="text-[#F2F3F5] text-sm">Tamper Evidence File</span>
                </div>
              </button>

              <button 
                onClick={() => handleTamper('model')}
                disabled={isTampering}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1E1F22] border border-[#3A3C41] hover:border-[#ED4245]/50 hover:bg-[#121316] transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-4 h-4 text-[#949BA4] group-hover:text-[#ED4245]" />
                  <span className="text-[#F2F3F5] text-sm">Tamper AI Model</span>
                </div>
              </button>

              <button 
                onClick={() => handleTamper('report')}
                disabled={isTampering}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1E1F22] border border-[#3A3C41] hover:border-[#ED4245]/50 hover:bg-[#121316] transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <FileKey className="w-4 h-4 text-[#949BA4] group-hover:text-[#ED4245]" />
                  <span className="text-[#F2F3F5] text-sm">Tamper Forensic Report</span>
                </div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#3A3C41]">
              <button 
                onClick={handleRestore}
                disabled={isTampering}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#121316] border border-[#3A3C41] text-[#F2F3F5] hover:bg-[#2B2D31] hover:text-[#23A55A] hover:border-[#23A55A]/50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Restore All Integrity</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
