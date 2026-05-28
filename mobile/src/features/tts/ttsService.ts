import * as Speech from "expo-speech"
import { getTtsSettings } from "./ttsSettings"

export async function speakText(text: string, onDone?: () => void): Promise<void> {
  const settings = await getTtsSettings()
  Speech.stop()
  Speech.speak(text, {
    language: settings.language,
    pitch: 1.0,
    rate: settings.rate,
    volume: 1.0,
    onDone: () => { onDone?.() },
    onError: () => { onDone?.() },
  })
}

export function stopSpeaking(): void {
  Speech.stop()
}
