import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ConsentScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>We care about your privacy 💙</Text>
      <Text style={styles.text}>
        MindSpring is a non-clinical space. We never sell your data, and you have full control over what you share.
      </Text>
      <Button title="I Understand" onPress={() => navigation.navigate('Terms')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1FAEE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D3557',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 24,
  },
});
