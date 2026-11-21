import type { MirraApi } from '../shared/types'

declare global {
  interface Window {
    mirra: MirraApi
  }
}

export {}
