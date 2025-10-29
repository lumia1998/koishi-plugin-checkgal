export interface GameInfo {
  id: number
  name: string
  alias: string[]
  tags: string[]
  platform: string[]
  language: string[]
  introduction: string
  banner: string
  cover: string
  download: number
  created: string
  resource_update_time: string
}

export interface DownloadResource {
  id: number
  patchId: number
  name: string
  platform: string[]
  language: string[]
  size: string
  content: string
  code: string
  password: any
  note: string
  created: string
}