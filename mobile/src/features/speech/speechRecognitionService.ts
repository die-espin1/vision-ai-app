/**
 * Safe wrapper for expo-speech-recognition.
 *
 * expo-speech-recognition requires a native build (npx expo run:android / run:ios).
 * In Expo Go the native module is absent and requireNativeModule() throws at load time.
 * This wrapper catches that crash so the rest of the app can still run, and voice
 * input simply becomes unavailable until a proper dev-client build is used.
 */
import { useEffect } from "react"

// ─── Try to load the native module once at module initialisation ────────────
let _nativeModule: any = null
let _useEvent: ((event: string, handler: (e: any) => void) => void) | null = null

try {
  const mod = require("expo-speech-recognition")
  _nativeModule = mod.ExpoSpeechRecognitionModule ?? null
  _useEvent = mod.useSpeechRecognitionEvent ?? null
} catch {
  // Native module not found – graceful fallback (Expo Go / web)
}

/** True when the native speech-recognition module is present. */
export const isSpeechRecognitionAvailable: boolean = _nativeModule !== null

// ─── Stable no-op hook (always calls the same number of hooks) ───────────────
function _noopEventHook(_event: string, _handler: (e: any) => void) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {}, [])
}

/**
 * Drop-in replacement for useSpeechRecognitionEvent.
 * Delegates to the real hook when available, otherwise is a stable no-op
 * so React's hook-count invariant is preserved.
 */
// The function is resolved once at module load, so the same hook is always
// called each render – this satisfies the Rules of Hooks.
export const useSafeRecognitionEvent: (
  event: string,
  handler: (e: any) => void
) => void = _useEvent ?? _noopEventHook

/** Typed proxy for ExpoSpeechRecognitionModule. Safe to call even when unavailable. */
export const SpeechRecognition = {
  async requestPermissionsAsync(): Promise<{ granted: boolean }> {
    if (!_nativeModule) return { granted: false }
    return _nativeModule.requestPermissionsAsync()
  },
  start(options?: { lang?: string }): void {
    if (!_nativeModule) return
    _nativeModule.start(options)
  },
  stop(): void {
    if (!_nativeModule) return
    _nativeModule.stop()
  },
}
