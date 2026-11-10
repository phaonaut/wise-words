import { Andika_400Regular, Andika_700Bold, useFonts } from '@expo-google-fonts/andika';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/constants/theme';
import { setRate } from '@/lib/speech';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}

function App() {
  const [fontsLoaded, fontError] = useFonts({ Andika_400Regular, Andika_700Bold });
  const { ready, data } = useStore();
  const loaded = (fontsLoaded || !!fontError) && ready;

  useEffect(() => {
    setRate(data.settings.speechRate);
  }, [data.settings.speechRate]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
