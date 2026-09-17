import { VisionAnalysisResult, VisionDetection, InferenceRecord, RegisteredModel } from '../types/integrity';
import { integrityEngine } from './integrityEngine';
import { inferenceRecorder } from './inferenceRecorder';
import { modelRegistry } from './modelRegistry';
import { provenanceStore } from './provenanceStore';

export class VisionAdapter {
  private readonly MODEL_ID = 'VISION-YOLO-v1.3';
  private readonly OBJECT_CLASSES = [
    'Vehicle', 'Person', 'Document', 'Electronic Device', 
    'Building', 'License Plate', 'Surveillance Camera', 'Package'
  ];

  /**
   * Retrieves the vision model information from the model registry.
   * @returns {RegisteredModel | undefined} The registered vision model or undefined if not found.
   */
  getVisionModel(): RegisteredModel | undefined {
    return modelRegistry.getModel(this.MODEL_ID);
  }

  /**
   * Analyzes an image with simulated detection and passes results through the integrity pipeline.
   * @param {Blob} imageBlob - The input image to analyze.
   * @returns {Promise<VisionAnalysisResult>} The analysis result with integrity metadata.
   */
  async analyzeImage(imageBlob: Blob): Promise<VisionAnalysisResult> {
    const timestamp = Date.now();
    
    // 1. Hash the input image blob
    const imageBuffer = await imageBlob.arrayBuffer();
    const inputHash = await integrityEngine.hashData(imageBuffer);

    // 2. Get the vision model info from registry
    const model = this.getVisionModel();
    const modelHash = model ? model.hash : 'unknown-model-hash';

    // 3. Generate 2-5 simulated detections based on image size (simulated dimensions)
    const numDetections = Math.floor(Math.random() * 4) + 2; // 2 to 5
    const imageWidth = 1920; // Simulated default
    const imageHeight = 1080; // Simulated default
    const detections: VisionDetection[] = [];

    for (let i = 0; i < numDetections; i++) {
      const classIndex = Math.floor(Math.random() * this.OBJECT_CLASSES.length);
      const confidence = 0.75 + Math.random() * 0.23; // 0.75 to 0.98
      
      const width = Math.floor(Math.random() * 300) + 50;
      const height = Math.floor(Math.random() * 300) + 50;
      const x = Math.floor(Math.random() * (imageWidth - width));
      const y = Math.floor(Math.random() * (imageHeight - height));

      detections.push({
        label: this.OBJECT_CLASSES[classIndex],
        confidence,
        boundingBox: { x, y, width, height }
      });
    }

    // 4. Record inference via inferenceRecorder
    const inferenceResult = {
      detections,
      imageWidth,
      imageHeight
    };

    const inferenceRecord: InferenceRecord = await inferenceRecorder.recordInference(
      inputHash,
      this.MODEL_ID,
      modelHash,
      inferenceResult
    );

    // 5. Sign the full result
    const resultToSign = {
      inferenceRecord,
      timestamp,
      type: 'vision_analysis'
    };
    
    const signature = await integrityEngine.signData(JSON.stringify(resultToSign));

    // 6. Log VISION_INFERENCE provenance event
    await provenanceStore.logEvent({
      eventType: 'VISION_INFERENCE',
      timestamp,
      resourceId: inputHash,
      actor: 'system',
      details: `Vision inference completed with ${detections.length} detections`,
      signature
    });

    // 7. Return VisionAnalysisResult with full integrity metadata
    return {
      detections,
      imageWidth,
      imageHeight,
      inferenceRecord,
      signature,
      timestamp,
      modelId: this.MODEL_ID
    };
  }
}

export const visionAdapter = new VisionAdapter();
