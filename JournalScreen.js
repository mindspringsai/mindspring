// screens/JournalScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing'; // kept for opening/sharing individual attachments from the modal
import { useRoute } from '@react-navigation/native';
import CalmingBackground from '../components/CalmingBackground';

const STORAGE_KEY = 'mindspring:journals';

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [
    { label: 'All time', value: 'all' },
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
  ];

  const currentLabel =
    options.find(o => o.value === value)?.label ?? 'All time';

  return (
    <View style={{ position: 'relative' }}>
      <Text style={styles.filterLabel}>Timeframe</Text>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(true)}>
        <Text style={styles.dropdownValue}>{currentLabel}</Text>
        <Text style={styles.dropdownCaret}>▾</Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.dropdownMenu}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.dropdownItem}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function JournalScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Composer state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ uri, name, mime }]

  // Persisted entries
  const [entries, setEntries] = useState([]); // [{id, title, body, createdAt, attachments}]
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [active, setActive] = useState(null); // selected entry
  const [editTitle, setEditTitle] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all'); // 'all' | '7' | '30' | '90'

  // Audio recording
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const intervalRef = useRef(null);

  /* -------- Prefill from navigation -------- */
  useEffect(() => {
    if (route.params?.journalText) setBody(route.params.journalText);
  }, [route.params?.journalText]);

  /* -------- Load saved entries -------- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load journals', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next) => {
    setEntries(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      Alert.alert('Save Error', 'Could not persist your journal locally.');
    }
  };

  const nowLabel = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /* -------- Create entry -------- */
  const createEntry = async () => {
    if (!body.trim() && attachments.length === 0) {
      Alert.alert('Empty Entry', 'Write something or attach a file before saving.');
      return;
    }
    const entry = {
      id: `${Date.now()}`,
      title: title.trim() || `Journal ${nowLabel()}`,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      attachments,
    };
    const next = [entry, ...entries];
    await persist(next);
    setTitle('');
    setBody('');
    setAttachments([]);
    Alert.alert('Saved ✨', 'Your journal was saved.');
  };

  /* -------- Open, edit, delete -------- */
  const openEntry = (e) => {
    setActive(e);
    setEditTitle(e.title);
  };

  const saveTitleEdit = async () => {
    if (!active) return;
    const next = entries.map((e) =>
      e.id === active.id ? { ...e, title: editTitle.trim() || e.title } : e
    );
    await persist(next);
    setActive({ ...active, title: editTitle.trim() || active.title });
    Alert.alert('Updated', 'Title updated.');
  };

  const deleteEntry = async (id) => {
    Alert.alert('Delete Entry', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = entries.filter((x) => x.id !== id);
          await persist(next);
          setActive(null);
        },
      },
    ]);
  };

  /* -------- Attach files / audio import -------- */
  const pickFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['audio/*', '*/*'],
    });
    if (res.canceled) return;
    const files = (res.assets || []).map((a) => ({
      uri: a.uri,
      name: a.name || 'attachment',
      mime: a.mimeType || 'application/octet-stream',
    }));
    setAttachments((prev) => [...prev, ...files]);
  };

  /* -------- Audio Recording (Expo AV) -------- */
  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordSec(0);
      intervalRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);
    } catch (e) {
      console.warn('Record error', e);
      Alert.alert('Recording Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      clearInterval(intervalRef.current);
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setIsRecording(false);
      setAttachments((prev) => [
        ...prev,
        { uri, name: `voice-${Date.now()}.m4a`, mime: 'audio/m4a' },
      ]);
      recordingRef.current = null;
      setRecordSec(0);
    } catch (e) {
      console.warn('Stop record error', e);
      setIsRecording(false);
      setRecordSec(0);
    }
  };

  /* -------- Filters (query + timeframe) -------- */
  const matchesQuery = (e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q);
  };

  const withinRange = (e) => {
    if (range === 'all') return true;
    const days = parseInt(range, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(e.createdAt) >= cutoff;
  };

  const filtered = useMemo(() => {
    return entries
      .filter((e) => matchesQuery(e) && withinRange(e))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [entries, query, range]);

  /* -------- Render -------- */
  const renderItem = ({ item }) => {
    const date = new Date(item.createdAt);
    const meta = date.toLocaleString();
    return (
      <TouchableOpacity style={styles.entryRow} onPress={() => openEntry(item)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.entryMeta}>{meta}</Text>
          <Text style={styles.entryPreview} numberOfLines={2}>{item.body}</Text>
          {item.attachments?.length > 0 && (
            <Text style={styles.attachMeta}>{item.attachments.length} attachment(s)</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      {/* Calming animated background */}
      <CalmingBackground theme="greens" duration={14000} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <Text style={styles.title}>Journal 📝</Text>
          <Text style={styles.subtitle}>
            Capture thoughts, attach audio/files, and search your history.
          </Text>

          {/* Search + timeframe dropdown */}
          <View style={styles.toolbar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Search</Text>
              <TextInput
                style={styles.search}
                placeholder="Search title or text…"
                placeholderTextColor="#6C757D"
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <View style={{ width: 14 }} />
            <View style={{ width: 170 }}>
              <RangeDropdown value={range} onChange={setRange} />
            </View>
          </View>

          {/* Composer */}
          <View style={styles.card}>
            <TextInput
              style={styles.titleInput}
              placeholder="Optional title (e.g., 'Post‑exam thoughts')"
              placeholderTextColor="#6C757D"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.bodyInput}
              placeholder="Type your journal..."
              placeholderTextColor="#6C757D"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
            {/* Attachments row */}
            <View style={styles.attachRow}>
              {!isRecording ? (
                <TouchableOpacity style={[styles.btnTiny, styles.micBtn]} onPress={startRecording}>
                  <Text style={styles.btnTinyText}>🎤 Record</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.btnTiny, styles.stopBtn]} onPress={stopRecording}>
                  <Text style={styles.btnTinyText}>⏹ Stop ({recordSec}s)</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.btnTiny, styles.pickBtn]} onPress={pickFiles}>
                <Text style={styles.btnTinyText}>📎 Attach</Text>
              </TouchableOpacity>
              <Text style={styles.attachInfo}>
                {attachments.length > 0 ? `${attachments.length} file(s) attached` : 'No attachments'}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={createEntry}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.clearBtn]}
                onPress={() => { setTitle(''); setBody(''); setAttachments([]); }}
              >
                <Text style={[styles.btnText, { color: '#1D3557' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* History */}
          <Text style={styles.section}>Your Entries</Text>
          {loading ? (
            <Text style={{ color: '#6C757D' }}>Loading…</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: '#6C757D' }}>No entries match your filters.</Text>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            />
          )}

          {/* Detail Modal */}
          <Modal visible={!!active} transparent animationType="slide" onRequestClose={() => setActive(null)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalTitleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                />
                <Text style={styles.modalLabel}>Entry</Text>
                <ScrollView style={styles.modalBodyBox}>
                  <Text style={styles.modalBodyText}>{active?.body}</Text>
                </ScrollView>
                <Text style={styles.modalMeta}>
                  Saved: {active ? new Date(active.createdAt).toLocaleString() : ''}
                </Text>

                {/* Attachments preview with open/share */}
                {active?.attachments?.length > 0 && (
                  <>
                    <Text style={[styles.modalLabel, { marginTop: 10 }]}>Attachments</Text>
                    {active.attachments.map((a, idx) => (
                      <View key={idx} style={styles.attachmentRow}>
                        <Text style={styles.attachmentName} numberOfLines={1}>• {a.name}</Text>
                        <TouchableOpacity
                          style={[styles.btnTiny, styles.openBtn]}
                          onPress={() => Sharing.shareAsync(a.uri)}
                        >
                          <Text style={styles.btnTinyText}>Open/Share</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.modalRow}>
                  <TouchableOpacity style={[styles.btn, styles.updateBtn]} onPress={saveTitleEdit}>
                    <Text style={styles.btnText}>Update Title</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => deleteEntry(active.id)}>
                    <Text style={styles.btnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.modalClose} onPress={() => setActive(null)}>
                  <Text style={{ color: '#1D3557', fontWeight: '700' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

/* -------- styles -------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1D3557' },
  subtitle: { fontSize: 14, color: '#2C2C2C', marginBottom: 12 },

  // Toolbar (Search + Dropdown)
  toolbar: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  filterLabel: { fontSize: 12, color: '#6C757D', marginBottom: 6 },
  search: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6ECEF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#1D3557',
  },

  // Dropdown (timeframe)
  dropdownField: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#E6ECEF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: { color: '#1D3557', fontWeight: '700' },
  dropdownCaret: { color: '#6C757D', marginLeft: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 24 },
  dropdownMenu: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E6ECEF' },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemText: { color: '#1D3557', fontWeight: '600' },

  // Card / composer
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6ECEF',
    marginBottom: 16,
  },
  titleInput: {
    backgroundColor: '#F9FBFC',
    borderColor: '#E6ECEF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    color: '#1D3557',
  },
  bodyInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6ECEF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    height: 120,
    marginBottom: 10,
    color: '#2C2C2C',
  },

  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  btnTiny: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  btnTinyText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  micBtn: { backgroundColor: '#2BB673' },
  stopBtn: { backgroundColor: '#FF8FA3' },
  pickBtn: { backgroundColor: '#457B9D' },
  openBtn: { backgroundColor: '#457B9D' },
  attachInfo: { color: '#1D3557', fontSize: 12, flex: 1 },

  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  saveBtn: { backgroundColor: '#457B9D' },
  clearBtn: { backgroundColor: '#A8DADC' },
  btnText: { color: '#FFFFFF', fontWeight: '700' },

  section: { fontSize: 18, fontWeight: '700', marginVertical: 10, color: '#1D3557' },

  entryRow: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6ECEF',
    padding: 12,
    marginBottom: 10,
  },
  entryTitle: { color: '#1D3557', fontWeight: '700', fontSize: 16 },
  entryMeta: { color: '#6C757D', fontSize: 12, marginTop: 2, marginBottom: 6 },
  entryPreview: { color: '#2C2C2C' },
  attachMeta: { color: '#6C757D', fontSize: 12, marginTop: 4 },

  modalBackdrop2: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E6ECEF'
  },
  modalLabel: { fontSize: 12, color: '#6C757D', marginTop: 6 },
  modalTitleInput: {
    backgroundColor: '#F9FBFC',
    borderColor: '#E6ECEF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: '#1D3557',
  },
  modalBodyBox: { maxHeight: 200, marginTop: 8, borderColor: '#E6ECEF', borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: '#FFFFFF' },
  modalBodyText: { color: '#2C2C2C', lineHeight: 20 },
  modalMeta: { fontSize: 12, color: '#6C757D', marginTop: 8 },
  modalRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  updateBtn: { backgroundColor: '#2BB673', flex: 1 },
  deleteBtn: { backgroundColor: '#FF8FA3', flex: 1 },
  modalClose: { marginTop: 10, alignItems: 'center' },

  attachmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  attachmentName: { color: '#2C2C2C', flex: 1, marginRight: 8 },
});
