import { Schema } from 'koishi'

export interface Config {
  searchLimit: number
  enableNsfw: boolean
  isForward: boolean
}

export const Config: Schema<Config> = Schema.object({
  searchLimit: Schema.number().default(15).min(1).max(50).description('单次搜索返回的最大结果数量。'),
  enableNsfw: Schema.boolean().default(false).description('是否允许搜索 NSFW 内容。'),
  isForward: Schema.boolean().default(false).description('是否开启合并转发 `仅支持 onebot/red 适配器` 其他平台开启无效').experimental(),
})