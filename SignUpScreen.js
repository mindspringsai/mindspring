import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CalmingBackground from '../components/CalmingBackground';

export default function SignUpScreen({ navigation, onSignup }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const chipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chipAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [chipAnim]);

  const handleSignUp = () => {
    if (!email || !password || !confirm) return Alert.alert('Missing Info', 'Please fill out all fields.');
    if (password !== confirm) return Alert.alert('Passwords do not match');
    if (email && password.length >= 6) {
      Alert.alert('✅ Account Created!', 'Welcome to MindSpring.');
      onSignup?.();
    } else {
      Alert.alert('Sign Up Error', 'Invalid email or password.');
    }
  };

  const chipStyle = {
    opacity: chipAnim,
    transform: [{
      translateY: chipAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
    }],
  };

  return (
    <View style={{ flex: 1 }}>
      <CalmingBackground theme="blues" duration={8000} />

      {/* Back chip with safe-area top inset */}
      <Animated.View style={[styles.backChip, { top: insets.top + 12 }, chipStyle]}>
        <TouchableOpacity style={styles.backInner} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#1D3557" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </Animated.View>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.logo}>🌱 MindSpring</Text>
          <Text style={styles.title}>Create Your Account ✨</Text>
          <Text style={styles.subtitle}>Join us on your wellness journey.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.8)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.8)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(255,255,255,0.8)"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Log In</Text>
          </TouchableOpacity>

          <Text style={styles.smallPrint}>By signing up you agree to our Terms & Privacy Policy.</Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backChip: { position: 'absolute', left: 20, zIndex: 10 },
  backInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backText: { color: '#1D3557', fontSize: 14, fontWeight: '600', marginLeft: 4 },

  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 20, color: '#FFFFFF', fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  input: {
    width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, color: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  button: {
    width: '100%', maxWidth: 400, backgroundColor: 'rgba(69,123,157,0.85)',
    padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 10,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  link: { fontSize: 14, color: '#FFFFFF', textAlign: 'center', textDecorationLine: 'underline', marginTop: 4 },
  smallPrint: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 10 },
});
