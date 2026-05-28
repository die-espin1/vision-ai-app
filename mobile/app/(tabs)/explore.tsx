import { useEffect, useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { LANGUAGES, getTtsSettings, saveTtsSettings, TtsSettings } from "@/src/features/tts/ttsSettings"

const RATE_OPTIONS = [0.75, 1.0, 1.5, 2.0]

function getRateLabel(rate: number): string {
  if (rate <= 0.75) return "Lento"
  if (rate <= 1.0) return "Normal"
  if (rate <= 1.5) return "Rápido"
  return "Muy rápido"
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<TtsSettings>({ rate: 1.0, language: "es-419" })
  const [savedVisible, setSavedVisible] = useState(false)

  useEffect(() => {
    getTtsSettings().then(setSettings).catch(() => {})
  }, [])

  const rateText = useMemo(() => `${settings.rate.toFixed(2)}x — ${getRateLabel(settings.rate)}`, [settings.rate])

  const persist = async (next: TtsSettings) => {
    setSettings(next)
    await saveTtsSettings(next)
    setSavedVisible(true)
    setTimeout(() => setSavedVisible(false), 1500)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Velocidad de voz</Text>
        <Text style={styles.valueText}>{rateText}</Text>
        <View style={styles.optionsRow}>
          {RATE_OPTIONS.map((rate) => {
            const active = settings.rate === rate
            return (
              <Pressable
                key={rate}
                style={[styles.optionBtn, active && styles.optionBtnActive]}
                onPress={() => persist({ ...settings, rate })}
                accessibilityRole="button"
                accessibilityLabel={`Velocidad ${rate} por`}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{rate.toFixed(2)}x</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Idioma</Text>
        <View style={styles.languageColumn}>
          {LANGUAGES.map((item) => {
            const active = settings.language === item.value
            return (
              <Pressable
                key={item.value}
                style={[styles.optionBtn, styles.languageBtn, active && styles.optionBtnActive]}
                onPress={() => persist({ ...settings, language: item.value })}
                accessibilityRole="button"
                accessibilityLabel={`Idioma ${item.label}`}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <Text style={[styles.savedText, !savedVisible && styles.savedHidden]}>Guardado</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 40, gap: 28 },
  section: { gap: 12 },
  sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "700" },
  valueText: { color: "#999", fontSize: 14 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  languageColumn: { gap: 10 },
  optionBtn: {
    backgroundColor: "#1c1c1c",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  languageBtn: { alignItems: "flex-start" },
  optionBtnActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  optionText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  optionTextActive: { color: "#000" },
  savedText: { color: "#8fd18f", fontSize: 13, textAlign: "center" },
  savedHidden: { opacity: 0 },
})
