import React, { useMemo } from 'react';
import { RiskTimelineEntry, GraduatedResponse } from '../types/integrity';
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  AlertOctagon, 
  ShieldCheck,
  Zap,
  Lock,
  UserCheck,
  PhoneCall,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';

export interface RiskTimelineBannerProps {
  currentScore: number; // 0 to 100
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeline: RiskTimelineEntry[];
  graduatedResponse: GraduatedResponse;
}

export const RiskTimelineBanner: React.FC<RiskTimelineBannerProps> = ({
  currentScore,
  riskLevel,
  timeline,
  graduatedResponse
}) => {
  const riskColor = useMemo(() => {
    switch (riskLevel) {
      case 'SAFE': return '#23A55A';
      case 'LOW': return '#FAA61A';
      case 'MEDIUM': return '#F47B67';
      case 'HIGH': return '#ED4245';
      case 'CRITICAL': return '#992D22';
      default: return '#5865F2';
    }
  }, [riskLevel]);

  const RiskIcon = useMemo(() => {
    switch (riskLevel) {
      case 'SAFE': return ShieldCheck;
      case 'LOW': return Activity;
      case 'MEDIUM': return AlertTriangle;
      case 'HIGH': return ShieldAlert;
      case 'CRITICAL': return AlertOctagon;
      default: return Shield;
    }
  }, [riskLevel]);

  const ResponseIcon = useMemo(() => {
    switch (graduatedResponse?.action) {
      case 'CONTINUE': return PhoneCall;
      case 'VERIFY_IDENTITY': return UserCheck;
      case 'REQUIRE_MFA': return Lock;
      case 'TERMINATE':
      case 'ESCALATE': return Zap;
      default: return ShieldCheck;
    }
  }, [graduatedResponse]);

  // Normalize timeline for sparkline
  const sparklineData = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];
    const maxScore = 100;
    return timeline.map(entry => ({
      ...entry,
      normalizedHeight: Math.max(10, (entry.score / maxScore) * 100)
    }));
  }, [timeline]);

  return (
    <div className="bg-[#181A1D]/90 border border-[#2B2D31] rounded-2xl overflow-hidden shadow-lg p-3.5 flex flex-col gap-3 relative backdrop-blur-md text-left select-none">
      {/* Background Glow Effect */}
      <motion.div 
        className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full pointer-events-none"
        animate={{ backgroundColor: riskColor }}
        transition={{ duration: 1 }}
      />
      
      {/* Top Section: Score, Level, and Response */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <motion.div 
            className="w-9 h-9 rounded-xl bg-[#2B2D31] border border-[#3A3C41] flex items-center justify-center shrink-0"
            animate={{ borderColor: `${riskColor}50` }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ color: riskColor }}
              transition={{ duration: 0.5 }}
            >
              <RiskIcon className="w-4 h-4" />
            </motion.div>
          </motion.div>
          
          <div className="flex flex-col">
            <span className="text-[#949BA4] text-[10px] font-mono tracking-wider uppercase leading-tight">
              Live Threat Level
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <motion.span 
                className="text-lg font-bold font-mono text-[#F2F3F5] leading-none"
                key={currentScore}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {Math.round(currentScore)}<span className="text-xs text-[#949BA4] font-normal">/100</span>
              </motion.span>
              <motion.span 
                className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border"
                animate={{ 
                  color: riskColor,
                  borderColor: `${riskColor}40`,
                  backgroundColor: `${riskColor}15`
                }}
              >
                {riskLevel}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Graduated Response Indicator */}
        {graduatedResponse && (
          <div className="flex flex-col items-end text-right">
            <span className="text-[#949BA4] text-[10px] font-mono tracking-wider uppercase mb-0.5">
              Protocol
            </span>
            <div className="flex items-center gap-1.5 bg-[#2B2D31]/80 px-2.5 py-1 rounded-lg border border-[#3A3C41]">
              <ResponseIcon className="w-3.5 h-3.5 text-[#5865F2]" />
              <span className="text-xs font-medium text-[#F2F3F5]">
                {graduatedResponse.action || "Monitoring"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Section: Sleek Thin Progress Bar */}
      <div className="flex flex-col gap-1 z-10">
        <div className="h-1.5 w-full bg-[#121316] rounded-full overflow-hidden border border-[#3A3C41]/40">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(100, Math.max(0, currentScore))}%`,
              backgroundColor: riskColor
            }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>
      </div>

      {/* Bottom Section: Compact Sparkline */}
      {sparklineData.length > 0 && (
        <div className="pt-2 border-t border-[#2B2D31]/50 z-10">
          <div className="flex justify-between items-end h-7 gap-1 px-0.5">
            {sparklineData.slice(-24).map((entry, index) => {
              let barColor = '#23A55A';
              if (entry.score >= 80) barColor = '#ED4245';
              else if (entry.score >= 60) barColor = '#F47B67';
              else if (entry.score >= 30) barColor = '#FAA61A';
              
              return (
                <div key={entry.timestamp + index} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                  <motion.div
                    className="w-full max-w-[4px] rounded-t-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${entry.normalizedHeight}%`, backgroundColor: barColor }}
                    transition={{ duration: 0.3, delay: index * 0.01 }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121316] border border-[#3A3C41] text-[10px] font-mono p-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
                    <span className="text-[#949BA4] mr-1">Score:</span>
                    <span style={{ color: barColor }} className="font-bold">{Math.round(entry.score)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
