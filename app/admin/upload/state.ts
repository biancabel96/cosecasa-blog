export interface UploadedAsset {
  url: string
  filename: string
}

export interface UploadState {
  success: boolean
  title?: string
  slug?: string
  markdown?: UploadedAsset
  images?: UploadedAsset[]
  error?: string
}

export const initialUploadState: UploadState = { success: false }
