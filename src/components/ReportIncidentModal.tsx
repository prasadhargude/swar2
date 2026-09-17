import React, { useState } from 'react';
import {
  Flag,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  X,
  AlertTriangle,
  Building,
  FileText,
  MapPin,
  Phone,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface ReportIncidentModalProps {
  callerName: string;
  callerPhone?: string;
  riskScore: number;
  riskLevel: string;
  detectedKeywords: string[];
  transcriptSnippet: string;
  onDismiss: () => void;
}

type ScamCategory =
  | 'banking_fraud'
  | 'digital_arrest'
  | 'impersonation'
  | 'investment_scam'
  | 'otp_fraud'
  | 'other';

const SCAM_CATEGORIES: { id: ScamCategory; label: string; icon: string }[] = [
  { id: 'banking_fraud', label: 'Banking / UPI Fraud', icon: '🏦' },
  { id: 'digital_arrest', label: 'Digital Arrest / Cyber Crime', icon: '⚖️' },
  { id: 'impersonation', label: 'Impersonation / Identity Fraud', icon: '🎭' },
  { id: 'investment_scam', label: 'Investment / Ponzi Scam', icon: '📈' },
  { id: 'otp_fraud', label: 'OTP / Credential Theft', icon: '🔑' },
  { id: 'other', label: 'Other Suspicious Activity', icon: '⚠️' },
];

const AUTHORITIES = [
  { name: 'Cyber Crime Portal (MHA)', url: 'cybercrime.gov.in', icon: '🏛️' },
  { name: 'TRAI DND / NCID Registry', url: 'trai.gov.in', icon: '📡' },
  { name: 'RBI Sachet Portal', url: 'sachet.rbi.org.in', icon: '🏦' },
  { name: 'Swaraksha Evidence Vault', url: 'swaraksha.local/evidence', icon: '🔒' },
];

type ReportStep = 'form' | 'submitting' | 'success';

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  callerName,
  callerPhone,
  riskScore,
  riskLevel,
  detectedKeywords,
  transcriptSnippet,
  onDismiss,
}) => {
  const [step, setStep] = useState<ReportStep>('form');
  const [category, setCategory] = useState<ScamCategory | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [reportToAll, setReportToAll] = useState(true);
  const [caseRef] = useState(() => `SWK-RPT-${Date.now().toString(36).toUpperCase()}`);

  const handleSubmit = () => {
    if (!category) return;
    soundEffects.vibrate(30);
    setStep('submitting');
    setTimeout(() => {
      setStep('success');
      soundEffects.vibrate(50);
    }, 2500);
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1A1B1E] border border-[#3A3C41] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#2B2D31] shrink-0"
          style={{ background: 'linear-gradient(135deg, #ED424518 0%, #1A1B1E 100%)' }}>
          <button onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#2B2D31] text-[#949BA4] hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#ED4245]/20 border border-[#ED4245]/50">
              <Flag className="w-7 h-7 text-[#ED4245]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#ED4245]">
                Incident Report
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">Report Suspicious Call</h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Filed to cyber crime authorities
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {step === 'form' && (
            <>
              {/* Auto-filled call info */}
              <div className="p-3 bg-[#2B2D31]/50 rounded-xl flex flex-col gap-2 text-xs">
                <p className="text-[10px] font-bold uppercase text-[#949BA4] tracking-wider">Auto-captured Call Data</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#949BA4]">Caller</span>
                    <span className="font-bold text-white">{callerName}</span>
                  </div>
                  {callerPhone && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#949BA4]">Number</span>
                      <span className="font-mono text-white">{callerPhone}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#949BA4]">Risk Score</span>
                    <span className="font-bold text-[#ED4245]">{Math.round(riskScore)}/100</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#949BA4]">Risk Level</span>
                    <span className="font-bold text-[#ED4245]">{riskLevel}</span>
                  </div>
                </div>
                {detectedKeywords.length > 0 && (
                  <div>
                    <span className="text-[#949BA4] block mb-1">Detected Keywords</span>
                    <div className="flex flex-wrap gap-1">
                      {detectedKeywords.slice(0, 6).map(kw => (
                        <span key={kw} className="px-2 py-0.5 bg-[#ED4245]/20 border border-[#ED4245]/40 text-[#ED4245] text-[10px] font-semibold rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {transcriptSnippet && (
                  <div>
                    <span className="text-[#949BA4] block mb-1">Transcript Snippet</span>
                    <p className="text-[10px] text-[#DBDEE1] bg-[#121316] p-2 rounded-lg leading-relaxed italic">
                      "{transcriptSnippet.slice(0, 120)}{transcriptSnippet.length > 120 ? '...' : ''}"
                    </p>
                  </div>
                )}
              </div>

              {/* Scam Category */}
              <div>
                <p className="text-xs font-bold text-[#949BA4] uppercase tracking-wider mb-2">
                  Select Incident Category *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SCAM_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        category === cat.id
                          ? 'border-[#ED4245] bg-[#ED4245]/15'
                          : 'border-[#2B2D31] bg-[#2B2D31]/40 hover:border-[#ED4245]/50'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[11px] font-semibold text-white leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <p className="text-xs font-bold text-[#949BA4] uppercase tracking-wider mb-2">
                  Additional Notes
                </p>
                <textarea
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="Describe what the caller asked you to do..."
                  rows={3}
                  className="w-full bg-[#121316] border border-[#2B2D31] rounded-xl px-3 py-2 text-xs text-white placeholder-[#72767D] focus:outline-none focus:border-[#5865F2] resize-none"
                />
              </div>

              {/* Authorities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-[#949BA4] uppercase tracking-wider">
                    Report to Authorities
                  </p>
                  <button
                    onClick={() => setReportToAll(!reportToAll)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      reportToAll
                        ? 'bg-[#23A55A]/20 border-[#23A55A]/50 text-[#23A55A]'
                        : 'bg-[#2B2D31] border-[#3A3C41] text-[#949BA4]'
                    }`}
                  >
                    {reportToAll ? 'All Selected' : 'None Selected'}
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {AUTHORITIES.map(auth => (
                    <div key={auth.name} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                      reportToAll ? 'border-[#23A55A]/30 bg-[#23A55A]/10' : 'border-[#2B2D31] bg-[#2B2D31]/30'
                    }`}>
                      <span className="text-base shrink-0">{auth.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{auth.name}</p>
                        <p className="text-[10px] text-[#949BA4]">{auth.url}</p>
                      </div>
                      {reportToAll && <CheckCircle2 className="w-4 h-4 text-[#23A55A] shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!category}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed sticky bottom-0"
                style={{ background: 'linear-gradient(135deg, #ED4245, #C03537)', boxShadow: '0 4px 15px rgba(237,66,69,0.3)' }}
              >
                <Flag className="w-4 h-4" />
                Submit Incident Report
              </button>
            </>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-14 h-14 text-[#ED4245] animate-spin" />
              <p className="text-base font-bold text-white">Submitting Report…</p>
              <div className="flex flex-col gap-2 w-full">
                {['Packaging evidence', 'Computing SHA-256 hash', 'Anchoring to blockchain', 'Notifying authorities'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-[#949BA4]"
                    style={{ opacity: 0.3 + (i * 0.17), transition: 'opacity 0.5s' }}>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {s}…
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-4 rounded-full bg-[#23A55A]/20 border border-[#23A55A]/40">
                <CheckCircle2 className="w-12 h-12 text-[#23A55A]" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[#23A55A]">Report Filed Successfully</p>
                <p className="text-xs text-[#949BA4] mt-1">Your incident has been submitted to cyber authorities</p>
              </div>

              <div className="w-full flex flex-col gap-2 text-xs">
                <div className="flex justify-between p-2.5 bg-[#121316] rounded-xl border border-[#2B2D31]">
                  <span className="text-[#949BA4]">Case Reference</span>
                  <span className="font-mono font-bold text-[#5865F2]">{caseRef}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#121316] rounded-xl border border-[#2B2D31]">
                  <span className="text-[#949BA4]">Category</span>
                  <span className="font-semibold text-white">
                    {SCAM_CATEGORIES.find(c => c.id === category)?.label}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#121316] rounded-xl border border-[#2B2D31]">
                  <span className="text-[#949BA4]">Reported to</span>
                  <span className="text-[#23A55A] font-semibold">{AUTHORITIES.length} portals</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#121316] rounded-xl border border-[#2B2D31]">
                  <span className="text-[#949BA4]">Blockchain Anchor</span>
                  <span className="text-[#23A55A] font-semibold">✓ Anchored</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <div className="p-3 bg-[#FEE75C]/10 border border-[#FEE75C]/30 rounded-xl text-xs text-[#FEE75C]">
                  <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                  Save your case reference <strong>{caseRef}</strong> for follow-up.
                </div>
                <button onClick={onDismiss}
                  className="w-full py-2.5 bg-[#2B2D31] rounded-xl text-white font-semibold text-sm">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
