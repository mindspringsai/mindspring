import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CalmingBackground from '../components/CalmingBackground';

const PAGES = [
  "Mental Wellness Reimagined.",
  "Let’s recharge.",
  "Let’s grow.",
  "MindSpring",
  "Let’s breathe.",
  "Let’s connect.",
  "Let’s unwind.",
  "Let’s heal.",
  "MindSpring",
];

const THEMES = ['blues', 'lavender', 'greens', 'neutrals'];

const BASE_HEADLINE_STYLE = {
  fontFamily: Platform.select({ ios: 'HelveticaNeue', android: 'sans-serif', default: 'System' }),
  fontWeight: '700',
};

const TEXT_COLOR_MAP = {
  blues: '#0F2A43',
  lavender: '#2A2140',
  greens: '#153826',
  neutrals: '#2E2A26',
};

const PAGE_MS = 2500;
const OUT_MS  = 350;
const TYPE_MS = 30;

export default function OnboardingScreen({ navigation, onLogin }) {
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const themeKey = useMemo(() => THEMES[index % THEMES.length], [index]);
  const headlineColor = TEXT_COLOR_MAP[themeKey] || '#1D3557';

  const typeString = (str) => {
    setTyped('');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setTyped(str.slice(0, i));
      if (i >= str.length) clearInterval(t);
    }, TYPE_MS);
    return t;
  };

  const animateInAndType = (str) => {
    opacity.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    return typeString(str);
  };

  useEffect(() => {
    const current = PAGES[index];
    let typer = animateInAndType(current);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -6, duration: OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setIndex(i => (i + 1) % PAGES.length));
    }, PAGE_MS);

    return () => {
      clearTimeout(timer);
      if (typer) clearInterval(typer);
    };
  }, [index]);

  return (
    <View style={{ flex: 1 }}>
      <CalmingBackground theme={themeKey} duration={8000} />

      <SafeAreaView style={[styles.container, { paddingTop: insets.top + 10 }]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Center headline */}
        <View style={styles.centerWrap}>
          <Animated.Text
            style={[
              styles.headline,
              BASE_HEADLINE_STYLE,
              { color: headlineColor, opacity, transform: [{ translateY }] },
            ]}
          >
            {typed}
          </Animated.Text>
        </View>

        {/* Bottom buttons */}
        <View style={[styles.bottomSection, { paddingBottom: Math.max(20, insets.bottom + 20) }]}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => navigation.navigate('SignUp')}>
            <Ionicons name="person-add-outline" size={20} color="#457B9D" style={{ marginRight: 8 }} />
            <Text style={styles.outlineButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={() => onLogin?.()}>
            <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.guestButton]} onPress={() => onLogin?.()}>
            <Ionicons name="person-outline" size={20} color="#1D3557" style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  headline: { fontSize: 26, lineHeight: 34, textAlign: 'center' },

  bottomSection: { },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#457B9D', paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#457B9D' },
  outlineButtonText: { color: '#457B9D', fontSize: 16, fontWeight: '600' },
  googleButton: { backgroundColor: '#DB4437' },
  guestButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1D3557' },
  guestButtonText: { color: '#1D3557', fontSize: 16, fontWeight: '600' },
});
