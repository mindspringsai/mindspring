import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Switch } from 'react-native';

export default function TermsScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accept Our Terms 📝</Text>
      <Text style={styles.text}>To continue, please agree to our terms of service.</Text>
      <Switch value={accepted} onValueChange={setAccepted} />
      
      <Button
        title="Continue"
        onPress={() => {
          if (accepted) {
            navigation.navigate('MoodCheckin'); // ✅ this triggers screen change
          } else {
            alert('Please accept terms to continue');
          }
        }}
      />
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
    marginBottom: 12,
  },
});
