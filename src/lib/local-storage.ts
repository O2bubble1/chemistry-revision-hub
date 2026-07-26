type StoredValue<T> = {
  version: number
  data: T
}

function isStoredValue<T>(value: unknown, version: number): value is StoredValue<T> {
  if (typeof value !== "object" || value === null || !("version" in value) || !("data" in value)) return false
  return value.version === version
}

export function createStorage<T>(key: string, version: number, fallback: T) {
  return {
    read(): T {
      try {
        const raw = window.localStorage?.getItem(key)
        if (!raw) return fallback
        const value: unknown = JSON.parse(raw)
        return isStoredValue<T>(value, version) ? value.data : fallback
      } catch {
        return fallback
      }
    },
    write(data: T): boolean {
      try {
        const storage = window.localStorage
        if (!storage) return false
        storage.setItem(key, JSON.stringify({ version, data }))
        return true
      } catch {
        return false
      }
    },
    clear(): boolean {
      try {
        const storage = window.localStorage
        if (!storage) return false
        storage.removeItem(key)
        return true
      } catch {
        return false
      }
    },
  }
}
