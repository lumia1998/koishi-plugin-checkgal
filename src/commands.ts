import { Context, h } from 'koishi'
import { Config } from './config'
import { TouchGalAPI } from './api'
import { GameCache } from './cache'

interface Dependencies {
  touchgal: TouchGalAPI
  gameCache: GameCache
}

export function apply(ctx: Context, config: Config, deps: Dependencies) {
  const { touchgal, gameCache } = deps

  ctx.command('查询gal <keyword:text>', '查询Galgame信息')
    .action(async ({ session }, keyword) => {
      if (!session) return '该指令只能在聊天环境中使用。'
      if (!keyword) return '请输入要查询的游戏名。'

      await session.send('正在查询，请稍候...')

      const results = await touchgal.searchGame(keyword, config)
      if (!results.length) {
        return `未找到关于"${keyword}"的任何游戏。`
      }

      // 缓存结果
      results.forEach(game => gameCache.set(game.id, game))

      // 构建合并转发消息
      const forwardMessages = []
      for (const game of results) {
        const imageBuffer = await touchgal.downloadAndConvertImage(game.banner)
        const imageElement = imageBuffer
          ? h.image(imageBuffer, 'image/jpeg')
          : h('text', { content: '封面图加载失败' })

        const content = [
          imageElement,
          `ID: ${game.id}`,
          `名称: ${game.name}`,
          `平台: ${game.platform.join(', ')}`,
          `语言: ${game.language.join(', ')}`,
        ].join('\n')

        forwardMessages.push(h('message', {}, content))
      }

      // 发送合并转发消息
      await session.send(h('message', { forward: true }, forwardMessages))
    })

  ctx.command('下载gal <id:number>', '获取Galgame下载地址')
    .action(async ({ session }, id) => {
      if (!session) return '该指令只能在聊天环境中使用。'
      if (!id) return '请输入游戏ID。'

      let gameInfo = gameCache.get(id)

      // 如果缓存中没有，尝试重新获取
      if (!gameInfo) {
        await session.send('缓存中未找到该游戏信息，正在尝试重新搜索...')
        const results = await touchgal.searchGame(String(id), config)
        const foundGame = results.find(g => g.id === id)
        if (foundGame) {
          gameInfo = foundGame
          gameCache.set(id, gameInfo)
        } else {
          await session.send(`无法获取游戏"${id}"的详细信息，但仍会尝试获取下载链接...`)
        }
      }

      const downloads = await touchgal.getDownloads(id)
      if (!downloads.length) {
        return `未找到ID为 ${id} 的下载资源。`
      }

      const gameTitle = gameInfo ? `游戏: ${gameInfo.name} (ID: ${id})` : `游戏ID: ${id}`
      const imageBuffer = gameInfo ? await touchgal.downloadAndConvertImage(gameInfo.banner) : null

      // 构建合并转发消息
      const forwardMessages = []

      // 第一条消息：游戏标题和封面
      if (imageBuffer) {
        const headerContent = [
          h.image(imageBuffer, 'image/jpeg'),
          gameTitle,
          `共找到 ${downloads.length} 个下载资源`,
        ].join('\n')
        forwardMessages.push(h('message', {}, headerContent))
      } else {
        const headerContent = [
          gameTitle,
          `共找到 ${downloads.length} 个下载资源`,
        ].join('\n')
        forwardMessages.push(h('message', {}, headerContent))
      }

      // 后续消息：每个下载资源一条消息
      for (const res of downloads) {
        const resContent = [
          `名称: ${res.name}`,
          `平台: ${res.platform.join(', ')} | 大小: ${res.size}`,
          `下载地址: ${res.content}`,
          `提取码: ${res.code || '无'}`,
          `解压码: ${res.password || '无'}`,
          `备注: ${res.note || '无'}`,
        ].join('\n')
        forwardMessages.push(h('message', {}, resContent))
      }

      // 发送合并转发消息
      await session.send(h('message', { forward: true }, forwardMessages))
    })
}