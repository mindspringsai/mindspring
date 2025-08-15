import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Button } from 'react-native';

const moods = [
  { emoji: "🙂", label: "Okay" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😐", label: "Meh" },
  { emoji: "🥺", label: "Anxious" },
];

export default function MoodCheckinScreen({ navigation }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState(3); // Default: medium intensity

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>

      <View style={styles.emojiContainer}>
        {moods.map((mood, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.emojiButton,
              selectedMood === mood.label && styles.selected,
            ]}
            onPress={() => setSelectedMood(mood.label)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.intensityLabel}>Intensity: {intensity}</Text>

      <View style={styles.intensityBar}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.intensityButton,
              intensity === level && styles.intensitySelected,
            ]}
            onPress={() => setIntensity(level)}
          >
            <Text>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Continue"
        disabled={!selectedMood}
        onPress={() => {
          navigation.navigate('Journal'); // ✅ Navigate to journal screen
        }}
      />
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1D3557',
    marginBottom: 20,
    textAlign: 'center',
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emojiButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
  },
  emoji: {
    fontSize: 30,
  },
  selected: {
    backgroundColor: '#A8DADC',
  },
  intensityLabel: {
    fontSize: 16,
    color: '#2C2C2C',
    marginBottom: 10,
  },
  intensityBar: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  intensityButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#F1FAEE',
    borderWidth: 1,
    borderColor: '#6C757D',
  },
  intensitySelected: {
    backgroundColor: '#457B9D',
    borderColor: '#457B9D',
  },
});
