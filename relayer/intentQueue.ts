// Intent queue management - Redis-backed or file-based queue
import fs from 'fs/promises';
import path from 'path';
import { SwapIntent } from './monitor';

export interface QueueConfig {
  type: 'file' | 'redis';
  filePath?: string;
  redisUrl?: string;
}

export class IntentQueueService {
  private config: QueueConfig;
  private queue: SwapIntent[] = [];
  private queueFilePath: string;
  
  constructor(config: QueueConfig) {
    this.config = config;
    this.queueFilePath = config.filePath || './intent_queue.json';
  }
  
  async initialize() {
    if (this.config.type === 'file') {
      await this.loadFromFile();
    } else if (this.config.type === 'redis') {
      // TODO: Initialize Redis connection
      console.log('Redis queue not implemented yet');
    }
  }
  
  async enqueue(intent: SwapIntent): Promise<void> {
    this.queue.push(intent);
    await this.persistQueue();
    console.log(`Enqueued intent: ${intent.id}`);
  }
  
  async dequeue(): Promise<SwapIntent | null> {
    const intent = this.queue.shift();
    if (intent) {
      await this.persistQueue();
      console.log(`Dequeued intent: ${intent.id}`);
    }
    return intent || null;
  }
  
  async peek(): Promise<SwapIntent | null> {
    return this.queue[0] || null;
  }
  
  async size(): Promise<number> {
    return this.queue.length;
  }
  
  async getAll(): Promise<SwapIntent[]> {
    return [...this.queue];
  }
  
  async remove(intentId: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(intent => intent.id !== intentId);
    
    if (this.queue.length < initialLength) {
      await this.persistQueue();
      console.log(`Removed intent: ${intentId}`);
      return true;
    }
    return false;
  }
  
  async updateStatus(intentId: string, status: SwapIntent['status']): Promise<boolean> {
    const intent = this.queue.find(intent => intent.id === intentId);
    if (intent) {
      intent.status = status;
      await this.persistQueue();
      console.log(`Updated intent ${intentId} status to: ${status}`);
      return true;
    }
    return false;
  }
  
  async clear(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
    console.log('Cleared intent queue');
  }
  
  private async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.queueFilePath, 'utf-8');
      this.queue = JSON.parse(data);
      console.log(`Loaded ${this.queue.length} intents from file`);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty queue
      this.queue = [];
      console.log('Starting with empty queue');
    }
  }
  
  private async persistQueue(): Promise<void> {
    if (this.config.type === 'file') {
      try {
        await fs.writeFile(this.queueFilePath, JSON.stringify(this.queue, null, 2));
      } catch (error) {
        console.error('Error persisting queue:', error);
      }
    }
    // TODO: Implement Redis persistence
  }
  
  // Utility methods
  async getPendingIntents(): Promise<SwapIntent[]> {
    return this.queue.filter(intent => intent.status === 'pending');
  }
  
  async getProcessingIntents(): Promise<SwapIntent[]> {
    return this.queue.filter(intent => intent.status === 'processing');
  }
  
  async getFailedIntents(): Promise<SwapIntent[]> {
    return this.queue.filter(intent => intent.status === 'failed');
  }
} 