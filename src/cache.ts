import { GameInfo } from './types'

interface CacheEntry {
  data: GameInfo
  timer: NodeJS.Timeout
}

export class GameCache {
  private cache = new Map<number, CacheEntry>()
  private ttl: number

  constructor(ttlSeconds: number = 86400) { // 默认缓存24小时
    this.ttl = ttlSeconds * 1000
  }

  get(key: number): GameInfo | undefined {
    return this.cache.get(key)?.data
  }

  set(key: number, value: GameInfo) {
    // 如果已存在，清除旧的定时器
    const existingEntry = this.cache.get(key)
    if (existingEntry) {
      clearTimeout(existingEntry.timer)
    }

    const timer = setTimeout(() => {
      this.cache.delete(key)
    }, this.ttl)

    this.cache.set(key, { data: value, timer })
  }

  clear() {
    for (const entry of this.cache.values()) {
      clearTimeout(entry.timer)
    }
    this.cache.clear()
  }
}