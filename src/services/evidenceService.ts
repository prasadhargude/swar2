import { EvidencePackage, EvidenceManifest, ForensicReport, VerificationChecklist, VerificationResult } from '../types/integrity';
import { integrityEngine } from './integrityEngine';
import { provenanceStore } from './provenanceStore';
import { blockchainService } from './blockchainService';
import { modelRegistry } from './modelRegistry';

export class EvidenceService {
  private packages: Map<string, EvidencePackage> = new Map();
  private reports: Map<string, ForensicReport> = new Map();
  // Original hashes for tamper-restore demo
  private originalHashes: Map<string, { audio: string; transcript: string; analysis: string; report: string }> = new Map();
  private caseCounter = 0;
  private evidenceCounter = 0;

  async createEvidencePackage(params: {
    callId: string;
    investigator: string;
    peerUsername: string;
    callDuration: number;
    transcriptText: string;
    spoofScore: number;
    spoofVerdict: string;
    speakerMatch: string;
    speakerSimilarity: number;
    intentCategory: string;
    riskScore: number;
    riskLevel: string;
  }): Promise<EvidencePackage> {
    this.caseCounter++;
    this.evidenceCounter++;

    const caseId = `CASE-${this.caseCounter.toString().padStart(5, '0')}`;
    const evidenceId = `AUDIO-${this.evidenceCounter.toString().padStart(5, '0')}`;
    const createdAt = Date.now();

    // Hash each component
    const audioData = JSON.stringify({ callId: params.callId, duration: params.callDuration });
    const analysisData = JSON.stringify({
      spoofScore: params.spoofScore,
      spoofVerdict: params.spoofVerdict,
      speakerMatch: params.speakerMatch,
      speakerSimilarity: params.speakerSimilarity,
      intentCategory: params.intentCategory,
      riskScore: params.riskScore,
      riskLevel: params.riskLevel,
    });
    const reportData = JSON.stringify({ investigator: params.investigator, peerUsername: params.peerUsername, caseId });

    const originalAudioHash = await integrityEngine.hashData(audioData);
    const transcriptHash = await integrityEngine.hashData(params.transcriptText || 'no transcript');
    const analysisHash = await integrityEngine.hashData(analysisData);
    const reportHash = await integrityEngine.hashData(reportData);

    // Store originals for tamper/restore demo
    this.originalHashes.set(caseId, {
      audio: originalAudioHash,
      transcript: transcriptHash,
      analysis: analysisHash,
      report: reportHash,
    });

    const manifest: EvidenceManifest = {
      caseId,
      audioHash: originalAudioHash,
      transcriptHash,
      analysisHash,
      reportHash,
      manifestHash: '', // Will be set below
      createdAt,
      creator: params.investigator,
    };

    const manifestHash = await integrityEngine.hashData(JSON.stringify({ ...manifest, manifestHash: undefined }));
    manifest.manifestHash = manifestHash;

    // Anchor on blockchain
    let blockchainAnchorId: string | undefined;
    try {
      const anchor = await blockchainService.anchorHash(caseId, manifestHash);
      blockchainAnchorId = `BLOCK-${anchor.blockIndex}`;
    } catch (err) {
      console.error('[EvidenceService] Blockchain anchoring failed:', err);
    }

    const evidencePackage: EvidencePackage = {
      caseId,
      evidenceId,
      callId: params.callId,
      originalAudioHash,
      transcriptHash,
      analysisHash,
      reportHash,
      manifestHash,
      manifest,
      createdAt,
      investigator: params.investigator,
      blockchainAnchorId,
      status: 'created',
      peerUsername: params.peerUsername,
      callDuration: params.callDuration,
      riskLevel: params.riskLevel,
      spoofScore: params.spoofScore,
      speakerMatch: params.speakerMatch,
    };

    this.packages.set(caseId, evidencePackage);

    // Log to provenance
    provenanceStore.logEvent({
      artifactId: caseId,
      artifactType: 'evidence',
      action: 'EVIDENCE_CREATED',
      actor: params.investigator,
      hash: manifestHash,
      metadata: { peerUsername: params.peerUsername, riskLevel: params.riskLevel },
    }).catch(err => console.error('[EvidenceService] Failed to log provenance:', err));

    return evidencePackage;
  }

