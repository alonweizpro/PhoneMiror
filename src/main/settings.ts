import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_SETTINGS, type Settings } from '../shared/types'

/** Tiny JSON settings store in the app's userData folder. */
export class SettingsStore {
  private file: string
  private data: Settings

  constructor(dir: string) {
    this.file = path.join(dir, 'settings.json')
    this.data = { ...DEFAULT_SETTINGS }
    try {
      this.data = { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(this.file, 'utf8')) }
    } catch {
      /* first run or corrupt file → defaults */
    }
  }

  get(): Settings {
    return { ...this.data }
  }

  set(patch: Partial<Settings>): Settings {
    this.data = { ...this.data, ...patch }
    mkdirSync(path.dirname(this.file), { recursive: true })
    writeFileSync(this.file, JSON.stringify(this.data, null, 2))
    return this.get()
  }
}
