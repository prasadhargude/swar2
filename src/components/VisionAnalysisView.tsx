import React, { useState } from 'react';
import { 
  Image as ImageIcon, Camera, Scan, 
  ShieldCheck, FileCheck, UploadCloud, 
  Fingerprint, Activity, CheckCircle2, Lock, X
} from 'lucide-react';
import { VisionAnalysisResult } from '../types/integrity';
import { visionAdapter } from '../services/visionAdapter';

export interface VisionAnalysisViewProps {
  onClose?: () => void;
}

export const VisionAnalysisView: React.FC<VisionAnalysisViewProps> = ({ onClose }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [result, setResult] = useState<any>(null); // Replace any with VisionAnalysisResult when fully implemented

  const handleSimulatedUpload = () => {
    setImageLoaded(true);
    setResult(null);
  };

  const handleAnalyze = () => {
    if (!imageLoaded) return;
    
    setAnalyzing(true);
    // Simulate adapter call
    setTimeout(() => {
      setResult({
        detections: [
          { label: 'Person', confidence: 0.98, box: { x: 10, y: 20, w: 30, h: 40 } },
          { label: 'Suspicious Object', confidence: 0.87, box: { x: 60, y: 50, w: 15, h: 15 } }
        ],
        integrity: {
          inputHash: '7a38b99c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
          modelHash: '8f4c2b9a13d9e7f1c4e2a5b6d8c3d9e7f1c4e2a5b6d8c3d9e7f1c4e2a5b6d8',
          signature: 'sig_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
          verifiedAt: new Date(),
          isSecure: true
        }
      });
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#121316] p-6 lg:p-8 font-roboto text-[#F2F3F5]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Scan className="text-[#5865F2]" size={32} />
              Vision Analysis Demo
            </h1>
            <p className="text-[#949BA4]">Model-agnostic computer vision integration with verifiable provenance.</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[#949BA4] hover:text-[#F2F3F5] hover:bg-[#2B2D31] rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#1E1F22] border border-[#3A3C41] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col">
              
              {!imageLoaded ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#121316]/50">
                  <div className="w-20 h-20 rounded-full bg-[#2B2D31] flex items-center justify-center mb-6 border-2 border-dashed border-[#3A3C41]">
                    <UploadCloud size={32} className="text-[#949BA4]" />
                  </div>
                  <h3 className="text-xl font-medium text-[#F2F3F5] mb-2">Upload visual data</h3>
                  <p className="text-[#949BA4] mb-6 max-w-sm">Select an image or video frame to run through the integrity-secured inference pipeline.</p>
                  <button 
                    onClick={handleSimulatedUpload}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <ImageIcon size={18} /> Load Demo Image
                  </button>
                </div>
              ) : (
                <div className="flex-1 relative group bg-black">
                  {/* Placeholder for the actual image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2B2D31] to-[#1E1F22] opacity-50"></div>
                  
                  {/* Simulated bounding boxes if result exists */}
                  {result && (
                    <>
                      <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] border-2 border-[#5865F2] bg-[#5865F2]/10 rounded">
                        <span className="absolute -top-6 left-[-2px] bg-[#5865F2] text-white text-xs px-2 py-1 rounded-t shadow-md font-medium">Person 98%</span>
                      </div>
                      <div className="absolute top-[50%] left-[60%] w-[15%] h-[15%] border-2 border-[#ED4245] bg-[#ED4245]/10 rounded">
                        <span className="absolute -top-6 left-[-2px] bg-[#ED4245] text-white text-xs px-2 py-1 rounded-t shadow-md font-medium">Alert 87%</span>
                      </div>
                    </>
                  )}

                  <div className="absolute bottom-4 right-4 flex gap-3">
                    <button 
                      onClick={() => { setImageLoaded(false); setResult(null); }}
                      className="bg-[#121316]/80 backdrop-blur-sm border border-[#3A3C41] text-[#F2F3F5] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B2D31] transition-colors"
                    >
                      Clear
                    </button>
                    {!result && (
                      <button 
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {analyzing ? <Activity className="animate-spin" size={18} /> : <Scan size={18} />}
                        {analyzing ? 'Processing...' : 'Run Analysis'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Detections List */}
            {result && (
              <div className="bg-[#1E1F22] border border-[#3A3C41] rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#949BA4] mb-4 flex items-center gap-2">
                  <Activity size={16} /> Analysis Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {result.detections.map((d: any, idx: number) => (
                    <div key={idx} className="bg-[#121316] border border-[#2B2D31] p-3 rounded-lg flex items-center justify-between">
                      <span className="font-medium text-[#F2F3F5]">{d.label}</span>
                      <span className="text-xs bg-[#2B2D31] text-[#949BA4] px-2 py-1 rounded">{d.confidence * 100}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Integrity Metadata */}
          <div className="space-y-4">
            <div className={`bg-[#1E1F22] border rounded-2xl p-6 transition-all duration-500 ${
              result ? 'border-[#23A55A]' : 'border-[#3A3C41]'
            }`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#3A3C41]">
                <div className={`p-3 rounded-xl ${result ? 'bg-[#23A55A]/20' : 'bg-[#2B2D31]'}`}>
                  <ShieldCheck size={24} className={result ? 'text-[#23A55A]' : 'text-[#949BA4]'} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#F2F3F5]">Provenance</h3>
                  <p className="text-[#949BA4] text-sm">Integrity Verification</p>
                </div>
              </div>

              {!result ? (
                <div className="text-center py-8">
                  <Lock size={32} className="mx-auto text-[#3A3C41] mb-3" />
                  <p className="text-[#949BA4] text-sm">Run analysis to generate cryptographic proofs.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#949BA4] mb-2">
                      <ImageIcon size={14} /> Input Hash (SHA-256)
                    </label>
                    <div className="bg-[#121316] p-3 rounded-lg border border-[#2B2D31] text-xs font-mono text-[#F2F3F5] break-all leading-relaxed">
                      {result.integrity.inputHash}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#949BA4] mb-2">
                      <FileCheck size={14} /> Model Hash
                    </label>
                    <div className="bg-[#121316] p-3 rounded-lg border border-[#2B2D31] text-xs font-mono text-[#F2F3F5] break-all leading-relaxed">
                      {result.integrity.modelHash}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#949BA4] mb-2">
                      <Fingerprint size={14} /> Inference Signature
                    </label>
                    <div className="bg-[#121316] p-3 rounded-lg border border-[#2B2D31] text-xs font-mono text-[#5865F2] break-all leading-relaxed bg-opacity-50">
                      {result.integrity.signature}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#3A3C41] flex items-center justify-between">
                    <span className="text-[#949BA4] text-xs">Verified at {result.integrity.verifiedAt.toLocaleTimeString()}</span>
                    <span className="flex items-center gap-1 text-[#23A55A] text-sm font-medium bg-[#23A55A]/10 px-3 py-1 rounded-full">
                      <CheckCircle2 size={16} /> Secure
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
