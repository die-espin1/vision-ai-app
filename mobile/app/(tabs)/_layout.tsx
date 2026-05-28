import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: "#000", borderTopColor: "#222" },
      tabBarActiveTintColor: "#fff",
      tabBarInactiveTintColor: "#555",
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Cámara",
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="camera" size={size} color={color} />,
          tabBarAccessibilityLabel: "Ir a la cámara"
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="time-outline" size={size} color={color} />,
          tabBarAccessibilityLabel: "Ver historial de descripciones"
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="settings-outline" size={size} color={color} />,
          tabBarAccessibilityLabel: "Ir a ajustes"
        }}
      />
    </Tabs>
  )
}
