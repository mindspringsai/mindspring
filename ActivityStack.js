// screens/ActivityStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ActivityScreen from './ActivityScreen';
import ActivityGuideScreen from './ActivityGuideScreen';

const Stack = createNativeStackNavigator();

function BackChip() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.backChip} onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 6 }} />
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
  );
}

export default function ActivityStack() {
  return (
    <Stack.Navigator>
      {/* Home screen: no back button */}
      <Stack.Screen
        name="ActivityHome"
        component={ActivityScreen}
        options={{ headerShown: false }}
      />
      
      {/* Activity guide: custom back chip */}
      <Stack.Screen
        name="ActivityGuide"
        component={ActivityGuideScreen}
        options={{
          headerStyle: { backgroundColor: '#6A4C93' }, // Lavender theme
          headerTitle: 'Activity',
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => <BackChip />, // 👈 Custom back chip here
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D5EB7', // Slightly lighter lavender for contrast
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
