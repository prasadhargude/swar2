// Helper to convert buffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to convert hex string to buffer
function hexToBuffer(hex: string): ArrayBuffer {
  const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi)?.map(h => parseInt(h, 16)) || []);
  return typedArray.buffer;
}

export class IntegrityEngine {
  /**
   * Generates a SHA-256 hash of any string or ArrayBuffer
   */
  async hashData(data: string | ArrayBuffer): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return bufferToHex(hashBuffer);
  }

  /**
   * Generates an ECDSA P-256 key pair
   */
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: CryptoKey }> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return {
      publicKey: JSON.stringify(publicKeyJwk),
      privateKey: keyPair.privateKey
    };
  }

  /**
   * Signs a hash using the provided ECDSA private key
   */
  async signHash(hash: string, privateKey: CryptoKey): Promise<string> {
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      hexToBuffer(hash)
    );
    return bufferToHex(signatureBuffer);
  }

  /**
   * Verifies a signature against the provided public key (in JWK format)
   */
  async verifySignature(hash: string, signature: string, publicKeyJwk: string): Promise<boolean> {
    const jwk = JSON.parse(publicKeyJwk);
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      hexToBuffer(signature),
      hexToBuffer(hash)
    );
  }

  /**
   * Creates an evidence manifest from multiple artifact hashes
   */
  async createManifest(artifacts: { name: string; hash: string }[]): Promise<{ manifest: string; manifestHash: string }> {
    const manifestObj = {
      timestamp: new Date().toISOString(),
      artifacts: artifacts.sort((a, b) => a.name.localeCompare(b.name))
    };
    
    const manifest = JSON.stringify(manifestObj, null, 2);
    const manifestHash = await this.hashData(manifest);
    
    return { manifest, manifestHash };
  }

  /**
   * Builds a Merkle tree from an array of hashes and returns the root hash
   */
  async buildMerkleRoot(hashes: string[]): Promise<string> {
    if (!hashes || hashes.length === 0) {
      return await this.hashData('');
    }
    
    if (hashes.length === 1) {
      return hashes[0];
    }
    
    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Duplicate last if odd
      const combinedHash = await this.hashData(left + right);
      nextLevel.push(combinedHash);
    }
    
    return this.buildMerkleRoot(nextLevel);
  }
}

export const integrityEngine = new IntegrityEngine();
