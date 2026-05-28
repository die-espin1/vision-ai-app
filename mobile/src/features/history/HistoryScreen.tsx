import { useState, useCallback } from "react"
import {
  View, Text, FlatList, Pressable, Image,
  StyleSheet, Alert, ActivityIndicator
} from "react-native"
import { useFocusEffect } from "expo-router"
import { getHistory, clearHistory, HistoryItem } from "./historyService"
import { speakText } from "../tts/ttsService"

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getHistory()
    setItems(data)
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleClear = () => {
    Alert.alert(
      "Borrar historial",
      "¿Estás seguro? Se eliminarán todas las descripciones.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: async () => {
          await clearHistory()
          setItems([])
        }},
      ]
    )
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("es-SV", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit"
    })
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#fff" />
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}
          accessible
          accessibilityRole="header">
          Historial
        </Text>
        {items.length > 0 && (
          <Pressable
            onPress={handleClear}
            accessible
            accessibilityLabel="Borrar todo el historial"
            accessibilityRole="button">
            <Text style={styles.clearBtn}>Borrar todo</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No hay descripciones aún.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => speakText(item.description)}
              accessible
              accessibilityLabel={`${formatDate(item.createdAt)}. ${item.description}. Toca para escuchar.`}
              accessibilityRole="button"
            >
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.photo}
                  resizeMode="cover"
                  accessibilityLabel="Foto capturada"
                />
              ) : null}
              <View style={styles.textBlock}>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#000" },
  center:     { flex: 1, justifyContent: "center", alignItems: "center" },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title:      { color: "#fff", fontSize: 24, fontWeight: "700" },
  clearBtn:   { color: "#ff4444", fontSize: 14 },
  list:       { padding: 16, gap: 20 },

  card:       { backgroundColor: "#000", borderRadius: 0, overflow: "hidden" },
  photo:      { width: "100%", height: 260, backgroundColor: "#111" },
  textBlock:  { padding: 16, gap: 6 },
  date:       { color: "#666", fontSize: 12 },
  desc:       { color: "#fff", fontSize: 15, lineHeight: 24 },
  empty:      { color: "#888", fontSize: 16 },
})
