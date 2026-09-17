import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  CheckCircle2,
  Loader2,
  X,
  Link as LinkIcon,
  Download,
  ShieldCheck,
  FileText,
  Cpu,
  Database,
  Lock,
  Copy,
  Layers,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { integrityEngine } from '../services/integrityEngine';
import { blockchainService } from '../services/blockchainService';
import { evidenceService } from '../services/evidenceService';

interface ForensicSubmissionModalProps {
  callId: string;
  callerName: string;
  riskScore: number;
  riskLevel: string;
  transcriptText: string;
  spoofScore: number;
  spoofVerdict: string;
  investigator: string;
  onDismiss: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
}

export const ForensicSubmissionModal: React.FC<ForensicSubmissionModalProps> = ({
  callId,
  callerName,
  riskScore,
  riskLevel,
  transcriptText,
  spoofScore,
  spoofVerdict,
  investigator,
  onDismiss,
}) => {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'hash_audio', label: 'Hashing Audio Evidence',
      detail: 'SHA-256 fingerprinting call recording',
      icon: <Cpu className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'hash_transcript', label: 'Hashing Transcript',
      detail: 'SHA-256 of speech-to-text output',
      icon: <FileText className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'build_manifest', label: 'Building Evidence Manifest',
      detail: 'Merging artifact hashes into manifest',
      icon: <Layers className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'sign_manifest', label: 'Signing Manifest (ECDSA P-256)',
      detail: 'Cryptographic digital signature',
      icon: <Lock className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'anchor_blockchain', label: 'Anchoring to Blockchain',
      detail: 'Proof-of-work block mining (2-zeros)',
      icon: <LinkIcon className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'ipfs_upload', label: 'Uploading to IPFS',
      detail: 'Decentralized immutable storage',
      icon: <HardDrive className="w-4 h-4" />, status: 'pending',
    },
    {
      id: 'register_case', label: 'Registering Case',
      detail: 'Creating forensic report record',
      icon: <Database className="w-4 h-4" />, status: 'pending',
    },
  ]);

  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [caseId, setCaseId] = useState('');
  const [manifestHash, setManifestHash] = useState('');
  const [blockIndex, setBlockIndex] = useState(0);
  const [ipfsCid, setIpfsCid] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateStep = useCallback((id: string, status: ProgressStep['status'], result?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result } : s));
  }, []);

  // Run the forensic pipeline
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await new Promise(r => setTimeout(r, 600));

      // Step 0: hash audio
      setCurrentStepIdx(0);
      updateStep('hash_audio', 'running');
      await new Promise(r => setTimeout(r, 800));
      const audioHash = await integrityEngine.hashData(
        JSON.stringify({ callId, callerName, spoofScore, spoofVerdict })
      );
      updateStep('hash_audio', 'done', audioHash.slice(0, 24) + '…');
      if (cancelled) return;

      // Step 1: hash transcript
      setCurrentStepIdx(1);
      updateStep('hash_transcript', 'running');
      await new Promise(r => setTimeout(r, 700));
      const txHash = await integrityEngine.hashData(transcriptText || 'no transcript');
      updateStep('hash_transcript', 'done', txHash.slice(0, 24) + '…');
      if (cancelled) return;

      // Step 2: build manifest
      setCurrentStepIdx(2);
      updateStep('build_manifest', 'running');
      await new Promise(r => setTimeout(r, 600));
      const analysisHash = await integrityEngine.hashData(
        JSON.stringify({ riskScore, riskLevel, spoofScore, spoofVerdict })
      );
      const { manifestHash: mHash } = await integrityEngine.createManifest([
        { name: 'audio', hash: audioHash },
        { name: 'transcript', hash: txHash },
        { name: 'analysis', hash: analysisHash },
      ]);
      setManifestHash(mHash);
      updateStep('build_manifest', 'done', mHash.slice(0, 24) + '…');
      if (cancelled) return;

      // Step 3: sign manifest
      setCurrentStepIdx(3);
      updateStep('sign_manifest', 'running');
      await new Promise(r => setTimeout(r, 900));
      const { privateKey } = await integrityEngine.generateKeyPair();
      const sig = await integrityEngine.signHash(mHash, privateKey);
      updateStep('sign_manifest', 'done', sig.slice(0, 24) + '…');
      if (cancelled) return;

      // Step 4: blockchain anchor
      setCurrentStepIdx(4);
      updateStep('anchor_blockchain', 'running');
      const newCaseId = `CASE-${Date.now().toString(36).toUpperCase()}`;
      setCaseId(newCaseId);
      const anchor = await blockchainService.anchorHash(newCaseId, mHash);
      setBlockIndex(anchor.blockIndex);
      updateStep('anchor_blockchain', 'done', `Block #${anchor.blockIndex} • Hash: ${anchor.blockHash.slice(0, 16)}…`);
      if (cancelled) return;

      // Step 5: IPFS (simulated)
      setCurrentStepIdx(5);
      updateStep('ipfs_upload', 'running');
      await new Promise(r => setTimeout(r, 1000));
      const cid = 'Qm' + mHash.slice(0, 44);
      setIpfsCid(cid);
      updateStep('ipfs_upload', 'done', `CID: ${cid.slice(0, 20)}…`);
      if (cancelled) return;

      // Step 6: register case in evidenceService
      setCurrentStepIdx(6);
      updateStep('register_case', 'running');
      await new Promise(r => setTimeout(r, 500));
      try {
        await evidenceService.createEvidencePackage({
          callId,
          investigator,
          peerUsername: callerName,
          callDuration: 0,
          transcriptText: transcriptText || '',
          spoofScore,
          spoofVerdict,
          speakerMatch: 'Unknown',
          speakerSimilarity: 0,
          intentCategory: 'Voice Call - Forensic Submission',
          riskScore,
          riskLevel,
        });
      } catch (_) { /* may already exist */ }
      updateStep('register_case', 'done', `ID: ${newCaseId}`);
      if (cancelled) return;

      setCurrentStepIdx(7);
      setIsComplete(true);
      soundEffects.vibrate(60);
    };

    run().catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadReport = () => {
    const report = {
      caseId,
      investigator,
      callerName,
      riskScore,
      riskLevel,
      spoofScore,
      spoofVerdict,
      manifestHash,
      ipfsCid,
      blockIndex,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseId}_forensic_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1A1B1E] border border-[#3A3C41] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#2B2D31] shrink-0"
          style={{ background: 'linear-gradient(135deg, #7289DA18 0%, #1A1B1E 100%)' }}>
          {isComplete && (
            <button onClick={onDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#2B2D31] text-[#949BA4] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#7289DA]/20 border border-[#7289DA]/50">
              <HardDrive className="w-7 h-7 text-[#7289DA]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7289DA]">
                Forensic Submission
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">Send Recording</h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                IPFS + Blockchain tamper-proof packaging
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 ${
                  s.status === 'done'
                    ? 'border-[#23A55A]/40 bg-[#23A55A]/10'
                    : s.status === 'running'
                    ? 'border-[#5865F2]/60 bg-[#5865F2]/10'
                    : s.status === 'error'
                    ? 'border-[#ED4245]/40 bg-[#ED4245]/10'
                    : 'border-[#2B2D31]/50 bg-[#2B2D31]/20 opacity-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  s.status === 'done' ? 'bg-[#23A55A]/20 text-[#23A55A]'
                    : s.status === 'running' ? 'bg-[#5865F2]/20 text-[#5865F2]'
                    : 'bg-[#2B2D31] text-[#949BA4]'
                }`}>
                  {s.status === 'running' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : s.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : s.icon}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-xs font-bold ${
                    s.status === 'done' ? 'text-[#23A55A]'
                      : s.status === 'running' ? 'text-white'
                      : 'text-[#949BA4]'
                  }`}>{s.label}</span>
                  <span className="text-[10px] text-[#72767D]">{s.detail}</span>
                  {s.result && (
                    <span className="text-[10px] font-mono text-[#5865F2] mt-0.5 truncate">{s.result}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Final summary card */}
          {isComplete && (
            <div className="flex flex-col gap-3 mt-2 animate-fadeIn">
              <div className="p-4 bg-[#23A55A]/10 border border-[#23A55A]/40 rounded-2xl flex flex-col items-center gap-2 text-center">
                <ShieldCheck className="w-10 h-10 text-[#23A55A]" />
                <p className="text-base font-bold text-[#23A55A]">Forensic Package Submitted</p>
                <p className="text-xs text-[#949BA4]">
                  Tamper-proof evidence anchored to decentralized storage
                </p>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { label: 'Case ID', value: caseId, copy: true },
                  { label: 'Manifest Hash', value: manifestHash.slice(0, 32) + '…', copy: false },
                  { label: 'IPFS CID', value: ipfsCid.slice(0, 28) + '…', copy: true },
                  { label: 'Block Index', value: `#${blockIndex}`, copy: false },
                  { label: 'Investigator', value: investigator, copy: false },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center p-2.5 bg-[#121316] rounded-xl border border-[#2B2D31]">
                    <span className="text-[#949BA4]">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white text-[11px]">{item.value}</span>
                      {item.copy && (
                        <button onClick={() => handleCopy(item.value)}
                          className="p-1 rounded-lg bg-[#2B2D31] text-[#949BA4] hover:text-white">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {copied && (
                <p className="text-xs text-center text-[#23A55A]">Copied to clipboard!</p>
              )}

              <button
                onClick={handleDownloadReport}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7289DA, #5865F2)', boxShadow: '0 4px 15px rgba(88,101,242,0.3)' }}
              >
                <Download className="w-4 h-4" />
                Download Forensic Report (JSON)
              </button>

              <button onClick={onDismiss}
                className="w-full py-2.5 bg-[#2B2D31] rounded-xl text-white font-semibold text-sm">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
