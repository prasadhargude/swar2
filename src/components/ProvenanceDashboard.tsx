import React, { useState, useEffect, useCallback } from 'react';
import { modelRegistry } from '../services/modelRegistry';
import { inferenceRecorder } from '../services/inferenceRecorder';
import { provenanceStore } from '../services/provenanceStore';
import { evidenceService } from '../services/evidenceService';
import { blockchainService } from '../services/blockchainService';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Database, FileText, Activity, Layers, 
  Link as LinkIcon, RefreshCw, AlertTriangle
} from 'lucide-react';

export function ProvenanceDashboard() {
  const [activeTab, setActiveTab] = useState('Models');
  const tabs = ['Models', 'Inference Log', 'Audit Trail', 'Cases', 'Blockchain'];

  return (
    <div className="min-h-screen bg-[#121316] text-[#F2F3F5] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between border-b border-[#2B2D31] pb-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#5865F2]" />
            <div>
              <h1 className="text-2xl font-bold">Provenance & Audit Dashboard</h1>
              <p className="text-[#949BA4] text-sm mt-1">Cryptographically verifiable AI operations</p>
            </div>
          </div>
        </header>
        
        <div className="flex gap-2 mb-6 border-b border-[#2B2D31]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-[#5865F2] text-[#F2F3F5]'
                  : 'border-transparent text-[#949BA4] hover:text-[#F2F3F5] hover:border-[#2B2D31]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-[#1E1F22] rounded-xl border border-[#2B2D31] p-6 shadow-lg min-h-[500px]">
          {activeTab === 'Models' && <ModelsTab />}
          {activeTab === 'Inference Log' && <InferenceLogTab />}
          {activeTab === 'Audit Trail' && <AuditTrailTab />}
          {activeTab === 'Cases' && <CasesTab />}
          {activeTab === 'Blockchain' && <BlockchainTab />}
        </div>
      </div>
    </div>
  );
}

