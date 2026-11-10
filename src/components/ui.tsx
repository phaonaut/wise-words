import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, MAX_WIDTH } from '@/constants/theme';
import { buzz } from '@/lib/speech';

type TxtProps = TextProps & { bold?: boolean; size?: number; color?: string; center?: boolean };

export function Txt({ bold, size = 18, color = colors.ink, center, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: bold ? fonts.bold : fonts.regular,
          fontSize: size,
          lineHeight: Math.round(size * 1.3),
          color,
          textAlign: center ? 'center' : undefined,
          // Labels aren't for selecting: on the web a tap would leave a text cursor or a highlight.
          userSelect: 'none',
        },
        style,
      ]}
    />
  );
}

/** Goes back, or to `fallback` when there's nothing to go back to (like after a web page refresh). */
export function goBack(fallback: '/' | '/grownups' = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

type ScreenProps = {
  title?: string;
  back?: () => void;
  right?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ title, back, right, scroll, children, contentStyle }: ScreenProps) {
  const { width } = useWindowDimensions();
  const sideWidth = width < 600 ? 92 : 150;
  const body = (
    <View style={[styles.content, contentStyle, scroll ? null : { flex: 1 }]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe}>
      {(title || back || right) && (
        <View style={styles.header}>
          <View style={{ width: sideWidth }}>
            {back &&<RoundButton label="⬅️" onPress={back} accessibilityLabel="Back" size={56} />}
          </View>
          <Txt bold size={24} center style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </Txt>
          <View style={{ width: sideWidth, alignItems: 'flex-end' }}>{right}</View>
        </View>
      )}
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

type BigButtonProps = {
  label: string;
  emoji?: string;
  color?: string;
  textColor?: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function BigButton({
  label,
  emoji,
  color = colors.grownups,
  textColor = '#fff',
  onPress,
  size = 'md',
  disabled,
  style,
  accessibilityLabel,
}: BigButtonProps) {
  const font = size === 'lg' ? 30 : size === 'md' ? 22 : 17;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [
        styles.bigButton,
        {
          backgroundColor: color,
          paddingVertical: size === 'lg' ? 22 : size === 'md' ? 14 : 9,
          paddingHorizontal: size === 'sm' ? 14 : 22,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}>
      {emoji ? <Txt size={font + 4}>{emoji}</Txt> : null}
      <Txt bold size={font} color={textColor} center>
        {label}
      </Txt>
    </Pressable>
  );
}

export function RoundButton({
  label,
  onPress,
  color = colors.card,
  size = 52,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}>
      <Txt size={size * 0.45}>{label}</Txt>
    </Pressable>
  );
}

/** Big speaker button for hearing the word again. */
export function SpeakerButton({ onPress, size = 84 }: { onPress: () => void; size?: number }) {
  return (
    <RoundButton
      label="🔊"
      onPress={onPress}
      size={size}
      color="#FFE082"
      accessibilityLabel="Hear it again"
    />
  );
}

/** A button that needs two taps, for things that can't be undone. */
export function ConfirmButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <BigButton
      size="sm"
      color={armed ? colors.bad : colors.badSoft}
      textColor={armed ? '#fff' : colors.bad}
      label={armed ? 'Tap again to confirm' : label}
      onPress={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    />
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Choice<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.choice, on && styles.choiceOn]}>
            <Txt bold={on} color={on ? '#fff' : colors.ink}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Checkbox({
  checked,
  label,
  detail,
  onToggle,
}: {
  checked: boolean;
  label: string;
  detail?: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={styles.checkRow}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked && <Txt bold color="#fff">✓</Txt>}
      </View>
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        {detail ? (
          <Txt size={14} color={colors.muted}>
            {detail}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Txt bold size={20} style={{ marginTop: 18, marginBottom: 8 }}>
      {children}
    </Txt>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  bigButton: {
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.line,
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.line,
  },
  choiceOn: { backgroundColor: colors.grownups, borderColor: colors.grownups },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.grownups,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkBoxOn: { backgroundColor: colors.grownups },
});
