import AsyncStorage from "@react-native-async-storage/async-storage"

export interface HistoryItem {
  id: string
  description: string
  imageUri?: string
  createdAt: string
}

const HISTORY_KEY = "vision_history"
const MAX_ITEMS = 50

export async function saveDescription(description: string, imageUri: string): Promise<void> {
  const item: HistoryItem = {
    id: Date.now().toString(),
    description,
    imageUri,
    createdAt: new Date().toISOString(),
  }
  const existing = await getHistory()
  const updated = [item, ...existing].slice(0, MAX_ITEMS)
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export async function getHistory(): Promise<HistoryItem[]> {
  const data = await AsyncStorage.getItem(HISTORY_KEY)
  return data ? JSON.parse(data) : []
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY)
}
