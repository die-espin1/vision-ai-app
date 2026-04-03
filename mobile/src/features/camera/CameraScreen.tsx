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

      const photo = await cameraRef.current?.takePictureAsync()

      if (!photo) return

      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      )

      const formData = new FormData()

      formData.append("image", {
        uri: compressed.uri,
        name: "photo.jpg",
        type: "image/jpeg"
      } as any)

      const response = await apiClient.post("/vision/describe", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      const { description } = response.data

      speakText(description)

    } catch (error) {

      console.error(error)

      Alert.alert("Error", "No se pudo procesar la imagen")
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} />
      <Button title="Tomar foto" onPress={takePicture} />
    </View>
  )
}