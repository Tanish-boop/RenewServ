import Redis from 'ioredis';

let redisClient: any = null;
let useMemoryFallback = false;

// Custom In-Memory Store
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();
const memoryQueues = new Map<string, string[]>();

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    
    redisClient.on('error', (err: any) => {
      console.warn('Redis connection failed, switching to in-memory fallback:', err.message);
      useMemoryFallback = true;
    });
  } catch (err: any) {
    console.warn('Failed to initialize Redis, using in-memory fallback:', err.message);
    useMemoryFallback = true;
  }
} else {
  console.log('No REDIS_URL environment variable found. Using in-memory fallback store.');
  useMemoryFallback = true;
}

export const redis = {
  async get(key: string): Promise<string | null> {
    if (!useMemoryFallback && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn('Redis GET error, falling back to memory:', err);
      }
    }
    
    const item = memoryStore.get(key);
    if (!item) return null;
    
    if (item.expiresAt && item.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    
    return item.value;
  },

  async set(key: string, value: string, expireSeconds?: number): Promise<'OK'> {
    if (!useMemoryFallback && redisClient) {
      try {
        if (expireSeconds) {
          return await redisClient.set(key, value, 'EX', expireSeconds);
        }
        return await redisClient.set(key, value);
      } catch (err) {
        console.warn('Redis SET error, falling back to memory:', err);
      }
    }

    const expiresAt = expireSeconds ? Date.now() + (expireSeconds * 1000) : null;
    memoryStore.set(key, { value, expiresAt });
    return 'OK';
  },

  async del(key: string): Promise<number> {
    if (!useMemoryFallback && redisClient) {
      try {
        return await redisClient.del(key);
      } catch (err) {
        console.warn('Redis DEL error, falling back to memory:', err);
      }
    }

    const existed = memoryStore.has(key);
    memoryStore.delete(key);
    return existed ? 1 : 0;
  },

  // Queue Operations
  async enqueue(queueName: string, data: any): Promise<number> {
    const payload = JSON.stringify(data);
    
    if (!useMemoryFallback && redisClient) {
      try {
        return await redisClient.rpush(queueName, payload);
      } catch (err) {
        console.warn('Redis LPUSH error, falling back to memory queue:', err);
      }
    }

    if (!memoryQueues.has(queueName)) {
      memoryQueues.set(queueName, []);
    }
    const queue = memoryQueues.get(queueName)!;
    queue.push(payload);
    return queue.length;
  },

  async dequeue(queueName: string): Promise<any | null> {
    if (!useMemoryFallback && redisClient) {
      try {
        const item = await redisClient.lpop(queueName);
        return item ? JSON.parse(item) : null;
      } catch (err) {
        console.warn('Redis LPOP error, falling back to memory queue:', err);
      }
    }

    const queue = memoryQueues.get(queueName);
    if (!queue || queue.length === 0) return null;
    const item = queue.shift();
    return item ? JSON.parse(item) : null;
  }
};

export default redis;
