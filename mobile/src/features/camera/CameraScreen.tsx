import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef } from "react"
import { Button, View, Alert } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"

import apiClient from "../../infrastructure/apiClient"
import { speakText } from "../tts/ttsService"

export default function CameraScreen() {

  const cameraRef = useRef<CameraView | null>(null)

  const [permission, requestPermission] = useCameraPermissions()

  if (!permission) return null

  if (!permission.granted) {
    return <Button title="Permitir cámara" onPress={requestPermission} />
  }

  const takePicture = async () => {

    try {

      if (!cameraRef.current) {
        console.log("Camera no lista")
        return
      }

      // 📸 Tomar foto
      const photo = await cameraRef.current.takePictureAsync()

      // 🧠 (opcional) compresión ligera
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      )

      // 📦 FormData para backend
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

      // 🟢 Respuesta inmediata
      if (data.status === "completed") {
        speakText(data.description)
        return
      }

      // 🟡 Fallback async (cola)
      if (data.status === "processing") {

        const jobId = data.jobId

        let result

        while (true) {

          const res = await apiClient.get(`/vision/status/${jobId}`)
          result = res.data

          if (result.status === "completed") break

          await new Promise(r => setTimeout(r, 2000))
        }

        speakText(result.description)
      }

    } catch (error) {

      console.error(error)

      Alert.alert(
        "Error",
        "No se pudo procesar la imagen. Verifica conexión o intenta nuevamente."
      )
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} />
      <Button title="Tomar foto" onPress={takePicture} />
    </View>
  )
}