import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

const CATALOG = [
  { id: 'breath-446', title: 'Breathing (4‑4‑6)', minutes: 3, tags: ['calm', 'quick'], steps: [
    'Inhale for 4 seconds','Hold for 4 seconds','Exhale for 6 seconds','Repeat for 3–5 minutes',
  ]},
  { id: 'box-breath', title: 'Box Breathing (4‑4‑4‑4)', minutes: 4, tags: ['focus', 'calm'], steps: [
    'Inhale 4s • Hold 4s • Exhale 4s • Hold 4s','Repeat for 4–6 rounds',
  ]},
  { id: 'body-scan', title: 'Body Scan', minutes: 6, tags: ['relax', 'mindfulness'], steps: [
    'Close eyes, breathe slowly','Scan from head to toe, notice tension','Gently release areas of tightness',
  ]},
  { id: 'stretch', title: 'Shoulder + Neck Stretch', minutes: 5, tags: ['reset', 'movement'], steps: [
    'Roll shoulders x10','Neck tilt L/R 10s each','Gentle neck circles',
  ]},
  { id: 'walk', title: 'Mindful Walk', minutes: 10, tags: ['movement', 'outdoors'], steps: [
    'Walk slowly, notice your breath','Observe sights, sounds, sensations','Finish with 3 deep breaths',
  ]},
  { id: 'gratitude', title: 'Gratitude Note', minutes: 3, tags: ['mood', 'reflect'], steps: [
    'List 3 things you’re grateful for','Why each one matters today',
  ]},
];

const daysBack = (n) => {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0,10);
    out.push({ key, date: d });
  }
  return out;
};

