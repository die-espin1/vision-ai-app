import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef, useState } from "react"
import { Button, View, Alert, ActivityIndicator } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"

import apiClient from "../../infrastructure/apiClient"
import { speakText } from "../tts/ttsService"

export default function CameraScreen() {

  const cameraRef = useRef<CameraView | null>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [loading, setLoading] = useState(false)

  if (!permission) return null

  if (!permission.granted) {
    return <Button title="Permitir cámara" onPress={requestPermission} />
  }

  // 🔁 polling controlado (no bloqueante)
  const checkStatus = async (jobId: string, attempts = 0) => {
    try {

      // ⛔ límite de intentos (evita loops infinitos)
      if (attempts >= 10) {
        Alert.alert("Error", "Tiempo de espera agotado")
        setLoading(false)
        return
      }

      const response = await apiClient.get(`/vision/status/${jobId}`)
      const data = response.data

      if (data.status === "completed") {
        speakText(data.description)
        setLoading(false)
        return
      }

      // 🔁 reintento en 2s
      setTimeout(() => {
        checkStatus(jobId, attempts + 1)
      }, 2000)

    } catch (error) {
      console.error("Error consultando estado:", error)
      Alert.alert("Error", "Fallo al consultar el estado")
      setLoading(false)
    }
  }

  const takePicture = async () => {

    try {

      if (!cameraRef.current) {
        console.log("Camera no lista")
        return
      }

      setLoading(true)

      // 📸 Tomar foto
      const photo = await cameraRef.current.takePictureAsync()

      // 🧠 Compresión
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      )

      // 📦 FormData
      const formData = new FormData()

      formData.append("image", {
        uri: compressed.uri,
        name: "photo.jpg",
        type: "image/jpeg"
      } as any)

      // 🚀 Enviar a backend
      const response = await apiClient.post("/vision/describe", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      const data = response.data

      // 🟢 respuesta inmediata
      if (data.status === "completed") {
        speakText(data.description)
        setLoading(false)
        return
      }

      // 🟡 procesamiento async
      if (data.status === "processing") {
        checkStatus(data.jobId)
      }

    } catch (error) {

      console.error(error)

      Alert.alert(
        "Error",
        "No se pudo procesar la imagen. Verifica conexión o intenta nuevamente."
      )

      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} />

      {loading ? (
        <ActivityIndicator size="large" style={{ position: "absolute", top: "50%", left: "45%" }} />
      ) : (
        <Button title="Tomar foto" onPress={takePicture} />
      )}
    </View>
  )
}