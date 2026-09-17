// ═══════════════════════════════════════════════════════════════════
// SIH26228 — AI Integrity & Provenance Framework Type Definitions
// ═══════════════════════════════════════════════════════════════════

// ── Integrity Engine ──────────────────────────────────────────────

export interface ArtifactHash {
  sha256: string;
  timestamp: number;
  size?: number;
}

export interface DigitalSignature {
  signature: string;
  publicKeyId: string;
  algorithm: 'ECDSA-P256';
  timestamp: number;
}

export interface EvidenceManifest {
  caseId: string;
  audioHash: string;
  transcriptHash: string;
  analysisHash: string;
  reportHash: string;
  manifestHash: string;
  createdAt: number;
  creator: string;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string;
}

// ── Model Registry ────────────────────────────────────────────────

export type ModelApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ModelFramework = 'pytorch' | 'tensorflow' | 'onnx' | 'tflite' | 'web-audio-dsp';

export interface RegisteredModel {
  modelId: string;
  name: string;
  version: string;
  sha256: string;
  framework: ModelFramework;
  trainingDatasetId: string;
  creator: string;
  createdAt: number;
  approvalStatus: ModelApprovalStatus;
  signature: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface DatasetRecord {
  datasetId: string;
  name: string;
  version: string;
  sha256: string;
  contributor: string;
  sampleCount: number;
  createdAt: number;
  parentDatasetId?: string;
  signature: string;
}

// ── Inference Integrity ───────────────────────────────────────────

export interface InferenceRecord {
  inferenceId: string;
  inputHash: string;
  modelId: string;
  modelHash: string;
  modelVersion: string;
  output: Record<string, unknown>;
  timestamp: number;
  deviceId: string;
  signature: string;
  verified: boolean;
  tampered?: boolean;
}

// ── Evidence & Forensics ──────────────────────────────────────────

export interface EvidencePackage {
  caseId: string;
  evidenceId: string;
  callId?: string;
  originalAudioHash: string;
  transcriptHash: string;
  analysisHash: string;
  reportHash: string;
  manifestHash: string;
  manifest: EvidenceManifest;
  createdAt: number;
  investigator: string;
  blockchainAnchorId?: string;
  status: 'created' | 'verified' | 'tampered';
  peerUsername?: string;
  callDuration?: number;
  riskLevel?: string;
  spoofScore?: number;
  speakerMatch?: string;
}

export interface ForensicReport {
  reportId: string;
  caseId: string;
  generatedAt: number;
  investigator: string;
  evidence: {
    evidenceId: string;
    sha256: string;
    fileSize: number;
    source: string;
    timestamp: number;
  };
  aiAnalysis: {
    spoofScore: number;
    spoofVerdict: string;
    speakerVerification: string;
    speakerSimilarity: number;
    intentCategory: string;
    riskScore: number;
    riskLevel: string;
  };
  modelProvenance: {
    modelId: string;
    modelVersion: string;
    modelHash: string;
    framework: string;
  };
  integrityStatus: {
    evidenceVerified: boolean;
    modelVerified: boolean;
    inferenceVerified: boolean;
    reportVerified: boolean;
    blockchainAnchored: boolean;
  };
  reportHash: string;
}

// ── Verification ──────────────────────────────────────────────────

export interface VerificationResult {
  artifactId: string;
  artifactType: 'evidence' | 'model' | 'inference' | 'report' | 'blockchain';
  expectedHash: string;
  actualHash: string;
  verified: boolean;
  checkedAt: number;
}

export interface VerificationChecklist {
  caseId: string;
  results: VerificationResult[];
  allPassed: boolean;
  checkedAt: number;
}

// ── Provenance ────────────────────────────────────────────────────

export type ProvenanceAction =
  | 'DATA_UPLOADED'
  | 'DATA_VERIFIED'
  | 'DATA_MODIFIED'
  | 'MODEL_REGISTERED'
  | 'MODEL_APPROVED'
  | 'MODEL_DEPLOYED'
  | 'MODEL_VERIFIED'
  | 'MODEL_TAMPERED'
  | 'INFERENCE_CREATED'
  | 'INFERENCE_VERIFIED'
  | 'INFERENCE_TAMPERED'
  | 'REPORT_GENERATED'
  | 'REPORT_VERIFIED'
  | 'REPORT_TAMPERED'
  | 'EVIDENCE_CREATED'
  | 'EVIDENCE_VERIFIED'
  | 'EVIDENCE_TAMPERED'
  | 'BLOCKCHAIN_ANCHORED'
  | 'VISION_INFERENCE';

export type ProvenanceArtifactType =
  | 'dataset'
  | 'model'
  | 'inference'
  | 'evidence'
  | 'report'
  | 'blockchain'
  | 'vision';

export interface ProvenanceEvent {
  eventId: string;
  actor: string;
  timestamp: number;
  artifactId: string;
  artifactType: ProvenanceArtifactType;
  hash: string;
  action: ProvenanceAction;
  signature?: string;
  parentArtifactId?: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceNode {
  id: string;
  type: ProvenanceArtifactType;
  label: string;
  hash: string;
  timestamp: number;
  status: 'verified' | 'tampered' | 'pending';
  children: ProvenanceNode[];
}

// ── Blockchain ────────────────────────────────────────────────────

export interface BlockchainBlock {
  index: number;
  timestamp: number;
  caseId: string;
  manifestHash: string;
  previousHash: string;
  blockHash: string;
  nonce: number;
}

export interface BlockchainAnchor {
  caseId: string;
  blockIndex: number;
  blockHash: string;
  manifestHash: string;
  anchoredAt: number;
  chainValid: boolean;
}

// ── Computer Vision ───────────────────────────────────────────────

export interface VisionDetection {
  label: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface VisionAnalysisResult {
  analysisId: string;
  inputHash: string;
  modelId: string;
  modelHash: string;
  modelVersion: string;
  detections: VisionDetection[];
  timestamp: number;
  inferenceRecord: InferenceRecord;
  signature: string;
}

// ── Risk Engine Extensions ────────────────────────────────────────

export type GraduatedResponse =
  | 'CONTINUE'
  | 'ADDITIONAL_VERIFICATION'
  | 'MFA_REQUIRED'
  | 'BLOCK_ESCALATE';

export interface RiskTimelineEntry {
  timestamp: number;
  score: number;
  label?: string;
}

export interface BehavioralSignals {
  callFrequency: number;
  callDuration: number;
  repeatedAttempts: number;
  timeOfDayAnomaly: boolean;
  knownCaller: boolean;
  previousInteractions: number;
}

// ── AI Adapter Interface ──────────────────────────────────────────

export interface AIAdapterInput {
  data: Blob | Float32Array | string;
  type: 'audio' | 'image' | 'text';
  metadata?: Record<string, unknown>;
}

export interface AIAdapterOutput {
  result: Record<string, unknown>;
  inputHash: string;
  modelHash: string;
  modelVersion: string;
  inferenceId: string;
  signature: string;
  timestamp: number;
}

// ── Organization Identity ─────────────────────────────────────────

export interface OrganizationIdentity {
  orgId: string;
  name: string;
  publicKey: string;
  role: 'data_collector' | 'annotator' | 'trainer' | 'deployer' | 'auditor';
  createdAt: number;
}
