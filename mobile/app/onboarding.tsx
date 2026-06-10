import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import LogoAnimation from '@/src/shared/components/LogoAnimation';
import { LANGUAGES, saveTtsSettings } from '@/src/features/tts/ttsSettings';

export default function OnboardingScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('es-419');

  const steps = [
    {
      icon: 'camera-outline' as const,
      title: 'Toma una foto',
      description: 'Apunta la cámara a cualquier objeto, escena o texto y toca Describir.',
    },
    {
      icon: 'chatbubble-outline' as const,
      title: 'Escucha la descripción',
      description: 'La app te leerá en voz alta todo lo que hay en la imagen con detalle.',
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Haz preguntas',
      description: '¿Quieres saber más? Toca Preguntar y escribe lo que necesitas saber.',
    },
  ];

  const handleComplete = async () => {
    try {
      await saveTtsSettings({ rate: 1.25, language: selectedLanguage });
      await AsyncStorage.setItem('onboarding:done', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      // Fallback redirection even if storage fails
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <LogoAnimation size={100} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>VisionAI</Text>
          <Text style={styles.headerSubtitle}>Tu asistente de visión</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View
              key={index}
              accessible={true}
              accessibilityLabel={`${step.title}. ${step.description}`}
              style={styles.stepRow}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={step.icon} size={28} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.languageTitle}>¿En qué idioma quieres escuchar las descripciones?</Text>
          <View style={styles.languageOptions}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.value}
                style={[
                  styles.langBtn,
                  selectedLanguage === lang.value && styles.langBtnActive,
                ]}
                onPress={() => setSelectedLanguage(lang.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedLanguage === lang.value }}
                accessibilityLabel={lang.label}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    selectedLanguage === lang.value && styles.langBtnTextActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}
          accessibilityRole="button"
          accessibilityHint="Abre la pantalla principal"
          accessibilityLabel="Comenzar"
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  headerIcon: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  stepsContainer: {
    marginVertical: 16,
  },
  languageSection: {
    marginVertical: 16,
  },
  languageTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  languageOptions: {
    gap: 10,
  },
  langBtn: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  langBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  langBtnText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
  },
  langBtnTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingRight: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