const Dropdown = ({ label, value, display, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrap}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text style={styles.dropdownValue}>{display(value)}</Text>
        <Text style={styles.dropdownCaret}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdownMenu}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value.toString()}
                style={styles.dropdownItem}
                onPress={() => { onChange(opt.value); setOpen(false); }}
              >
                <Text style={styles.dropdownItemText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function ActivityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState([]);
  const [range, setRange] = useState(7);
  const [metric, setMetric] = useState('minutes');
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      if (route.params?.completedLog) {
        setLogs(prev => [...prev, route.params.completedLog]);
        navigation.setParams({ completedLog: undefined });
      }
    }, [route.params?.completedLog, navigation])
  );

  const windowDays = useMemo(() => daysBack(range), [range]);

  const byDay = useMemo(() => {
    const map = new Map(windowDays.map(d => [d.key, { minutes: 0, sessions: 0 }]));
    logs.forEach((l) => {
      if (map.has(l.dateKey)) {
        const v = map.get(l.dateKey);
        v.minutes += l.minutes;
        v.sessions += 1;
      }
    });
    return windowDays.map(d => ({ dateKey: d.key, ...map.get(d.key) }));
  }, [logs, windowDays]);

  const totalMinutes = byDay.reduce((s, d) => s + d.minutes, 0);
  const totalSessions = byDay.reduce((s, d) => s + d.sessions, 0);
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = byDay.length - 1; i >= 0; i--) {
      if (byDay[i].sessions > 0) streak++;
      else break;
    }
    return streak;
  }, [byDay]);

  const bars = useMemo(() => {
    const values = byDay.map(d => (metric === 'minutes' ? d.minutes : d.sessions));
    const maxVal = Math.max(...values, 1);
    return byDay.map(d => ({
      key: d.dateKey,
      value: metric === 'minutes' ? d.minutes : d.sessions,
      height: metric === 'streak' ? 6 : Math.max(6, Math.round((d[metric] / maxVal) * 60)),
      label: d.dateKey.slice(5),
    }));
  }, [byDay, metric]);

  const visibleActivities = useMemo(() => (
    filter === 'all' ? CATALOG : CATALOG.filter(a => a.tags.includes(filter))
  ), [filter]);

  const startGuide = (activity) => {
    navigation.navigate('ActivityGuide', { activity });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView style={[styles.container]} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        <Text style={styles.title}>Wellness Activities 💪</Text>
        <Text style={styles.subtitle}>
          Welcome! Choose an activity to relax, recharge, or reset. Track your progress over time.
        </Text>

        <View style={styles.progressCard}>
          <View style={styles.dropdownRow}>
            <Dropdown
              label="Timeframe"
              value={range}
              display={(v) => (v === 7 ? 'Last 7 days' : v === 14 ? 'Last 14 days' : 'Last 30 days')}
              options={[
                { label: 'Last 7 days', value: 7 },
                { label: 'Last 14 days', value: 14 },
                { label: 'Last 30 days', value: 30 },
              ]}
              onChange={setRange}
            />
            <Dropdown
              label="Metric"
              value={metric}
              display={(v) => v === 'minutes' ? 'Minutes' : v === 'sessions' ? 'Sessions' : 'Streak'}
              options={[
                { label: 'Minutes', value: 'minutes' },
                { label: 'Sessions', value: 'sessions' },
                { label: 'Streak', value: 'streak' },
              ]}
              onChange={setMetric}
            />
          </View>

          <View style={styles.chartRow}>
            {bars.map(b => (
              <View key={b.key} style={styles.barWrap}>
                <View style={[styles.bar, { height: b.height }]} />
                <Text style={styles.barLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryRow}>
            <Summary label="Minutes" value={totalMinutes} />
            <Summary label="Sessions" value={totalSessions} />
            <Summary label="Streak" value={currentStreak + 'd'} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose an activity</Text>
        <View style={styles.filters}>
          {['all','calm','quick','focus','relax','mindfulness','reset','movement','outdoors','mood','reflect']
            .map(tag => (
              <Chip key={tag} label={tag === 'all' ? 'All' : `#${tag}`} active={filter === tag} onPress={() => setFilter(tag)} />
          ))}
        </View>

        {visibleActivities.map(a => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.cardMeta}>{a.minutes} min • {a.tags.join(' • ')}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.startBtn} onPress={() => startGuide(a)}>
                <Text style={styles.startText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Summary = ({ label, value }) => (
  <View style={styles.summaryItem}>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1FAEE', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1D3557' },
  subtitle: { fontSize: 14, color: '#6C757D', marginBottom: 12 },

  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6ECEF',
    marginBottom: 16,
  },

  dropdownRow: { flexDirection: 'row', gap: 12 },
  dropdownWrap: { flex: 1 },
  dropdownLabel: { fontSize: 12, color: '#6C757D', marginBottom: 6 },
  dropdownField: {
    backgroundColor: '#F1FAEE',
    borderWidth: 1,
    borderColor: '#E6ECEF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: { color: '#1D3557', fontWeight: '600' },
  dropdownCaret: { color: '#6C757D', marginLeft: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 24 },
  dropdownMenu: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E6ECEF' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemText: { color: '#1D3557', fontWeight: '600' },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 80, marginTop: 10, marginBottom: 8 },
  barWrap: { alignItems: 'center', justifyContent: 'flex-end', width: 18, marginHorizontal: 3 },
  bar: { width: 12, borderRadius: 6, backgroundColor: '#457B9D' },
  barLabel: { fontSize: 10, color: '#6C757D', marginTop: 2 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1D3557' },
  summaryLabel: { fontSize: 12, color: '#6C757D' },

  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 10, color: '#1D3557' },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#FFFFFF', borderColor: '#E6ECEF', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: '#A8DADC', borderColor: '#A8DADC' },
  chipText: { color: '#1D3557', fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: '#1D3557' },

  card: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E6ECEF', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1D3557' },
  cardMeta: { fontSize: 12, color: '#6C757D', marginTop: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  startBtn: { backgroundColor: '#457B9D', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  startText: { color: '#fff', fontWeight: '700' },
});
