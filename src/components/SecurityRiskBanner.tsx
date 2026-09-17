import React from 'react';
import {
  SpeakerSegmentResult,
  ComprehensiveRiskAssessment,
  ActiveVerificationState,
} from '../types/speakerFingerprint';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface SecurityRiskBannerProps {
  expectedContactName: string;
  speakerSegment: SpeakerSegmentResult | null;
  riskAssessment: ComprehensiveRiskAssessment;
  activeVerification: ActiveVerificationState | null;
  onOpenVerificationQuestion?: () => void;
}

export const SecurityRiskBanner: React.FC<SecurityRiskBannerProps> = ({
  expectedContactName,
  speakerSegment,
  riskAssessment,
  activeVerification,
  onOpenVerificationQuestion,
}) => {
  const isHighRisk =
    riskAssessment.overallRiskLevel === 'HIGH' || riskAssessment.overallRiskLevel === 'CRITICAL';
  const isSuspicious = riskAssessment.overallRiskLevel === 'SUSPICIOUS' || riskAssessment.overallRiskLevel === 'MEDIUM';

  const hasVoiceMatch =
    speakerSegment?.hasSimilarity === true || speakerSegment?.status === 'match';
  const isMismatch = speakerSegment?.status === 'possibleMismatch';
  const isNoMatch = speakerSegment?.status === 'unknown';

  return (
    <div className="w-full flex flex-col gap-2 select-none text-left">
      {/* 1. Biometric Voice Fingerprint HUD Card */}
      <div
        className={`w-full p-3 rounded-2xl border backdrop-blur-md transition-all duration-300 flex items-center justify-between ${
          hasVoiceMatch
            ? 'bg-[#141F18]/90 border-[#23A55A]/40'
            : isMismatch
            ? 'bg-[#241F15]/90 border-[#FAA61A]/40'
            : isNoMatch
            ? 'bg-[#261517]/90 border-[#ED4245]/40'
            : 'bg-[#181A1D]/90 border-[#2B2D31]'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              hasVoiceMatch
                ? 'bg-[#23A55A]/15 border-[#23A55A]/30 text-[#23A55A]'
                : isMismatch
                ? 'bg-[#FAA61A]/15 border-[#FAA61A]/30 text-[#FAA61A]'
                : isNoMatch
                ? 'bg-[#ED4245]/15 border-[#ED4245]/30 text-[#ED4245]'
                : 'bg-[#5865F2]/15 border-[#5865F2]/30 text-[#5865F2]'
            }`}
          >
            {hasVoiceMatch ? (
              <UserCheck className="w-4 h-4" />
            ) : isMismatch || isNoMatch ? (
              <UserX className="w-4 h-4" />
            ) : (
              <Fingerprint className="w-4 h-4 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider text-[#949BA4] uppercase">
                Voice Fingerprint
              </span>
              {speakerSegment?.speakerChanged && (
                <span className="px-1.5 py-0.5 bg-[#ED4245]/20 border border-[#ED4245]/50 text-[#ED4245] font-mono text-[9px] rounded-md uppercase">
                  Speaker Switched
                </span>
              )}
            </div>

            <span className="text-xs font-medium text-[#F2F3F5] truncate mt-0.5">
              {speakerSegment ? (
                speakerSegment.statusLabel
              ) : (
                `Analyzing ${expectedContactName} voice acoustic vectors...`
              )}
            </span>
          </div>
        </div>

        {/* Refined Metric Badge */}
        <div className="shrink-0 ml-2">
          {hasVoiceMatch ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-[#23A55A]/15 text-[#23A55A] border border-[#23A55A]/30">
              {speakerSegment?.embeddingSimilarity 
                ? `${Math.round(speakerSegment.embeddingSimilarity * 100)}% Match`
                : 'Verified'}
            </span>
          ) : isMismatch ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-[#FAA61A]/15 text-[#FAA61A] border border-[#FAA61A]/30">
              Divergence
            </span>
          ) : isNoMatch ? (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase bg-[#ED4245]/15 text-[#ED4245] border border-[#ED4245]/30">
              Unrecognized
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#949BA4] bg-[#2B2D31] border border-[#3A3C41]">
              Sampling
            </span>
          )}
        </div>
      </div>

      {/* 2. Sleek Multi-Signal Threat HUD Card */}
      {(isHighRisk || isSuspicious || activeVerification?.isTriggered) && (
        <div
          className={`w-full p-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col gap-2.5 ${
            isHighRisk
              ? 'bg-[#261517]/95 border-[#ED4245]/50'
              : 'bg-[#241F15]/95 border-[#FAA61A]/50'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert
                className={`w-4 h-4 ${isHighRisk ? 'text-[#ED4245]' : 'text-[#FAA61A]'}`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-wider font-mono ${
                  isHighRisk ? 'text-[#ED4245]' : 'text-[#FAA61A]'
                }`}
              >
                {riskAssessment.overallRiskLevel} Risk Detected
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#121316] text-[#DBDEE1] border border-[#2B2D31]">
              Threat Index {riskAssessment.riskScore}/100
            </span>
          </div>

          {/* Explainable Risk Factors List */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            {riskAssessment.reasons.slice(0, 2).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-tight">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                    r.type === 'danger'
                      ? 'bg-[#ED4245]'
                      : r.type === 'warning'
                      ? 'bg-[#FAA61A]'
                      : 'bg-[#23A55A]'
                  }`}
                />
                <span className="text-[#DBDEE1] font-normal">{r.message}</span>
              </div>
            ))}
          </div>

          {/* Action Trigger Button */}
          {onOpenVerificationQuestion && !activeVerification?.isTriggered && (
            <button
              onClick={onOpenVerificationQuestion}
              className="mt-1 w-full py-2 bg-[#ED4245] hover:bg-[#D83A3D] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verify Caller Identity (Security Prompt)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
