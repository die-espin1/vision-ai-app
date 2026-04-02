import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef, useState } from "react"
import { Button, View } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"

import { describeImage } from "../vision/visionService"
import { speakText } from "../tts/ttsService"

export default function CameraScreen() {

  const cameraRef = useRef<any>(null)

  const [permission, requestPermission] = useCameraPermissions()

  if (!permission) return null

  if (!permission.granted) {
    return <Button title="Permitir cámara" onPress={requestPermission} />
  }

  const takePicture = async () => {

    const photo = await cameraRef.current.takePictureAsync({
      base64: true
    })

    // comprimir imagen
    const compressed = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6 }
    )

    const description = await describeImage(photo.base64)

    speakText(description)
  }

  return (

    <View style={{ flex: 1 }}>

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
      />

      <Button
        title="Tomar foto"
        onPress={takePicture}
      />

    </View>

  )
}