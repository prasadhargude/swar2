import { ProvenanceEvent, ProvenanceAction, ProvenanceArtifactType, ProvenanceNode } from '../types/integrity';

export class ProvenanceStore {
  private dbName = 'swaraksha_provenance';
  private storeName = 'events';
  private dbVersion = 1;

  /**
   * Opens or creates the IndexedDB database
   */
  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'eventId' });
          store.createIndex('artifactId', 'artifactId', { unique: false });
          store.createIndex('artifactType', 'artifactType', { unique: false });
          store.createIndex('action', 'action', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Logs an immutable provenance event
   */
  async logEvent(event: Omit<ProvenanceEvent, 'eventId' | 'timestamp'>): Promise<ProvenanceEvent> {
    const db = await this.getDB();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    
    const fullEvent: ProvenanceEvent = {
      ...event,
      eventId: `evt_${timestamp}_${random}`,
      timestamp
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add(fullEvent);
      
      request.onsuccess = () => resolve(fullEvent);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets full audit trail, optionally filtered
   */
  async getAuditTrail(filters?: { artifactType?: ProvenanceArtifactType; action?: ProvenanceAction; limit?: number }): Promise<ProvenanceEvent[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        let events: ProvenanceEvent[] = request.result;
        
        if (filters) {
          if (filters.artifactType) {
            events = events.filter(e => e.artifactType === filters.artifactType);
          }
          if (filters.action) {
            events = events.filter(e => e.action === filters.action);
          }
        }
        
        events.sort((a, b) => b.timestamp - a.timestamp); // Sort descending
        
        if (filters?.limit && filters.limit > 0) {
          events = events.slice(0, filters.limit);
        }
        
        resolve(events);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets lineage chain for a specific artifact
   */
  async getLineage(artifactId: string): Promise<ProvenanceEvent[]> {
    const events = await this.getEventsForArtifact(artifactId);
    
    // Find the creation or first event that might have a parent
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    if (sortedEvents.length === 0) return [];
    
    const firstEvent = sortedEvents[0];
    let lineage = [...sortedEvents];
    
    if (firstEvent.parentArtifactId) {
      const parentLineage = await this.getLineage(firstEvent.parentArtifactId);
      lineage = [...parentLineage, ...lineage];
    }
    
    return lineage;
  }

  /**
   * Builds provenance graph from a root artifact
   */
  async buildProvenanceGraph(rootArtifactId: string): Promise<ProvenanceNode> {
    const events = await this.getEventsForArtifact(rootArtifactId);
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    
    const firstEvent = sortedEvents.length > 0 ? sortedEvents[0] : null;
    
    const node: ProvenanceNode = {
      id: rootArtifactId,
      type: firstEvent?.artifactType || ('unknown' as any),
      label: firstEvent?.details?.name || rootArtifactId,
      timestamp: firstEvent?.timestamp || Date.now(),
      children: []
    };
    
    // Find children by searching for events where parentArtifactId is rootArtifactId
    const allEvents = await this.getAuditTrail();
    const childrenIds = new Set(
      allEvents
        .filter(e => e.parentArtifactId === rootArtifactId)
        .map(e => e.artifactId)
    );
    
    for (const childId of childrenIds) {
      if (childId !== rootArtifactId) {
        const childNode = await this.buildProvenanceGraph(childId);
        node.children!.push(childNode);
      }
    }
    
    return node;
  }

  /**
   * Gets events for a specific artifact
   */
  async getEventsForArtifact(artifactId: string): Promise<ProvenanceEvent[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('artifactId');
      
      const request = index.getAll(artifactId);
      
      request.onsuccess = () => resolve(request.result.sort((a: ProvenanceEvent, b: ProvenanceEvent) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all events (for testing)
   */
  async clearAll(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const provenanceStore = new ProvenanceStore();
