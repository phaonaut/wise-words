import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let rate = 0.85;

export function setRate(next: number) {
  rate = next;
}

/** Says each part in order, cutting off anything still being said. */
export function say(...parts: (string | undefined)[]) {
  Speech.stop();
  for (const part of parts) {
    if (part) Speech.speak(part, { language: 'en-US', rate });
  }
}

export function stopSpeaking() {
  Speech.stop();
}

export function buzz(kind: 'tap' | 'good' | 'oops') {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(
          kind === 'good'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
  run.catch(() => {});
}
