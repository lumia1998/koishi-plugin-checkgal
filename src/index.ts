import { Context } from 'koishi'
import { Config } from './config'
import { TouchGalAPI } from './api'
import { GameCache } from './cache'
import { apply as applyCommands } from './commands'

export const name = 'checkgal'
export const inject = ['ffmpeg']
export { Config }

export function apply(ctx: Context, config: Config) {
  // 初始化服务
  const api = new TouchGalAPI(ctx)
  const cache = new GameCache()

  // 注册指令，并将 api 和 cache 作为依赖传入
  applyCommands(ctx, config, { touchgal: api, gameCache: cache })

  // 在插件停用时清理缓存
  ctx.on('dispose', () => {
    cache.clear()
  })
}