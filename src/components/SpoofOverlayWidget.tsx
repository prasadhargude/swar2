import React, { useEffect, useRef } from 'react';
import { DetectionState } from '../types';
import { ShieldAlert, ShieldCheck, ChevronRight, Activity, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../services/soundEffects';

interface SpoofOverlayWidgetProps {
  detectionState: DetectionState;
  onOpenDetails?: () => void;
}

export const SpoofOverlayWidget: React.FC<SpoofOverlayWidgetProps> = ({
  detectionState,
  onOpenDetails,
}) => {
  const prevVerdictRef = useRef(detectionState.verdict);

  // Play warning alert tone if verdict flips to fake
  useEffect(() => {
    if (detectionState.verdict === 'fake' && prevVerdictRef.current !== 'fake') {
      soundEffects.playSpoofAlert();
    }
    prevVerdictRef.current = detectionState.verdict;
  }, [detectionState.verdict]);

  return (
    <div className="w-full select-none text-left">
      <AnimatePresence mode="wait">
        {detectionState.verdict === 'fake' && (
          <motion.div
            key="fake-warning"
            id="spoof-overlay-warning"
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            onClick={onOpenDetails}
            className="w-full bg-[#1F1415]/95 hover:bg-[#28181A] cursor-pointer rounded-2xl p-3.5 text-[#F2F3F5] shadow-2xl border border-[#ED4245]/60 backdrop-blur-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#ED4245]/15 border border-[#ED4245]/30 text-[#ED4245] rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs tracking-wider uppercase text-[#ED4245] font-mono flex items-center gap-1.5">
                    AI Voice Synthesis Anomaly
                  </span>
                  <span className="text-[10px] font-mono bg-[#121316] border border-[#ED4245]/40 px-2 py-0.5 rounded-md text-[#ED4245] font-semibold shrink-0">
                    MSE {detectionState.lastMse.toFixed(1)} &gt; {detectionState.threshold.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-[#DBDEE1] mt-1 font-normal leading-relaxed">
                  BARA CAE reconstruction anomaly detected. Spectral features match synthetic / cloned voice model.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#ED4245]/20">
                  <span className="font-medium text-[#FAA61A] font-mono text-[10px]">
                    Caution: Do not share credentials or OTPs
                  </span>
                  <span className="flex items-center text-[#5865F2] hover:underline font-medium text-xs">
                    Inspect Evidence <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {detectionState.verdict === 'real' && (
          <motion.div
            key="real-verified"
            id="voice-verified-banner"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={onOpenDetails}
            className="w-full bg-[#141F18]/90 hover:bg-[#1A2920] cursor-pointer border border-[#23A55A]/40 rounded-2xl px-3.5 py-2.5 text-[#F2F3F5] transition-all backdrop-blur-md flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#23A55A]/15 border border-[#23A55A]/30 text-[#23A55A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#F2F3F5] truncate leading-tight">
                  Voice Authentic • Natural Speech
                </span>
                <span className="text-[10px] font-mono text-[#949BA4] leading-tight mt-0.5">
                  BARA CAE MSE: {detectionState.lastMse.toFixed(1)} (Threshold: {detectionState.threshold.toFixed(1)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#23A55A] shrink-0 ml-2">
              <span>Verified</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        )}

        {detectionState.verdict === 'unknown' && (
          <motion.div
            key="unknown-status"
            id="voice-analyzing-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onOpenDetails}
            className="w-full bg-[#181A1D]/90 hover:bg-[#202226] cursor-pointer border border-[#2B2D31] rounded-2xl px-3.5 py-2.5 text-[#949BA4] transition-all backdrop-blur-md flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#5865F2] flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 animate-spin" />
              </div>
              <span className="text-xs font-medium text-[#DBDEE1]">
                BARA Guard Monitoring ({detectionState.reliableVotesCount || 0}/10 chunks)
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#5865F2] font-semibold flex items-center shrink-0 ml-2">
              Details <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
