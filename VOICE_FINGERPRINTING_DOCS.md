# In-Depth Guide: Voice Fingerprinting & Deepfake Detection

Swaraksha implements a highly sophisticated, real-time Voice Fingerprinting and AI Deepfake Detection engine. The system operates directly on the device (both in the browser via Web Audio API and on mobile via TensorFlow Lite) to ensure privacy and low latency.

Below is an in-depth explanation of the technologies used, the mathematical concepts applied, and the actual codebase logic.

---

## 1. Technologies Used

* **Web Audio API (`AudioContext`)**: Used to capture raw PCM (Pulse-Code Modulation) audio streams directly from the microphone at 16kHz or 48kHz.
* **Digital Signal Processing (DSP)**: Custom algorithms perform Autocorrelation (Pitch), Fast Fourier Transforms (FFT/Spectrograms), and Mel-Filterbank generation.
* **Vector Embeddings & L2 Normalization**: Acoustic characteristics are mapped into a 128-dimensional mathematical vector.
* **Cosine Similarity**: Used to compare live audio embeddings against saved profiles to determine identity matches.
* **TensorFlow Lite (TFLite)**: In the Flutter mobile app, an on-device Neural Autoencoder model (`bara_denoising_cae.tflite`) is used to detect synthetic/AI voices.

---

## 2. Acoustic Feature Extraction (How Voices are Analyzed)

When a voice is recorded, raw PCM audio buffers are analyzed in `RealAudioEngine.ts`. The system extracts distinct features to build a unique 128-dimensional embedding.

### A. Pitch (F0) & Autocorrelation
The fundamental frequency (pitch) of the voice is calculated using a **Normalized Autocorrelation algorithm**. It measures how well the audio waveform correlates with a delayed version of itself.

```typescript
// From src/services/realAudioEngine.ts
public static computePitch(buffer: Float32Array, sampleRate: number): { pitchHz: number; voicedConfidence: number } {
  const minFreq = 70; // Low human pitch (bass)
  const maxFreq = 400; // High human pitch (soprano/child)
  const maxLag = Math.floor(sampleRate / minFreq);
  const minLag = Math.floor(sampleRate / maxFreq);
  
  let bestLag = -1;
  let maxCorr = -1;
  let energy = 0;

  for (let i = 0; i < maxLag; i++) energy += buffer[i] * buffer[i];

  // Normalized Autocorrelation Loop
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0, lagEnergy = 0;
    for (let i = 0; i < maxLag; i++) {
      corr += buffer[i] * buffer[i + lag];
      lagEnergy += buffer[i + lag] * buffer[i + lag];
    }
    const normCorr = corr / (Math.sqrt(energy * lagEnergy) || 1);
    if (normCorr > maxCorr) {
      maxCorr = normCorr;
      bestLag = lag;
    }
  }

  return (bestLag > 0 && maxCorr > 0.45) 
    ? { pitchHz: sampleRate / bestLag, voicedConfidence: maxCorr }
    : { pitchHz: 0, voicedConfidence: 0 };
}
```

### B. Pitch Jitter (Deepfake Resistance)
Natural human vocal cords exhibit micro-fluctuations (0.5% - 1.8% jitter). AI voice clones often have unnaturally stable pitches. The system measures this cycle-to-cycle perturbation.

```typescript
// Computes cycle-to-cycle pitch perturbation
let diffSum = 0;
let pitchSum = 0;
for (let i = 1; i < pitches.length; i++) {
  diffSum += Math.abs(pitches[i] - pitches[i - 1]);
  pitchSum += pitches[i];
}
const meanPitch = pitchSum / pitches.length;
const jitterPercent = ((diffSum / (pitches.length - 1)) / meanPitch) * 100;
```

### C. Creating the 128-Dimensional Embedding
The system computes a 32-band Mel-Scale Filterbank (mimicking human hearing ranges), Spectral Centroid (center of mass), and Formants (F1, F2). These are packed into an array and **L2-Normalized** so that it sits on a unit hypersphere, making it perfect for Cosine Similarity.

