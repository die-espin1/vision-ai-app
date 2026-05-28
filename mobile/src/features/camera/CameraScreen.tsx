import { CameraView, useCameraPermissions } from "expo-camera"
import { useRef, useState, useCallback, useEffect } from "react"
import {
  View, Text, Pressable, StyleSheet,
  AccessibilityInfo, Alert, ActivityIndicator, TextInput, Modal
} from "react-native"
import * as ImageManipulator from "expo-image-manipulator"
import { describeImage } from "../vision/visionService"
import { speakText, stopSpeaking } from "../tts/ttsService"
import { saveDescription, getLastItem } from "../history/historyService"
import { Ionicons } from "@expo/vector-icons"
import {
  SpeechRecognition,
  useSafeRecognitionEvent,
  isSpeechRecognitionAvailable,
} from "../speech/speechRecognitionService"

type Status = "idle" | "capturing" | "processing" | "done" | "error"

export default function CameraScreen() {
  const cameraRef = useRef<CameraView | null>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [status, setStatus] = useState<Status>("idle")
  const [lastDescription, setLastDescription] = useState("")
  const [originalDescription, setOriginalDescription] = useState("")
  const [lastAnswer, setLastAnswer] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [isAsking, setIsAsking] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcriptRef = useRef("")

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    setIsDescriptionVisible(true)
    hideTimerRef.current = setTimeout(() => {
      setIsDescriptionVisible(false)
    }, 8000)
  }, [])

  const startListening = async () => {
    if (!isSpeechRecognitionAvailable) {
      Alert.alert(
        "No disponible",
        "El reconocimiento de voz requiere una build nativa. Usa el teclado para escribir tu pregunta."
      )
      return
    }
    try {
      const perm = await SpeechRecognition.requestPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(
          "Permiso denegado",
          "Se requieren permisos de micrófono y reconocimiento de voz para dictar preguntas."
        )
        return
      }
      transcriptRef.current = ""
      setQuestion("")
      setIsListening(true)
      SpeechRecognition.start({ lang: "es" })
    } catch (e) {
      console.error("[startListening]", e)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    try {
      SpeechRecognition.stop()
    } catch (e) {
      console.error("[stopListening]", e)
    }
    setIsListening(false)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const closeModal = () => {
    stopListening()
    setIsModalVisible(false)
  }

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || status === "processing" || status === "capturing") return
    try {
      setStatus("capturing")
      stopSpeaking()
      setQuestion("")
      setImageUri(null)
      setIsModalVisible(false)
      setLastAnswer(null)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setIsDescriptionVisible(false)
      setOriginalDescription("")
      const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true })
      if (!photo?.uri) throw new Error("No se pudo tomar la foto")
      setStatus("processing")
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG }
      )
      setImageUri(compressed.uri)
      const description = await describeImage(compressed.uri)
      setLastDescription(description)
      startHideTimer()
      setOriginalDescription(description)
      setStatus("done")
      await saveDescription(description, compressed.uri)
      speakText(description)
      AccessibilityInfo.announceForAccessibility(description)
    } catch (error: any) {
      console.error("[CameraScreen]", error)
      setStatus("error")
      const msg = "No se pudo procesar la imagen. Verifica tu conexión e intenta nuevamente."
      speakText(msg)
      AccessibilityInfo.announceForAccessibility(msg)
      Alert.alert("Error", msg, [{ text: "OK", onPress: () => setStatus("idle") }])
    }
  }, [status])

  const handleSendQuestion = useCallback(async (qText: string) => {
    if (!qText.trim() || isAsking) return
    try {
      setIsAsking(true)
      stopSpeaking()
      setIsModalVisible(false)

      let activeUri = imageUri
      let activeContext = originalDescription

      if (!activeUri) {
        const last = await getLastItem()
        if (!last?.imageUri) {
          const msg = "No hay imagen disponible para hacer preguntas."
          speakText(msg)
          Alert.alert("Sin imagen", msg)
          return
        }
        activeUri = last.imageUri
        activeContext = last.description
      }

      const answer = await describeImage(activeUri, qText.trim(), activeContext)
      setLastAnswer(answer)
      startHideTimer()
      setQuestion("")
      transcriptRef.current = ""
      speakText(answer)
      AccessibilityInfo.announceForAccessibility(answer)
    } catch (error: any) {
      console.error("[CameraScreen handleSendQuestion]", error)
      const msg = "No se pudo procesar tu pregunta. Verifica tu conexión e intenta nuevamente."
      speakText(msg)
      AccessibilityInfo.announceForAccessibility(msg)
      Alert.alert("Error", msg)
    } finally {
      setIsAsking(false)
    }
  }, [imageUri, isAsking, originalDescription, startHideTimer])

  useEffect(() => {
    let isMounted = true

    async function loadLastHistoryItem() {
      if (imageUri || lastDescription) return
      const last = await getLastItem()
      if (!isMounted || !last) return
      setLastDescription(last.description)
      setOriginalDescription(last.description)
    }

    loadLastHistoryItem()
    return () => { isMounted = false }
  }, [imageUri, lastDescription])

  useSafeRecognitionEvent("start", () => setIsListening(true))

  useSafeRecognitionEvent("end", () => {
    setIsListening(false)
    const finalQuestion = transcriptRef.current.trim()
    if (finalQuestion) handleSendQuestion(finalQuestion)
  })

  useSafeRecognitionEvent("result", (event) => {
    if (event.results && event.results.length > 0) {
      const text = event.results[0].transcript
      transcriptRef.current = text
      setQuestion(text)
    }
  })

  useSafeRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event.error, event.message)
    setIsListening(false)
  })

  if (!permission) return <View style={styles.center}><ActivityIndicator /></View>

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Esta app necesita acceso a la cámara para describir lo que tienes enfrente.
        </Text>
        <Pressable
          style={styles.btn}
          onPress={requestPermission}
          accessible
          accessibilityLabel="Permitir acceso a la cámara"
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Permitir cámara</Text>
        </Pressable>
      </View>
    )
  }

  const isLoading = status === "capturing" || status === "processing"

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} />
      <View style={styles.overlay}>
        {isAsking ? (
          <View accessibilityLiveRegion="polite" style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Procesando pregunta…</Text>
          </View>
        ) : isLoading ? (
          <View accessibilityLiveRegion="polite" style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>
              {status === "capturing" ? "Tomando foto…" : "Analizando…"}
            </Text>
          </View>
        ) : (
          <>
            {lastAnswer && isDescriptionVisible && (
              <Pressable
                style={[styles.descBox, styles.answerBox]}
                onPress={() => speakText(lastAnswer)}
                accessible
                accessibilityLabel={`Respuesta: ${lastAnswer}. Toca para escuchar de nuevo.`}
                accessibilityRole="text"
              >
                <Text style={styles.answerLabel}>Respuesta</Text>
                <Text style={styles.descText}>{lastAnswer}</Text>
              </Pressable>
            )}

            {lastDescription && isDescriptionVisible && (
              <Pressable
                style={styles.descBox}
                onPress={() => speakText(lastDescription)}
                accessible
                accessibilityLabel={`Descripción: ${lastDescription}. Toca para escuchar de nuevo.`}
                accessibilityRole="text"
              >
                <Text style={styles.descText}>{lastDescription}</Text>
              </Pressable>
            )}

            <View style={styles.btnRow}>
              <Pressable
                style={styles.btn}
                onPress={takePicture}
                accessible
                accessibilityLabel={status === "done" ? lastDescription : "Describir lo que tienes enfrente"}
                accessibilityRole="button"
                accessibilityHint="Doble toque para describir la escena"
              >
                <Text style={styles.btnText}>
                  {status === "done" ? "De nuevo" : "Describir"}
                </Text>
              </Pressable>

              {(status === "done" || status === "idle") && lastDescription && (
                <Pressable
                  style={[styles.btn, styles.secondaryBtn]}
                  onPress={() => setIsModalVisible(true)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Hacer pregunta sobre la imagen"
                  accessibilityHint="Toca dos veces para abrir el panel de preguntas"
                >
                  <Text style={styles.secondaryBtnText}>Preguntar</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessible accessibilityRole="header">
                Hacer pregunta
              </Text>
              <Pressable
                style={styles.closeBtn}
                onPress={closeModal}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Cerrar panel de preguntas"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {!isSpeechRecognitionAvailable && (
              <Text style={styles.warningText}>Reconocimiento de voz no disponible en esta build.</Text>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder={isListening ? "Escuchando..." : "Haz una pregunta..."}
                placeholderTextColor="#888"
                value={question}
                onChangeText={setQuestion}
                editable={!isListening && !isAsking}
                accessible
                accessibilityLabel="Escribe una pregunta sobre la imagen"
                accessibilityHint="Ingresa una pregunta de seguimiento sobre la imagen actual"
              />
              <Pressable
                style={[
                  styles.micBtn,
                  isListening && styles.listeningMicBtn,
                  !isSpeechRecognitionAvailable && styles.micBtnDisabled,
                ]}
                onPress={toggleListening}
                disabled={isAsking}
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  !isSpeechRecognitionAvailable
                    ? "Reconocimiento de voz no disponible en Expo Go"
                    : isListening
                    ? "Detener grabación de voz"
                    : "Preguntar con voz"
                }
                accessibilityHint="Toca dos veces para activar el micrófono y dictar tu pregunta"
              >
                <Ionicons
                  name={
                    !isSpeechRecognitionAvailable
                      ? "mic-off-outline"
                      : isListening
                      ? "mic"
                      : "mic-outline"
                  }
                  size={24}
                  color={
                    !isSpeechRecognitionAvailable
                      ? "#555"
                      : isListening
                      ? "#ff4444"
                      : "#fff"
                  }
                />
              </Pressable>
            </View>

            <Pressable
              style={[styles.submitBtn, (!question.trim() || isAsking || isListening) && styles.disabledBtn]}
              onPress={() => handleSendQuestion(question)}
              disabled={!question.trim() || isAsking || isListening}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Enviar pregunta"
              accessibilityHint="Toca dos veces para enviar la pregunta sobre la imagen"
            >
              {isAsking ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Enviar</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#000" },
  camera:         { flex: 1 },
  center:         { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#000" },
  overlay:        { position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, alignItems: "center", gap: 16 },
  btnRow:         { flexDirection: "row", gap: 12, width: "100%" },
  btn:            { flex: 1, backgroundColor: "#fff", paddingVertical: 18, borderRadius: 50, alignItems: "center" },
  loadingBox:     { alignItems: "center", gap: 12 },
  loadingText:    { color: "#fff", fontSize: 18, fontWeight: "500" },
  permissionText: { color: "#fff", fontSize: 18, textAlign: "center", marginBottom: 24, lineHeight: 26 },
  descBox:        { backgroundColor: "rgba(0,0,0,0.72)", borderRadius: 16, padding: 16, maxWidth: "100%" },
  descText:       { color: "#fff", fontSize: 16, lineHeight: 24, textAlign: "center" },
  btnText:        { fontSize: 20, fontWeight: "700", color: "#000" },
  secondaryBtn:   { backgroundColor: "#1c1c1c", borderWidth: 1, borderColor: "#333" },
  secondaryBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalBackdrop:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent:   { backgroundColor: "#121212", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 20, borderWidth: 1, borderColor: "#222" },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle:     { color: "#fff", fontSize: 20, fontWeight: "700" },
  closeBtn:       { padding: 4 },
  inputRow:       { flexDirection: "row", alignItems: "center", gap: 12 },
  modalInput:     { flex: 1, backgroundColor: "#1c1c1c", color: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: "#333" },
  micBtn:         { backgroundColor: "#1c1c1c", width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#333" },
  listeningMicBtn: { borderColor: "#ff4444", backgroundColor: "rgba(255, 68, 68, 0.1)" },
  micBtnDisabled: { borderColor: "#333", backgroundColor: "#111", opacity: 0.5 },
  submitBtn:      { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  submitBtnText:  { color: "#000", fontSize: 18, fontWeight: "700" },
  disabledBtn:    { opacity: 0.5 },
  warningText:    { color: "#888", fontSize: 13, textAlign: "center", marginBottom: -8 },
  answerBox:      { borderColor: "#4a9eff", borderWidth: 1 },
  answerLabel:    { color: "#4a9eff", fontSize: 12, fontWeight: "600", marginBottom: 4 },
})