function ModelsTab() {
  const [models, setModels] = useState<any[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<Record<string, {verified: boolean, expectedHash?: string, actualHash?: string}>>({});
  
  const loadModels = useCallback(() => {
    setModels(modelRegistry.getModels());
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleVerify = async (id: string) => {
    try {
      const res = await modelRegistry.verifyModel(id);
      setVerifyStatus(prev => ({ ...prev, [id]: res }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTamper = async (id: string) => {
    await modelRegistry.tamperModel(id);
    loadModels();
    setVerifyStatus(prev => {
      const next = {...prev};
      delete next[id];
      return next;
    });
  };

  const handleRestore = async (id: string) => {
    await modelRegistry.restoreModel(id);
    loadModels();
    setVerifyStatus(prev => {
      const next = {...prev};
      delete next[id];
      return next;
    });
  };

  const truncate = (str: string, len: number = 16) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Database className="w-5 h-5 text-[#5865F2]" /> 
        Registered Models
      </h2>
      <div className="grid gap-4">
        {models.map((model) => (
          <div key={model.id} className="bg-[#2B2D31] rounded-lg p-5 border border-[#1E1F22]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {model.name} <span className="text-[#949BA4] text-sm font-normal">v{model.version}</span>
                </h3>
                <p className="text-sm text-[#949BA4]">ID: {model.id}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium bg-[#121316] ${model.approvalStatus === 'APPROVED' ? 'text-[#23A55A]' : 'text-[#FAA61A]'}`}>
                  {model.approvalStatus || 'UNKNOWN'}
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-[#121316] text-[#F2F3F5]">
                  {model.framework || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-[#949BA4] block text-xs mb-1">SHA-256 Hash</span>
                <code className="font-mono text-[#F2F3F5] bg-[#121316] px-2 py-1 rounded text-xs">{truncate(model.sha256, 16)}</code>
              </div>
              <div>
                <span className="text-[#949BA4] block text-xs mb-1">Creator</span>
                <span className="text-[#F2F3F5]">{model.creator || 'Unknown'}</span>
              </div>
            </div>

            {verifyStatus[model.id] && (
              <div className={`p-3 rounded mb-4 text-sm ${verifyStatus[model.id].verified ? 'bg-[#23A55A]/10 border border-[#23A55A]/30 text-[#23A55A]' : 'bg-[#ED4245]/10 border border-[#ED4245]/30 text-[#ED4245]'}`}>
                <div className="flex items-center gap-2 font-medium mb-1">
                  {verifyStatus[model.id].verified ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                  {verifyStatus[model.id].verified ? 'Integrity Verified' : 'Integrity Compromised'}
                </div>
                {!verifyStatus[model.id].verified && (
                  <div className="text-xs font-mono mt-2 flex flex-col gap-1">
                    <div>Expected: {truncate(verifyStatus[model.id].expectedHash, 16)}</div>
                    <div>Actual: {truncate(verifyStatus[model.id].actualHash, 16)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => handleVerify(model.id)}
                className="flex items-center gap-1 bg-[#5865F2] hover:bg-[#4752C4] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Verify
              </button>
              <button 
                onClick={() => handleTamper(model.id)}
                className="flex items-center gap-1 bg-[#ED4245] hover:bg-[#C9383A] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <ShieldAlert className="w-4 h-4" /> Tamper
              </button>
              <button 
                onClick={() => handleRestore(model.id)}
                className="flex items-center gap-1 bg-[#2B2D31] hover:bg-[#313338] border border-[#949BA4]/30 text-[#F2F3F5] px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Restore
              </button>
            </div>
          </div>
        ))}
        {models.length === 0 && (
          <p className="text-[#949BA4]">No models registered.</p>
        )}
      </div>
    </div>
  );
}

function InferenceLogTab() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecords = () => {
      setRecords(inferenceRecorder.getRecentRecords(20));
    };
    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  const truncate = (str: string, len: number = 16) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#5865F2]" /> 
          Real-time Inference Log
        </h2>
        <div className="flex items-center gap-2 text-xs text-[#23A55A] font-medium bg-[#23A55A]/10 px-2 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-[#23A55A] animate-pulse"></span> Live Updates
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2B2D31]">
        <table className="w-full text-left text-sm text-[#949BA4]">
          <thead className="text-xs uppercase bg-[#2B2D31] text-[#F2F3F5]">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Input Hash</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verification</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">No inferences recorded yet.</td>
              </tr>
            ) : records.map((rec) => (
              <tr key={rec.inferenceId} className="border-t border-[#2B2D31] hover:bg-[#2B2D31]/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{truncate(rec.inferenceId, 8)}</td>
                <td className="px-4 py-3">{new Date(rec.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-[#F2F3F5]">{rec.modelId}</td>
                <td className="px-4 py-3 font-mono text-xs">{truncate(rec.inputHash, 10)}</td>
                <td className="px-4 py-3">
                  {rec.tampered ? (
                    <span className="bg-[#FAA61A]/10 text-[#FAA61A] border border-[#FAA61A]/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 w-max">
                      <AlertTriangle className="w-3 h-3"/> Tampered
                    </span>
                  ) : (
                    <span className="text-[#F2F3F5]">OK</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {rec.verified ? (
                    <span className="bg-[#23A55A]/10 text-[#23A55A] border border-[#23A55A]/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 w-max">
                      <CheckCircle2 className="w-3 h-3"/> Verified
                    </span>
                  ) : (
                    <span className="bg-[#ED4245]/10 text-[#ED4245] border border-[#ED4245]/30 px-2 py-0.5 rounded text-xs flex items-center gap-1 w-max">
                      <XCircle className="w-3 h-3"/> Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTrailTab() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await provenanceStore.getAuditTrail({ limit: 50 });
        setEvents(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#5865F2]" /> 
        Audit Trail Timeline
      </h2>
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-[#949BA4]">No audit events found.</p>
        ) : events.map((ev) => (
          <div key={ev.eventId} className="flex gap-4 p-4 rounded-lg bg-[#2B2D31] border-l-4 border-[#5865F2]">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between w-full">
                <span className="font-semibold text-[#F2F3F5] capitalize">{(ev.action || '').replace(/_/g, ' ')}</span>
                <span className="text-xs text-[#949BA4]">{new Date(ev.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-sm text-[#949BA4] mt-1">
                Actor: <span className="text-[#F2F3F5] font-medium">{ev.actor}</span>
              </div>
              <div className="text-sm text-[#949BA4]">
                Target: <span className="text-[#F2F3F5] font-mono text-xs bg-[#121316] px-1 py-0.5 rounded mr-1">{ev.artifactType}</span>
                <span className="font-mono text-xs bg-[#121316] px-1 py-0.5 rounded">{ev.artifactId}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CasesTab() {
  const [cases, setCases] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setCases(evidenceService.getPackages());
  }, []);

  const truncate = (str: string, len: number = 16) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#5865F2]" /> 
        Evidence Cases
      </h2>
      <div className="grid gap-4">
        {cases.length === 0 ? (
          <p className="text-[#949BA4]">No evidence cases available.</p>
        ) : cases.map((c) => (
          <div key={c.caseId} className="bg-[#2B2D31] rounded-lg border border-[#1E1F22] overflow-hidden">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#313338] transition-colors" 
              onClick={() => setExpanded(expanded === c.caseId ? null : c.caseId)}
            >
              <div>
                <h3 className="font-semibold text-[#F2F3F5] flex items-center gap-2">
                  Case: {truncate(c.caseId, 12)}
                </h3>
                <p className="text-sm text-[#949BA4] mt-1">Peer: <span className="text-[#F2F3F5]">{c.peerUsername}</span> • Status: <span className="text-[#F2F3F5]">{c.status}</span></p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1
                  ${c.riskLevel === 'HIGH' ? 'bg-[#ED4245]/10 text-[#ED4245] border border-[#ED4245]/30' 
                    : c.riskLevel === 'MEDIUM' ? 'bg-[#FAA61A]/10 text-[#FAA61A] border border-[#FAA61A]/30'
                    : 'bg-[#23A55A]/10 text-[#23A55A] border border-[#23A55A]/30'}`}>
                  {c.riskLevel} RISK
                </div>
                <button className="text-[#5865F2] hover:text-[#4752C4] text-sm font-medium transition-colors">
                  {expanded === c.caseId ? 'Hide Details' : 'View Details'}
                </button>
              </div>
            </div>
            {expanded === c.caseId && (
              <div className="p-4 bg-[#1E1F22] border-t border-[#2B2D31] text-sm">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[#949BA4] text-xs mb-1">Evidence ID</p>
                    <code className="bg-[#121316] px-2 py-1 rounded text-[#F2F3F5] text-xs">{c.evidenceId}</code>
                  </div>
                  <div>
                    <p className="text-[#949BA4] text-xs mb-1">Blockchain Anchor</p>
                    <code className="bg-[#121316] px-2 py-1 rounded text-[#F2F3F5] text-xs">
                      {c.blockchainAnchorId ? truncate(c.blockchainAnchorId, 24) : 'Pending...'}
                    </code>
                  </div>
                  <div>
                    <p className="text-[#949BA4] text-xs mb-1">Spoof Score</p>
                    <span className="text-[#F2F3F5] font-medium bg-[#121316] px-2 py-1 rounded inline-block">{(c.spoofScore || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockchainTab() {
  const [chain, setChain] = useState<any[]>([]);
  const [chainLength, setChainLength] = useState(0);

  useEffect(() => {
    setChain(blockchainService.getChain());
    setChainLength(blockchainService.getChainLength());
  }, []);

  const truncate = (str: string, len: number = 16) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#5865F2]" /> 
          Immutable Blockchain
        </h2>
        <div className="bg-[#2B2D31] px-3 py-1.5 rounded-lg text-sm text-[#F2F3F5] font-medium border border-[#1E1F22]">
          Chain Length: <span className="text-[#5865F2]">{chainLength}</span> blocks
        </div>
      </div>

      <div className="space-y-4">
        {chain.length === 0 ? (
          <p className="text-[#949BA4]">Chain is empty.</p>
        ) : chain.map((block, idx) => (
          <div key={block.blockHash || idx} className="relative pl-8">
            {idx !== chain.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-[#5865F2]/30"></div>
            )}
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#5865F2]/20 border-2 border-[#5865F2] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#5865F2]"></div>
            </div>
            
            <div className="bg-[#2B2D31] rounded-lg p-4 border border-[#1E1F22]">
              <div className="flex justify-between mb-3">
                <span className="font-bold text-[#F2F3F5]">Block #{block.index}</span>
                <span className="text-xs text-[#949BA4]">{new Date(block.timestamp).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono bg-[#121316] p-3 rounded-md">
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="text-[#949BA4] w-24 shrink-0">Hash:</span>
                  <span className="text-[#23A55A] break-all">{truncate(block.blockHash, 24)}</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="text-[#949BA4] w-24 shrink-0">Prev Hash:</span>
                  <span className="text-[#FAA61A] break-all">{truncate(block.previousHash, 24)}</span>
                </div>
                {block.caseId && (
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <span className="text-[#949BA4] w-24 shrink-0">Case ID:</span>
                    <span className="text-[#F2F3F5] break-all">{block.caseId}</span>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="text-[#949BA4] w-24 shrink-0">Nonce:</span>
                  <span className="text-[#F2F3F5]">{block.nonce}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
