import { useEffect, useState } from 'react';
import { Animated, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { owlSvg, type OwlMood } from '@/components/owl-svg';
import { Txt } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Ollie the owl. `bounce` makes a gentle hop, for celebrations. */
export function Owl({
  size = 120,
  mood = 'happy',
  bounce = false,
  style,
}: {
  size?: number;
  mood?: OwlMood;
  bounce?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [hop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!bounce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hop, { toValue: -size * 0.08, duration: 260, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(hop, { toValue: 0, duration: 260, useNativeDriver: Platform.OS !== 'web' }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, hop, size]);

  return (
    <Animated.View
      accessible={false}
      style={[{ width: size, height: size, transform: [{ translateY: hop }] }, style]}>
      <SvgXml xml={owlSvg({ mood })} width={size} height={size} />
    </Animated.View>
  );
}

/** The Wise Words logo: Ollie above (or beside) the name. */
export function Logo({ size = 46, inline = false }: { size?: number; inline?: boolean }) {
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="Wise Words"
      style={{ alignItems: 'center', flexDirection: inline ? 'row' : 'column', gap: inline ? 10 : 2 }}>
      <Owl size={inline ? size * 1.6 : size * 2.8} />
      <Txt bold size={size} style={{ lineHeight: size * 1.2 }}>
        <Txt bold size={size} color={colors.owl}>
          Wise
        </Txt>{' '}
        <Txt bold size={size} color={colors.spell}>
          Words
        </Txt>
      </Txt>
    </View>
  );
}
