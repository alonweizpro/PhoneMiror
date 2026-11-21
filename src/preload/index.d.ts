import type { PhoneMirorApi } from '../shared/types'

declare global {
  interface Window {
    phonemiror: PhoneMirorApi
  }
}

export {}
