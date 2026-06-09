import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import LogoAnimation from '@/src/shared/components/LogoAnimation';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      await SplashScreen.hideAsync().catch(() => undefined);

      try {
        const hasOnboarded = await AsyncStorage.getItem('onboarding:done');
        if (hasOnboarded !== 'true') {
          router.replace('/onboarding' as any);
        }
      } catch (error) {
        console.error('Failed to read onboarding state:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }
    checkOnboarding();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {isCheckingOnboarding ? (
        <View style={styles.loadingScreen}>
          <LogoAnimation size={140} color="#fff" />
        </View>
      ) : null}
      <StatusBar style={isCheckingOnboarding ? 'light' : 'auto'} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
});

