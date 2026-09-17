# ============================================
# Complete Audio Deepfake Test (BARA + AE)
# Chunk-wise Analysis
# ============================================

import numpy as np
import librosa
import torch
import torch.nn as nn
from gammatone.gtgram import gtgram
import matplotlib.pyplot as plt


# --------------------
# CONFIG (MUST MATCH TRAINING)
# --------------------

SR = 16000
CHANNELS = 64
WIN_TIME = 0.025
HOP_TIME = 0.010
MAX_FRAMES = 400

# 400 frames × 10 ms ≈ 4 seconds
CHUNK_SECONDS = 4.0

# 50% overlap
OVERLAP = 0.50

MODEL_PATH = "bara_denoising_cae.pt"
REAL_ERRORS_PATH = "real_errors.npy"

AUDIO_PATH = "pruthviraj-real.mp3"


# --------------------
# DEVICE
# --------------------

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else
    "mps" if torch.backends.mps.is_available() else
    "cpu"
)

print("Using device:", DEVICE)


# ============================================================
# BARA FEATURE EXTRACTION
# ============================================================

def bara_features_full(path):

    y, _ = librosa.load(path, sr=SR)

    # Normalize audio
    y = y / (np.max(np.abs(y)) + 1e-9)

    # Gammatone filterbank
    g = gtgram(
        y,
        SR,
        WIN_TIME,
        HOP_TIME,
        CHANNELS,
        50
    )

    # Log compression
    g = np.log(g + 1e-6)

    return g.astype(np.float32)


# ============================================================
# MASKED RECONSTRUCTION ERROR
# ============================================================

def masked_mse(recon, x):

    mask = (x != 0).float()

    return (
        torch.sum(((recon - x) ** 2) * mask)
        / torch.sum(mask)
    )


# ============================================================
# BOTTLENECK AUTOENCODER
# MUST MATCH TRAINING
# ============================================================

