import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MindSpring 🌱</Text>
      <Text style={styles.subtitle}>A calm space for your emotional wellbeing.</Text>
      <Button title="Get Started" onPress={() => navigation.navigate('Consent')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FAEE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D3557',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#457B9D',
    textAlign: 'center',
    marginBottom: 24,
  },
});
