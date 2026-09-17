import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Loader2,
  X,
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface MfaVerificationModalProps {
  callerName: string;
  riskScore: number;
  riskLevel: string;
  onVerified: () => void;
  onFailed: () => void;
  onDismiss: () => void;
}

type MfaStep = 'sending' | 'waiting' | 'verifying' | 'success' | 'failed';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const MfaVerificationModal: React.FC<MfaVerificationModalProps> = ({
  callerName,
  riskScore,
  riskLevel,
  onVerified,
  onFailed,
  onDismiss,
}) => {
  const [step, setStep] = useState<MfaStep>('sending');
  const [otp] = useState(generateOtp());
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [shakeError, setShakeError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Simulate "sending OTP to registered device"
  useEffect(() => {
    const t = setTimeout(() => {
      setStep('waiting');
      soundEffects.vibrate(30);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (step !== 'waiting') return;
    if (countdown <= 0) {
      setStep('failed');
      onFailed();
      return;
    }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown, onFailed]);

  const handleDigitInput = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpInput];
    next[index] = value;
    setOtpInput(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otpInput]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otpInput]);

  const handleVerify = useCallback(() => {
    const entered = otpInput.join('');
    if (entered.length !== 6) return;
    setStep('verifying');
    soundEffects.vibrate(20);
    setTimeout(() => {
      if (entered === otp) {
        setStep('success');
        soundEffects.vibrate(50);
        setTimeout(onVerified, 1500);
      } else {
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
        const newAttempts = attemptsLeft - 1;
        setAttemptsLeft(newAttempts);
        if (newAttempts <= 0) {
          setStep('failed');
          onFailed();
        } else {
          setOtpInput(['', '', '', '', '', '']);
          setStep('waiting');
          inputRefs.current[0]?.focus();
        }
      }
    }, 1200);
  }, [otpInput, otp, attemptsLeft, onVerified, onFailed]);

  const riskColor = riskScore > 80 ? '#ED4245' : riskScore > 60 ? '#F47B67' : '#FEE75C';

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1A1B1E] border border-[#3A3C41] rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#2B2D31]"
          style={{ background: `linear-gradient(135deg, ${riskColor}18 0%, #1A1B1E 100%)` }}>
          <button onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#2B2D31] text-[#949BA4] hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${riskColor}20`, border: `1px solid ${riskColor}50` }}>
              <KeyRound className="w-7 h-7" style={{ color: riskColor }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: riskColor }}>
                Multi-Factor Authentication
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">Identity Verification</h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Risk Score: <span className="font-bold" style={{ color: riskColor }}>{Math.round(riskScore)}</span>
                &nbsp;•&nbsp;<span style={{ color: riskColor }}>{riskLevel}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Caller info */}
          <div className="flex items-center gap-2.5 p-3 bg-[#2B2D31]/50 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-[#FEE75C] shrink-0" />
            <p className="text-xs text-[#DBDEE1]">
              Suspicious activity detected on call with <span className="font-bold text-white">{callerName}</span>.
              Please complete MFA to continue securely.
            </p>
          </div>

          {/* Step: Sending */}
          {step === 'sending' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <div className="p-4 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40">
                  <Smartphone className="w-10 h-10 text-[#5865F2]" />
                </div>
                <div className="absolute -top-1 -right-1 p-1 bg-[#1A1B1E] rounded-full">
                  <Loader2 className="w-5 h-5 text-[#5865F2] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Sending OTP to your device</p>
                <p className="text-xs text-[#949BA4] mt-1">+91 ••••••7823 (registered number)</p>
              </div>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#5865F2] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Step: Waiting for OTP entry */}
          {step === 'waiting' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 bg-[#23A55A]/10 border border-[#23A55A]/30 rounded-xl">
                <Smartphone className="w-4 h-4 text-[#23A55A] shrink-0" />
                <p className="text-xs text-[#23A55A] font-semibold">OTP sent to your registered device</p>
              </div>

              {/* Demo: show the actual OTP in a "notification" style */}
              <div className="p-3 bg-[#121316] border border-[#2B2D31] rounded-xl flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#5865F2] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#949BA4]">Swaraksha AI (Demo notification)</p>
                  <p className="text-xs font-bold text-white">Your MFA code: <span className="text-[#5865F2] font-mono tracking-widest">{otp}</span></p>
                </div>
              </div>

              {/* OTP digit inputs */}
              <div className={`flex justify-center gap-2 ${shakeError ? 'animate-[shake_0.5s_ease]' : ''}`}>
                {otpInput.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-[#121316] text-white focus:outline-none transition-colors ${
                      digit ? 'border-[#5865F2] bg-[#5865F2]/10' : 'border-[#3A3C41] focus:border-[#5865F2]'
                    }`}
                  />
                ))}
              </div>

              {/* Timer + attempts */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#949BA4]">
                  {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                </span>
                <div className={`flex items-center gap-1 font-mono font-bold ${
                  countdown <= 15 ? 'text-[#ED4245]' : 'text-[#949BA4]'
                }`}>
                  <RefreshCw className="w-3 h-3" />
                  {countdown.toString().padStart(2,'0')}s
                </div>
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={otpInput.join('').length !== 6}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, #5865F2, #4752C4)`, boxShadow: '0 4px 15px rgba(88,101,242,0.3)' }}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Verify OTP
              </button>
            </div>
          )}

          {/* Step: Verifying */}
          {step === 'verifying' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-12 h-12 text-[#5865F2] animate-spin" />
              <p className="text-sm font-semibold text-white">Verifying OTP…</p>
              <p className="text-xs text-[#949BA4]">Checking with authentication server</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="p-4 rounded-full bg-[#23A55A]/20 border border-[#23A55A]/40 animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-[#23A55A]" />
              </div>
              <p className="text-base font-bold text-[#23A55A]">MFA Verified!</p>
              <p className="text-xs text-[#949BA4] text-center">
                Identity confirmed. Call security level upgraded. Incident logged.
              </p>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#23A55A]/10 border border-[#23A55A]/30 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-[#23A55A]" />
                <span className="text-xs font-semibold text-[#23A55A]">Call upgraded to SECURE</span>
              </div>
            </div>
          )}

          {/* Step: Failed */}
          {step === 'failed' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="p-4 rounded-full bg-[#ED4245]/20 border border-[#ED4245]/40">
                <XCircle className="w-12 h-12 text-[#ED4245]" />
              </div>
              <p className="text-base font-bold text-[#ED4245]">MFA Failed</p>
              <p className="text-xs text-[#949BA4] text-center">
                Maximum attempts reached or session expired. Escalating to CRITICAL.
              </p>
              <button onClick={onDismiss}
                className="px-6 py-2 bg-[#ED4245]/20 border border-[#ED4245]/40 text-[#ED4245] rounded-xl text-xs font-bold">
                Escalate & Terminate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