```typescript
// From src/services/realAudioEngine.ts
const embedding: number[] = new Array(128).fill(0);

// [0..31]: 32 Mel filterbank log energies
for (let i = 0; i < 32; i++) embedding[i] = mel32[i];

// [32..39]: Pitch, Jitter, Centroid, Rolloff, Formants
embedding[32] = pitchHz > 0 ? (pitchHz - 70) / 330 : 0.3;
embedding[33] = voicedConfidence;
embedding[34] = Math.min(1, jitter / 4);
embedding[35] = centroid / 256;
// ...

// L2 Normalization
let normSq = 0;
for (let i = 0; i < embedding.length; i++) {
  normSq += embedding[i] * embedding[i];
}
const norm = Math.sqrt(normSq) || 1;
return embedding.map((v) => Number((v / norm).toFixed(6)));
```

---

## 3. How Particular Voices are Compared (Identification)

During an active phone call, the incoming audio is chunked every 500ms. A live embedding is extracted and compared against the saved profile using **Cosine Similarity**. 

### The Cosine Similarity Math
Cosine similarity measures the cosine of the angle between two multi-dimensional vectors. A result of `1.0` means they point in the exact same direction (perfect match).

```typescript
// From src/services/securityCrypto.ts
static cosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length || v1.length === 0) return 0;
  
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  
  // Clamps the dot product between -1.0 and 1.0, then maps to a 0.0 - 1.0 percentage scale
  const clamped = Math.max(-1, Math.min(1, dot));
  return (clamped + 1) / 2;
}
```

### Verification Logic & Thresholds
The `SpeakerVerificationEngine.ts` uses this score to label the voice status.

```typescript
// From src/services/speakerVerificationEngine.ts
const rawSimilarity = SecurityCrypto.cosineSimilarity(
  expectedProfile.embedding,
  liveEmbedding
);

// Dynamic calibration thresholds
if (rawSimilarity >= 0.78) {
  status = 'match';
  statusLabel = 'Voice matches saved contact';
} else if (rawSimilarity >= 0.58) {
  status = 'possibleMismatch';
  statusLabel = 'Possible speaker mismatch';
} else {
  status = 'unknown';
  statusLabel = 'Unknown speaker';
}
```

The system also tracks **Sudden Speaker Changes**. If the `rawSimilarity` suddenly shifts by a distance of `0.35` between two 500ms chunks, it alerts the user that a secondary person (or an attacker) has taken over the microphone.

---

## 4. Deepfake / Synthetic Voice Detection

Swaraksha detects AI voice cloning using an Autoencoder network.

### A. The Theory (BARA Autoencoder)
An Autoencoder is a neural network trained only on real, human voices. When you pass a real human voice through it, it easily compresses and reconstructs the audio.
However, when you pass an AI-generated voice, the synthetic artifacts (which the model has never seen) cause the reconstruction to fail. The **Mean Squared Error (MSE)** of the reconstruction spikes.

### B. Flutter App TFLite Implementation
In the mobile app, it runs a real TensorFlow Lite inference on 4-second Gammatone spectrogram chunks.

```dart
// From flutter_app/lib/services/deepfake/deepfake_model_service.dart
final input = features.reshape([1, 64, 400, 1]);
_interpreter!.run(input, output);

double sumSquaredError = 0.0;
int count = 0;

for (int c = 0; c < 64; c++) {
  for (int t = 0; t < 400; t++) {
    final original = input[0][c][t][0];
    final reconstructed = output[0][c][t][0];
    final diff = original - reconstructed;
    sumSquaredError += diff * diff;
    count++;
  }
}
final mse = sumSquaredError / max(1, count);

// Threshold check
return ChunkResult(
  mse: mse,
  isFake: mse > 32.0, // If MSE > 32.0, it's flagged as a Deepfake
);
```

### C. Sliding Window Verdict
A single anomaly could just be background noise. To prevent false positives, `DeepfakeService.ts` maintains a sliding window of recent chunks. It requires a specific ratio of consecutive "Fake" chunks before alerting the user, ensuring highly accurate detections.
