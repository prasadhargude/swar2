import { RegisteredModel, DatasetRecord, ModelApprovalStatus } from '../types/integrity';
import { integrityEngine } from './integrityEngine';
import { provenanceStore } from './provenanceStore';

export class ModelRegistry {
  private models: Map<string, RegisteredModel> = new Map();
  private datasets: Map<string, DatasetRecord> = new Map();
  private originalHashes: Map<string, string> = new Map();
  private keyPair: { publicKey: string; privateKey: CryptoKey } | null = null;

  async initialize(): Promise<void> {
    this.keyPair = await integrityEngine.generateKeyPair();

    // Seed datasets
    const datasetsToSeed = [
      { datasetId: 'ds_asvspoof', name: 'ASVspoof2019-LA', version: '2019', contributor: 'NII Japan', sampleCount: 121461 },
      { datasetId: 'ds_voxceleb2', name: 'VoxCeleb2', version: '2.0', contributor: 'University of Oxford', sampleCount: 1092009 },
      { datasetId: 'ds_coco', name: 'COCO-2017', version: '2017', contributor: 'Microsoft Research', sampleCount: 330000 },
    ];

    for (const ds of datasetsToSeed) {
      await this.registerDataset(ds);
    }

    // Seed models
    const modelsToSeed: Omit<RegisteredModel, 'sha256' | 'signature' | 'createdAt'>[] = [
      {
        modelId: 'mod_bara_cae',
        name: 'BARA-CAE',
        version: '2.1',
        description: 'BARA Convolutional Autoencoder for voice deepfake detection',
        framework: 'web-audio-dsp',
        trainingDatasetId: 'ds_asvspoof',
        creator: 'Warriors-X',
        approvalStatus: 'approved',
      },
      {
        modelId: 'mod_vision_yolo',
        name: 'Vision-YOLO',
        version: '1.3',
        description: 'Object detection model for visual forensics',
        framework: 'onnx',
        trainingDatasetId: 'ds_coco',
        creator: 'Warriors-X',
        approvalStatus: 'approved',
      },
      {
        modelId: 'mod_whisper_stt',
        name: 'Whisper-STT',
        version: '1.0',
        description: 'Multilingual speech-to-text for Hindi/Marathi/English',
        framework: 'pytorch',
        trainingDatasetId: 'ds_voxceleb2',
        creator: 'Warriors-X',
        approvalStatus: 'approved',
      },
      {
        modelId: 'mod_speakernet',
        name: 'SpeakerNet',
        version: '1.2',
        description: 'ECAPA-TDNN speaker embedding extractor',
        framework: 'pytorch',
        trainingDatasetId: 'ds_voxceleb2',
        creator: 'Warriors-X',
        approvalStatus: 'approved',
      },
    ];

    for (const m of modelsToSeed) {
      await this.registerModel(m);
    }
  }

  async registerModel(model: Omit<RegisteredModel, 'sha256' | 'signature' | 'createdAt'>): Promise<RegisteredModel> {
    if (!this.keyPair) {
      this.keyPair = await integrityEngine.generateKeyPair();
    }

    const modelDataString = JSON.stringify({
      name: model.name,
      version: model.version,
      framework: model.framework,
      description: model.description,
    });
    const sha256 = await integrityEngine.hashData(modelDataString);
    const signature = await integrityEngine.signHash(sha256, this.keyPair.privateKey);

    const fullModel: RegisteredModel = {
      ...model,
      sha256,
      signature,
      createdAt: Date.now(),
    };

    this.models.set(model.modelId, fullModel);
    this.originalHashes.set(model.modelId, sha256);

    await provenanceStore.logEvent({
      artifactId: model.modelId,
      artifactType: 'model',
      action: 'MODEL_REGISTERED',
      actor: model.creator,
      parentArtifactId: model.trainingDatasetId,
      hash: sha256,
      details: { name: model.name, sha256 },
    });

    return fullModel;
  }

  async verifyModel(modelId: string): Promise<{ verified: boolean; expectedHash: string; actualHash: string }> {
    if (!this.keyPair) throw new Error('Registry not initialized');

    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const modelDataString = JSON.stringify({
      name: model.name,
      version: model.version,
      framework: model.framework,
      description: model.description,
    });
    const actualHash = await integrityEngine.hashData(modelDataString);
    const expectedHash = model.sha256;
    const signatureValid = await integrityEngine.verifySignature(expectedHash, model.signature, this.keyPair.publicKey);
    const verified = signatureValid && actualHash === expectedHash;

    return { verified, expectedHash, actualHash };
  }

  async tamperModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    if (!this.originalHashes.has(modelId)) {
      this.originalHashes.set(modelId, model.sha256);
    }

    const fakeHash = await integrityEngine.hashData(model.sha256 + '_tampered_' + Date.now());
    model.sha256 = fakeHash;

    await provenanceStore.logEvent({
      artifactId: modelId,
      artifactType: 'model',
      action: 'MODEL_TAMPERED',
      actor: 'Demo_Attacker',
      hash: fakeHash,
      details: { name: model.name, note: 'Hash tampered for demo' },
    });
  }

  async restoreModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const originalHash = this.originalHashes.get(modelId);
    if (originalHash) {
      model.sha256 = originalHash;
      await provenanceStore.logEvent({
        artifactId: modelId,
        artifactType: 'model',
        action: 'MODEL_VERIFIED',
        actor: 'Admin',
        hash: originalHash,
        details: { name: model.name, note: 'Model integrity restored' },
      });
    }
  }

  getModels(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  getModel(modelId: string): RegisteredModel | undefined {
    return this.models.get(modelId);
  }

  async registerDataset(dataset: Omit<DatasetRecord, 'sha256' | 'signature' | 'createdAt'>): Promise<DatasetRecord> {
    if (!this.keyPair) {
      this.keyPair = await integrityEngine.generateKeyPair();
    }

    const dataString = JSON.stringify({ name: dataset.name, contributor: dataset.contributor, version: dataset.version });
    const sha256 = await integrityEngine.hashData(dataString);
    const signature = await integrityEngine.signHash(sha256, this.keyPair.privateKey);

    const fullDataset: DatasetRecord = {
      ...dataset,
      sha256,
      signature,
      createdAt: Date.now(),
    };

    this.datasets.set(dataset.datasetId, fullDataset);

    await provenanceStore.logEvent({
      artifactId: dataset.datasetId,
      artifactType: 'dataset',
      action: 'DATA_UPLOADED',
      actor: dataset.contributor || 'Unknown',
      hash: sha256,
      details: { name: dataset.name, sha256 },
    });

    return fullDataset;
  }

  getDatasets(): DatasetRecord[] {
    return Array.from(this.datasets.values());
  }

  async getModelLineage(modelId: string): Promise<{ dataset?: DatasetRecord; model: RegisteredModel }> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const lineage: { dataset?: DatasetRecord; model: RegisteredModel } = { model };
    if (model.trainingDatasetId) {
      lineage.dataset = this.datasets.get(model.trainingDatasetId);
    }
    return lineage;
  }
}

export const modelRegistry = new ModelRegistry();
