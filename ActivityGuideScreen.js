import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const affirmations = [
  "Nice work — small steps add up 🌱",
  "You showed up for yourself today. That matters 💙",
  "Proud of you for taking a breather ✨",
  "Great job — your future self thanks you 🙌",
  "Your wellbeing is worth the time 💫",
];

export default function ActivityGuideScreen({ route, navigation }) {
  const { activity } = route.params;
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const insets = useSafeAreaInsets();

  const targetSeconds = (activity?.minutes ?? 5) * 60;

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const mmss = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, [seconds]);

  const onFinish = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    const msg = affirmations[Math.floor(Math.random() * affirmations.length)];
    Alert.alert("Finished 🎉", msg, [
      {
        text: "OK",
        onPress: () => {
          const dateKey = new Date().toISOString().slice(0,10);
          navigation.navigate('ActivityHome', {
            completedLog: {
              id: `${activity.id}-${Date.now()}`,
              dateKey,
              minutes: Math.max(1, Math.round(seconds / 60)),
              activityId: activity.id,
              source: 'guide',
            }
          });
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>{activity?.title}</Text>
        <Text style={styles.meta}>{activity?.minutes} min • Guided steps</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timer}>{mmss}</Text>
          <Text style={styles.target}>
            Target: {activity?.minutes}m • {Math.min(100, Math.round((seconds/targetSeconds)*100))}%
          </Text>
          <View style={styles.timerRow}>
            {!running ? (
              <TouchableOpacity style={[styles.btn, styles.start]} onPress={() => setRunning(true)}>
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.pause]} onPress={() => setRunning(false)}>
                <Text style={styles.btnText}>Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.reset]} onPress={() => { setSeconds(0); setRunning(false); }}>
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.finish]} onPress={onFinish}>
              <Text style={styles.btnText}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.section}>Steps</Text>
        <View style={styles.stepsCard}>
          {activity?.steps?.map((s, idx) => (
            <View key={idx} style={styles.stepRow}>
              <Text style={styles.stepIndex}>{idx + 1}</Text>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F1FAEE', padding:16 },
  title:{ fontSize:22, fontWeight:'700', color:'#1D3557' },
  meta:{ fontSize:12, color:'#6C757D', marginBottom:12 },

  timerCard:{ backgroundColor:'#FFFFFF', borderRadius:12, padding:16, borderWidth:1, borderColor:'#E6ECEF', marginBottom:16 },
  timer:{ fontSize:48, fontWeight:'800', color:'#1D3557', textAlign:'center' },
  target:{ fontSize:12, color:'#6C757D', textAlign:'center', marginTop:6 },
  timerRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:12 },
  btn:{ flex:1, marginHorizontal:4, paddingVertical:12, borderRadius:10, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'700' },
  start:{ backgroundColor:'#2BB673' },
  pause:{ backgroundColor:'#457B9D' },
  reset:{ backgroundColor:'#6C757D' },
  finish:{ backgroundColor:'#FF8FA3' },

  section:{ fontSize:16, fontWeight:'700', color:'#1D3557', marginBottom:8 },
  stepsCard:{ backgroundColor:'#FFFFFF', borderRadius:12, padding:12, borderWidth:1, borderColor:'#E6ECEF' },
  stepRow:{ flexDirection:'row', alignItems:'flex-start', marginBottom:6 },
  stepIndex:{ width:20, height:20, borderRadius:10, backgroundColor:'#A8DADC', color:'#1D3557', textAlign:'center', fontWeight:'700', marginRight:8 },
  stepText:{ flex:1, color:'#2C2C2C' },
});
