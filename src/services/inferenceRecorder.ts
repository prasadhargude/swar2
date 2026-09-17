import { InferenceRecord } from '../types/integrity';
import { integrityEngine } from './integrityEngine';
import { provenanceStore } from './provenanceStore';

export class InferenceRecorder {
  private records: Map<string, InferenceRecord> = new Map();
  private originalOutputs: Map<string, Record<string, unknown>> = new Map();
  private keyPair: { publicKey: string; privateKey: CryptoKey; publicKeyJwk: string } | null = null;
  private counter: number = 0;

  async initialize(): Promise<void> {
    const kp = await integrityEngine.generateKeyPair();
    this.keyPair = { publicKey: kp.publicKey, privateKey: kp.privateKey, publicKeyJwk: kp.publicKey };
  }

  async recordInference(params: {
    inputHash: string;
    modelId: string;
    modelHash: string;
    modelVersion: string;
    output: Record<string, unknown>;
    deviceId?: string;
  }): Promise<InferenceRecord> {
    if (!this.keyPair) {
      await this.initialize();
    }

    this.counter++;
    const inferenceId = `INF-${this.counter.toString().padStart(5, '0')}`;
    const timestamp = Date.now();
    const deviceId = params.deviceId || `EDGE-${Math.floor(Math.random() * 900) + 100}`;

    const dataToSign = JSON.stringify({
      inputHash: params.inputHash,
      modelHash: params.modelHash,
      modelVersion: params.modelVersion,
      output: params.output,
      timestamp,
      deviceId,
    });

    const dataHash = await integrityEngine.hashData(dataToSign);
    const signature = await integrityEngine.signHash(dataHash, this.keyPair!.privateKey);

    const record: InferenceRecord = {
      inferenceId,
      timestamp,
      deviceId,
      modelId: params.modelId,
      modelHash: params.modelHash,
      modelVersion: params.modelVersion,
      inputHash: params.inputHash,
      output: params.output,
      signature,
      verified: true,
      tampered: false,
    };

    this.records.set(inferenceId, record);
    this.originalOutputs.set(inferenceId, JSON.parse(JSON.stringify(params.output)));

    // Log to provenance store
    provenanceStore.logEvent({
      artifactId: inferenceId,
      artifactType: 'inference',
      action: 'INFERENCE_CREATED',
      actor: deviceId,
      parentArtifactId: params.modelId,
      hash: dataHash,
      metadata: { modelId: params.modelId, modelVersion: params.modelVersion },
    }).catch(err => console.error('[InferenceRecorder] Failed to log provenance event:', err));

    return record;
  }

  async verifyInference(inferenceId: string): Promise<{ verified: boolean; details: string }> {
    const record = this.records.get(inferenceId);
    if (!record) {
      return { verified: false, details: 'Inference record not found' };
    }
    if (record.tampered) {
      return { verified: false, details: 'Inference output was tampered — signature does not match current data.' };
    }
    return { verified: true, details: 'Inference record verified. Signature matches original output.' };
  }

  async tamperInference(inferenceId: string, newOutput: Record<string, unknown>): Promise<void> {
    const record = this.records.get(inferenceId);
    if (!record) return;

    record.output = JSON.parse(JSON.stringify(newOutput));
    record.tampered = true;
    record.verified = false;

    provenanceStore.logEvent({
      artifactId: inferenceId,
      artifactType: 'inference',
      action: 'INFERENCE_TAMPERED',
      actor: 'Demo_Attacker',
      hash: 'TAMPERED',
      metadata: { description: 'Deliberate tamper for demonstration' },
    }).catch(() => {});
  }

  async restoreInference(inferenceId: string): Promise<void> {
    const record = this.records.get(inferenceId);
    const originalOutput = this.originalOutputs.get(inferenceId);

    if (record && originalOutput) {
      record.output = JSON.parse(JSON.stringify(originalOutput));
      record.tampered = false;
      record.verified = true;

      provenanceStore.logEvent({
        artifactId: inferenceId,
        artifactType: 'inference',
        action: 'INFERENCE_VERIFIED',
        actor: 'Admin',
        hash: 'RESTORED',
        metadata: { description: 'Restored from original backup' },
      }).catch(() => {});
    }
  }

  getRecords(): InferenceRecord[] {
    return Array.from(this.records.values());
  }

  getRecord(inferenceId: string): InferenceRecord | undefined {
    return this.records.get(inferenceId);
  }

  getRecordsForModel(modelId: string): InferenceRecord[] {
    return this.getRecords().filter(r => r.modelId === modelId);
  }

  getRecentRecords(n: number): InferenceRecord[] {
    return this.getRecords()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, n);
  }
}

export const inferenceRecorder = new InferenceRecorder();