class CAE(nn.Module):

    def __init__(self):

        super().__init__()

        self.encoder = nn.Sequential(

            nn.Conv2d(1, 16, 3, 2, 1),
            nn.ReLU(),
            nn.Dropout2d(0.2),

            nn.Conv2d(16, 32, 3, 2, 1),
            nn.ReLU(),
            nn.Dropout2d(0.2),

            nn.Conv2d(32, 64, 3, 2, 1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(

            nn.ConvTranspose2d(
                64, 32, 3, 2, 1, 1
            ),
            nn.ReLU(),

            nn.ConvTranspose2d(
                32, 16, 3, 2, 1, 1
            ),
            nn.ReLU(),

            nn.ConvTranspose2d(
                16, 1, 3, 2, 1, 1
            )
        )

    def forward(self, x):

        return self.decoder(
            self.encoder(x)
        )


# ============================================================
# LOAD MODEL
# ============================================================

model = CAE().to(DEVICE)

model.load_state_dict(
    torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )
)

model.eval()


# ============================================================
# LOAD THRESHOLD
# ============================================================

real_errors = np.load(
    REAL_ERRORS_PATH
)

THRESHOLD = np.percentile(
    real_errors,
    97
)

print("Threshold:", THRESHOLD)


# ============================================================
# CHUNK-WISE COMPLETE AUDIO ANALYSIS
# ============================================================

def analyze_complete_audio(path):

    print("\nExtracting BARA features...")

    g = bara_features_full(path)

    total_frames = g.shape[1]

    print("Total BARA frames:", total_frames)

    # 400 frames ≈ 4 seconds
    chunk_frames = MAX_FRAMES

    # 50% overlap
    hop_frames = int(
        chunk_frames * (1 - OVERLAP)
    )

    print(
        f"Chunk size: {chunk_frames} frames "
        f"(~{CHUNK_SECONDS:.1f}s)"
    )

    print(
        f"Chunk hop: {hop_frames} frames "
        f"(~{hop_frames * HOP_TIME:.2f}s)"
    )

    errors = []

    chunk_info = []

    start = 0
    chunk_number = 1

    while start < total_frames:

        end = start + chunk_frames

        chunk = g[:, start:end]

        # ------------------------------------------------
        # Padding only for final chunk
        # ------------------------------------------------

        original_frames = chunk.shape[1]

        if original_frames < chunk_frames:

            chunk = np.pad(
                chunk,
                (
                    (0, 0),
                    (0, chunk_frames - original_frames)
                )
            )

        # ------------------------------------------------
        # Convert to tensor
        # ------------------------------------------------

        x = torch.tensor(
            chunk,
            dtype=torch.float32
        ).unsqueeze(0).unsqueeze(0).to(DEVICE)

        # ------------------------------------------------
        # Reconstruction
        # ------------------------------------------------

        with torch.no_grad():

            recon = model(x)

            error = masked_mse(
                recon,
                x
            ).item()

        # ------------------------------------------------
        # Time information
        # ------------------------------------------------

        start_time = start * HOP_TIME

        end_time = min(
            end * HOP_TIME,
            total_frames * HOP_TIME
        )

        is_fake = error > THRESHOLD

        errors.append(error)

        chunk_info.append({
            "chunk": chunk_number,
            "start": start_time,
            "end": end_time,
            "error": error,
            "prediction": "FAKE" if is_fake else "REAL"
        })

        print(
            f"Chunk {chunk_number:02d} | "
            f"{start_time:6.2f}s - {end_time:6.2f}s | "
            f"Error: {error:.6f} | "
            f"{'FAKE' if is_fake else 'REAL'}"
        )

        # ------------------------------------------------
        # Stop after final chunk
        # ------------------------------------------------

        if end >= total_frames:
            break

        start += hop_frames
        chunk_number += 1

    return errors, chunk_info


# ============================================================
# RUN COMPLETE AUDIO ANALYSIS
# ============================================================

errors, chunk_info = analyze_complete_audio(
    AUDIO_PATH
)


# ============================================================
# FILE-LEVEL DECISION
# ============================================================

fake_chunks = sum(
    item["prediction"] == "FAKE"
    for item in chunk_info
)

total_chunks = len(chunk_info)

fake_ratio = fake_chunks / total_chunks

mean_error = np.mean(errors)
median_error = np.median(errors)
max_error = np.max(errors)


print("\n")
print("=" * 60)
print("COMPLETE AUDIO RESULT")
print("=" * 60)

print(
    f"Total chunks : {total_chunks}"
)

print(
    f"Fake chunks  : {fake_chunks}"
)

print(
    f"Fake ratio   : {fake_ratio * 100:.2f}%"
)

print(
    f"Mean error   : {mean_error:.6f}"
)

print(
    f"Median error : {median_error:.6f}"
)

print(
    f"Max error    : {max_error:.6f}"
)

print(
    f"Threshold    : {THRESHOLD:.6f}"
)


# ------------------------------------------------------------
# File-level rule
# ------------------------------------------------------------
#
# Starting rule:
# >50% of chunks must be classified as FAKE
#
# IMPORTANT:
# This 50% value should eventually be validated
# using your validation/test dataset.
# ------------------------------------------------------------

if fake_ratio > 0.50:

    final_prediction = "FAKE"

else:

    final_prediction = "REAL"


print("\nFINAL PREDICTION:", final_prediction)
print("=" * 60)


# ============================================================
# ERROR GRAPH
# ============================================================

chunk_numbers = [
    item["chunk"]
    for item in chunk_info
]

chunk_errors = [
    item["error"]
    for item in chunk_info
]


plt.figure(figsize=(14, 5))

plt.plot(
    chunk_numbers,
    chunk_errors,
    marker="o"
)

plt.axhline(
    THRESHOLD,
    linestyle="--",
    label="97th percentile threshold"
)

plt.xlabel("Audio Chunk")
plt.ylabel("Reconstruction Error")

plt.title(
    "Chunk-wise BARA Reconstruction Error"
)

plt.legend()

plt.tight_layout()

plt.savefig(
    "chunk_error_analysis.png",
    dpi=150
)

plt.close()


# ============================================================
# SAVE RESULTS
# ============================================================

np.save(
    "chunk_errors.npy",
    np.array(errors)
)

print(
    "\nSaved:"
)

print(
    "  chunk_error_analysis.png"
)

print(
    "  chunk_errors.npy"
)