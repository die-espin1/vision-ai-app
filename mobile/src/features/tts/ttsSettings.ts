import AsyncStorage from "@react-native-async-storage/async-storage"

export type TtsSettings = {
  rate: number
  language: string
}

const SETTINGS_KEY = "tts:settings"

const DEFAULT_SETTINGS: TtsSettings = {
  rate: 1.0,
  language: "es-419",
}

export const LANGUAGES = [
  { label: "Español (Latinoamérica)", value: "es-419" },
  { label: "Español (España)", value: "es-ES" },
  { label: "English (US)", value: "en-US" },
]

export async function getTtsSettings(): Promise<TtsSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as Partial<TtsSettings>
    return {
      rate: typeof parsed.rate === "number" ? parsed.rate : DEFAULT_SETTINGS.rate,
      language: typeof parsed.language === "string" ? parsed.language : DEFAULT_SETTINGS.language,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveTtsSettings(settings: TtsSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
