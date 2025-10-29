import { Context } from 'koishi'
import { Config } from './config'
import { TouchGalAPI } from './api'
import { GameCache } from './cache'
import { apply as applyCommands } from './commands'

export const name = 'checkgal'
export { Config }

export function apply(ctx: Context, config: Config) {
  // 初始化服务
  const api = new TouchGalAPI(ctx)
  const cache = new GameCache()

  // 将服务挂载到上下文中
  ctx.provide('touchgal', api)
  ctx.provide('gameCache', cache)

  // 注册指令
  ctx.plugin(applyCommands, config)

  // 在插件停用时清理缓存
  ctx.on('dispose', () => {
    cache.clear()
  })
}