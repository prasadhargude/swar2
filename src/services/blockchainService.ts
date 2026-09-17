import { BlockchainBlock, BlockchainAnchor } from '../types/integrity';
import { integrityEngine } from './integrityEngine';
import { provenanceStore } from './provenanceStore';

export class BlockchainService {
  private chain: BlockchainBlock[] = [];
  private anchors: Map<string, BlockchainAnchor> = new Map();

  async initialize(): Promise<void> {
    if (this.chain.length > 0) return;

    const timestamp = Date.now();
    const caseId = 'GENESIS';
    const manifestHash = '0'.repeat(64);
    const previousHash = '0'.repeat(64);
    const index = 0;

    let nonce = 0;
    let blockHash = '';

    while (true) {
      const data = `${index}${timestamp}${caseId}${manifestHash}${previousHash}${nonce}`;
      blockHash = await integrityEngine.hashData(data);
      if (blockHash.startsWith('00')) break;
      nonce++;
    }

    const genesisBlock: BlockchainBlock = {
      index,
      timestamp,
      caseId,
      manifestHash,
      previousHash,
      blockHash,
      nonce,
    };

    this.chain.push(genesisBlock);
  }

  async anchorHash(caseId: string, manifestHash: string): Promise<BlockchainAnchor> {
    if (this.chain.length === 0) {
      await this.initialize();
    }

    const previousBlock = this.chain[this.chain.length - 1];
    const index = previousBlock.index + 1;
    const timestamp = Date.now();
    const previousHash = previousBlock.blockHash;

    let nonce = 0;
    let blockHash = '';

    while (true) {
      const data = `${index}${timestamp}${caseId}${manifestHash}${previousHash}${nonce}`;
      blockHash = await integrityEngine.hashData(data);
      if (blockHash.startsWith('00')) break;
      nonce++;
    }

    const block: BlockchainBlock = {
      index,
      timestamp,
      caseId,
      manifestHash,
      previousHash,
      blockHash,
      nonce,
    };

    this.chain.push(block);

    const anchor: BlockchainAnchor = {
      caseId,
      blockIndex: index,
      blockHash,
      manifestHash,
      anchoredAt: timestamp,
      chainValid: true,
    };

    this.anchors.set(caseId, anchor);

    provenanceStore.logEvent({
      artifactId: caseId,
      artifactType: 'blockchain',
      action: 'BLOCKCHAIN_ANCHORED',
      actor: 'SYSTEM',
      hash: blockHash,
      metadata: { blockIndex: index, blockHash },
    }).catch(() => {});

    return anchor;
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: number }> {
    if (this.chain.length === 0) return { valid: true };

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.blockHash) {
        return { valid: false, brokenAt: i };
      }

      const data = `${currentBlock.index}${currentBlock.timestamp}${currentBlock.caseId}${currentBlock.manifestHash}${currentBlock.previousHash}${currentBlock.nonce}`;
      const recomputedHash = await integrityEngine.hashData(data);

      if (currentBlock.blockHash !== recomputedHash || !currentBlock.blockHash.startsWith('00')) {
        return { valid: false, brokenAt: i };
      }
    }

    return { valid: true };
  }

  getAnchor(caseId: string): BlockchainAnchor | undefined {
    return this.anchors.get(caseId);
  }

  getChain(): BlockchainBlock[] {
    return [...this.chain];
  }

  getChainLength(): number {
    return this.chain.length;
  }
}

export const blockchainService = new BlockchainService();
