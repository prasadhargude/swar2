import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
  Lock,
  Fingerprint,
  Clock,
  Radio,
} from 'lucide-react';
import { TrustedContact } from '../types/speakerFingerprint';
import { soundEffects } from '../services/soundEffects';

interface VerifiedCallbackModalProps {
  callerName: string;
  trustedContacts: TrustedContact[];
  riskScore: number;
  onDismiss: () => void;
}

type CallbackStep = 'select' | 'authenticating' | 'connecting' | 'connected' | 'secured';

export const VerifiedCallbackModal: React.FC<VerifiedCallbackModalProps> = ({
  callerName,
  trustedContacts,
  riskScore,
  onDismiss,
}) => {
  const [step, setStep] = useState<CallbackStep>('select');
  const [selectedContact, setSelectedContact] = useState<TrustedContact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [securityNonce] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [channelId] = useState(() => `SWK-${Date.now().toString(36).toUpperCase()}`);

  // Auto-select if only one contact
  useEffect(() => {
    if (trustedContacts.length === 1) {
      setSelectedContact(trustedContacts[0]);
    }
  }, [trustedContacts]);

  // Simulated call timer
  useEffect(() => {
    if (step !== 'connected' && step !== 'secured') return;
    const t = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleInitiateCallback = () => {
    if (!selectedContact) return;
    soundEffects.vibrate(20);
    setStep('authenticating');
    // Simulate authentication → connecting → connected → secured
    setTimeout(() => setStep('connecting'), 1500);
    setTimeout(() => {
      setStep('connected');
      soundEffects.vibrate(30);
    }, 3200);
    setTimeout(() => setStep('secured'), 5000);
  };

  const progressSteps = [
    { key: 'authenticating', label: 'Authenticating Channel' },
    { key: 'connecting', label: 'Connecting Securely' },
    { key: 'connected', label: 'Establishing E2EE' },
    { key: 'secured', label: 'Channel Secured' },
  ];

  const stepIndex = progressSteps.findIndex(s => s.key === step);

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1A1B1E] border border-[#3A3C41] rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#2B2D31]"
          style={{ background: 'linear-gradient(135deg, #5865F218 0%, #1A1B1E 100%)' }}>
          <button onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#2B2D31] text-[#949BA4] hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/50">
              <PhoneCall className="w-7 h-7 text-[#5865F2]" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5865F2]">
                Verified Callback
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">Secure Channel</h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Bypasses compromised number • E2EE VoIP
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Context */}
          <div className="flex items-start gap-2.5 p-3 bg-[#FEE75C]/10 border border-[#FEE75C]/30 rounded-xl">
            <Radio className="w-4 h-4 text-[#FEE75C] shrink-0 mt-0.5" />
            <p className="text-xs text-[#DBDEE1]">
              Current call with <span className="font-bold text-white">{callerName}</span> flagged as
              suspicious (Score: <span className="text-[#FEE75C] font-bold">{Math.round(riskScore)}</span>).
              Initiate a cryptographically verified callback on a clean Swaraksha channel.
            </p>
          </div>

          {/* Step: Select Contact */}
          {step === 'select' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-[#949BA4] uppercase tracking-wider">
                Select verified contact to callback
              </p>
              {trustedContacts.length === 0 ? (
                <div className="p-4 bg-[#2B2D31] rounded-xl text-xs text-[#949BA4] text-center">
                  No enrolled trusted contacts found. Add contacts in the directory first.
                </div>
              ) : (
                trustedContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedContact?.id === contact.id
                        ? 'border-[#5865F2] bg-[#5865F2]/15'
                        : 'border-[#2B2D31] bg-[#2B2D31]/50 hover:border-[#5865F2]/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-[#5865F2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{contact.name}</p>
                      <p className="text-xs text-[#949BA4]">{contact.relationship} • {contact.phoneNumber}</p>
                      {contact.speakerProfile && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Fingerprint className="w-3 h-3 text-[#23A55A]" />
                          <span className="text-[10px] text-[#23A55A]">Voice enrolled</span>
                        </div>
                      )}
                    </div>
                    {selectedContact?.id === contact.id && (
                      <CheckCircle2 className="w-5 h-5 text-[#5865F2] shrink-0" />
                    )}
                  </button>
                ))
              )}

              {/* Channel details */}
              {selectedContact && (
                <div className="p-3 bg-[#121316] border border-[#2B2D31] rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#949BA4]">Session Nonce</span>
                    <span className="font-mono text-[#5865F2]">{securityNonce}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#949BA4]">Channel ID</span>
                    <span className="font-mono text-[#5865F2]">{channelId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#949BA4]">Encryption</span>
                    <span className="text-[#23A55A] font-semibold">ECDSA P-256 + AES-256-GCM</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleInitiateCallback}
                disabled={!selectedContact}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #5865F2, #4752C4)', boxShadow: '0 4px 15px rgba(88,101,242,0.3)' }}
              >
                <PhoneCall className="w-4 h-4" />
                Initiate Verified Callback
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Steps: authenticating / connecting / connected / secured */}
          {step !== 'select' && (
            <div className="flex flex-col gap-4">
              {/* Progress steps */}
              <div className="flex flex-col gap-2">
                {progressSteps.map((s, i) => {
                  const isDone = stepIndex > i;
                  const isCurrent = stepIndex === i;
                  return (
                    <div key={s.key} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      isDone ? 'bg-[#23A55A]/10' : isCurrent ? 'bg-[#5865F2]/10' : 'opacity-30'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-[#23A55A]' : isCurrent ? 'bg-[#5865F2]' : 'bg-[#2B2D31]'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : isCurrent ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <span className="text-xs text-[#949BA4]">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${
                        isDone ? 'text-[#23A55A]' : isCurrent ? 'text-white' : 'text-[#949BA4]'
                      }`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Secured view */}
              {step === 'secured' && selectedContact && (
                <div className="flex flex-col items-center gap-3 p-4 bg-[#23A55A]/10 border border-[#23A55A]/30 rounded-2xl">
                  <div className="relative">
                    <div className="p-3 rounded-full bg-[#23A55A]/20 border border-[#23A55A]/40">
                      <ShieldCheck className="w-10 h-10 text-[#23A55A]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-[#1A1B1E] rounded-full">
                      <Lock className="w-3.5 h-3.5 text-[#23A55A]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-[#23A55A]">Secured Channel Active</p>
                    <p className="text-sm font-semibold text-white mt-1">{selectedContact.name}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-[#949BA4]" />
                      <span className="text-xs font-mono text-[#949BA4]">{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full text-xs">
                    <div className="p-2 bg-[#121316] rounded-lg text-center">
                      <p className="text-[#949BA4]">Nonce</p>
                      <p className="font-mono text-[#5865F2] text-[10px]">{securityNonce}</p>
                    </div>
                    <div className="p-2 bg-[#121316] rounded-lg text-center">
                      <p className="text-[#949BA4]">E2EE</p>
                      <p className="text-[#23A55A] font-bold text-[10px]">ACTIVE</p>
                    </div>
                  </div>
                  <button onClick={onDismiss}
                    className="w-full py-2.5 bg-[#ED4245] rounded-xl text-white font-bold text-sm">
                    End Secure Callback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