  async generateForensicReport(caseId: string): Promise<ForensicReport> {
    const pkg = this.packages.get(caseId);
    if (!pkg) throw new Error(`Evidence package ${caseId} not found`);

    const models = modelRegistry.getModels();
    const primaryModel = models.find(m => m.modelId === 'mod_bara_cae') || models[0];

    const reportId = `RPT-${caseId}`;
    const generatedAt = Date.now();

    const report: ForensicReport = {
      reportId,
      caseId,
      generatedAt,
      investigator: pkg.investigator,
      evidence: {
        evidenceId: pkg.evidenceId,
        sha256: pkg.originalAudioHash,
        fileSize: 0,
        source: `VoIP Call — ${pkg.peerUsername || 'Unknown'}`,
        timestamp: pkg.createdAt,
      },
      aiAnalysis: {
        spoofScore: pkg.spoofScore || 0,
        spoofVerdict: pkg.spoofScore && pkg.spoofScore > 30 ? 'FAKE' : 'REAL',
        speakerVerification: pkg.speakerMatch || 'Unknown',
        speakerSimilarity: 0,
        intentCategory: 'Voice Call',
        riskScore: 0,
        riskLevel: pkg.riskLevel || 'LOW',
      },
      modelProvenance: {
        modelId: primaryModel?.modelId || 'mod_bara_cae',
        modelVersion: primaryModel?.version || '2.1',
        modelHash: primaryModel?.sha256 || 'n/a',
        framework: primaryModel?.framework || 'web-audio-dsp',
      },
      integrityStatus: {
        evidenceVerified: pkg.status !== 'tampered',
        modelVerified: !!primaryModel,
        inferenceVerified: true,
        reportVerified: true,
        blockchainAnchored: !!pkg.blockchainAnchorId,
      },
      reportHash: pkg.reportHash,
    };

    this.reports.set(caseId, report);

    provenanceStore.logEvent({
      artifactId: reportId,
      artifactType: 'report',
      action: 'REPORT_GENERATED',
      actor: pkg.investigator,
      parentArtifactId: caseId,
      hash: pkg.reportHash,
    }).catch(() => {});

    return report;
  }

  async verifyEvidencePackage(caseId: string): Promise<VerificationChecklist> {
    const pkg = this.packages.get(caseId);
    if (!pkg) throw new Error(`Evidence package ${caseId} not found`);

    const origHashes = this.originalHashes.get(caseId);
    if (!origHashes) throw new Error(`No original hashes found for case ${caseId}`);

    const now = Date.now();

    const makeResult = (
      artifactType: VerificationResult['artifactType'],
      artifactId: string,
      expectedHash: string,
      actualHash: string
    ): VerificationResult => ({
      artifactId,
      artifactType,
      expectedHash,
      actualHash,
      verified: expectedHash === actualHash,
      checkedAt: now,
    });

    // Re-hash the manifest to check for tampering
    const manifestForHashing = { ...pkg.manifest, manifestHash: undefined };
    const recomputedManifestHash = await integrityEngine.hashData(JSON.stringify(manifestForHashing));

    // Check blockchain
    let chainValid = false;
    try {
      const chainVerification = await blockchainService.verifyChain();
      chainValid = chainVerification.valid;
    } catch (_) {}

    const results: VerificationResult[] = [
      makeResult('evidence', `${caseId}/audio`, origHashes.audio, pkg.originalAudioHash),
      makeResult('evidence', `${caseId}/transcript`, origHashes.transcript, pkg.transcriptHash),
      makeResult('evidence', `${caseId}/analysis`, origHashes.analysis, pkg.analysisHash),
      makeResult('report', `${caseId}/report`, origHashes.report, pkg.reportHash),
      makeResult('evidence', `${caseId}/manifest`, pkg.manifestHash, recomputedManifestHash),
      makeResult('blockchain', `${caseId}/chain`, 'valid', chainValid ? 'valid' : 'invalid'),
    ];

    const allPassed = results.every(r => r.verified);

    // Update package status
    pkg.status = allPassed ? 'verified' : 'tampered';

    return { caseId, results, allPassed, checkedAt: now };
  }

  async tamperEvidence(caseId: string, component: 'audio' | 'transcript' | 'analysis' | 'report'): Promise<void> {
    const pkg = this.packages.get(caseId);
    if (!pkg) return;

    const fakeHash = await integrityEngine.hashData('tampered_data_' + Date.now());

    if (component === 'audio') pkg.originalAudioHash = fakeHash;
    else if (component === 'transcript') pkg.transcriptHash = fakeHash;
    else if (component === 'analysis') pkg.analysisHash = fakeHash;
    else if (component === 'report') pkg.reportHash = fakeHash;

    pkg.status = 'tampered';

    provenanceStore.logEvent({
      artifactId: caseId,
      artifactType: 'evidence',
      action: 'EVIDENCE_TAMPERED',
      actor: 'Demo_Attacker',
      hash: fakeHash,
      metadata: { component },
    }).catch(() => {});
  }

  async restoreEvidence(caseId: string): Promise<void> {
    const pkg = this.packages.get(caseId);
    const orig = this.originalHashes.get(caseId);
    if (!pkg || !orig) return;

    pkg.originalAudioHash = orig.audio;
    pkg.transcriptHash = orig.transcript;
    pkg.analysisHash = orig.analysis;
    pkg.reportHash = orig.report;
    pkg.status = 'created';

    provenanceStore.logEvent({
      artifactId: caseId,
      artifactType: 'evidence',
      action: 'EVIDENCE_VERIFIED',
      actor: 'Admin',
      hash: pkg.manifestHash,
      metadata: { description: 'Restored to original hashes' },
    }).catch(() => {});
  }

  getPackages(): EvidencePackage[] {
    return Array.from(this.packages.values());
  }

  getPackage(caseId: string): EvidencePackage | undefined {
    return this.packages.get(caseId);
  }

  getReport(caseId: string): ForensicReport | undefined {
    return this.reports.get(caseId);
  }

  getReports(): ForensicReport[] {
    return Array.from(this.reports.values());
  }
}

export const evidenceService = new EvidenceService();
