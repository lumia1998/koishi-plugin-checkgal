import { Context } from 'koishi'
import { GameInfo, DownloadResource } from './types'
import { Config } from './config'
import sharp from 'sharp'
import * as path from 'path'
import * as crypto from 'crypto'
import { promises as fs } from 'fs'

export class TouchGalAPI {
  private http
  private logger
  private tempDir: string

  constructor(ctx: Context) {
    this.http = ctx.http
    this.logger = ctx.logger('checkgal-api')
    this.tempDir = path.join(ctx.app.baseDir, 'data', 'temp', 'checkgal')
    ctx.on('ready', async () => {
      await fs.mkdir(this.tempDir, { recursive: true })
    })
  }

  async searchGame(keyword: string, config: Config): Promise<GameInfo[]> {
    const url = 'https://www.touchgal.us/api/search'
    const headers = { 'Content-Type': 'application/json' }
    const queryString = JSON.stringify([{ type: 'keyword', name: keyword }])

    const payload = {
      queryString: queryString,
      limit: config.searchLimit,
      searchOption: {
        searchInIntroduction: true,
        searchInAlias: true,
        searchInTag: true,
      },
      page: 1,
      selectedType: 'all',
      selectedLanguage: 'all',
      selectedPlatform: 'all',
      sortField: 'resource_update_time',
      sortOrder: 'desc',
      selectedYears: ['all'],
      selectedMonths: ['all'],
    }

    const cookieString = `kun-patch-setting-store|state|data|kunNsfwEnable=${config.enableNsfw ? 'all' : 'sfw'}`;

    try {
      const responseData = await this.http.post<{ galgames: GameInfo[] }>(url, payload, {
        headers: {
          ...headers,
          'Cookie': cookieString,
        }
      })
      if (!responseData || !responseData.galgames) {
        return []
      }
      return responseData.galgames
    } catch (error) {
      this.logger.error('Failed to search game:', error)
      return []
    }
  }

  async getDownloads(patchId: number): Promise<DownloadResource[]> {
    const url = 'https://www.touchgal.us/api/patch/resource'
    try {
      const responseData = await this.http.get<DownloadResource[]>(url, {
        params: { patchId },
      })
      return responseData || []
    } catch (error) {
      this.logger.error(`Failed to get downloads for patchId ${patchId}:`, error)
      return []
    }
  }

  async downloadAndConvertImage(url: string): Promise<string | null> {
    if (!url) return null
    try {
      const response = await this.http.get(url, {
        responseType: 'arraybuffer',
      })
      if (!(response instanceof ArrayBuffer)) return null

      const imageBuffer = await sharp(Buffer.from(response)).jpeg().toBuffer()

      const hash = crypto.createHash('md5').update(url).digest('hex')
      const fileName = `${hash}.jpg`
      const filePath = path.join(this.tempDir, fileName)
      await fs.writeFile(filePath, imageBuffer)

      // 返回绝对文件路径的 file:// URL
      return `file://${filePath}`
    } catch (error) {
      this.logger.error(`Failed to download or convert image from ${url}:`, error)
      return null
    }
  }
}