import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Switch,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';

const STORAGE_KEYS = {
  displayName: 'mindspring:displayName',
  bio: 'mindspring:profileBio',
  avatar: 'mindspring:avatarUri',
  journals: 'mindspring:journals',
  activityLogs: 'mindspring:activityLogs',
};

export default function ProfileScreen() {
  const { setIsLoggedIn } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('J Doe');
  const [bio, setBio] = useState('Taking it one day at a time 🌿');
  const [avatarUri, setAvatarUri] = useState('');

  const [dailyMood, setDailyMood] = useState(true);
  const [journalNudge, setJournalNudge] = useState(false);
  const [breathingPrompt, setBreathingPrompt] = useState(false);
  const [anonymousStories, setAnonymousStories] = useState(true);

  const [journalCount, setJournalCount] = useState(0);
  const [activitySessions, setActivitySessions] = useState(0);
  const [activityMinutes, setActivityMinutes] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [name, bioTxt, avatar, journalsRaw, activityRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.displayName),
          AsyncStorage.getItem(STORAGE_KEYS.bio),
          AsyncStorage.getItem(STORAGE_KEYS.avatar),
          AsyncStorage.getItem(STORAGE_KEYS.journals),
          AsyncStorage.getItem(STORAGE_KEYS.activityLogs),
        ]);

        if (name) setDisplayName(name);
        if (bioTxt) setBio(bioTxt);
        if (avatar) setAvatarUri(avatar);

        if (journalsRaw) {
          const list = JSON.parse(journalsRaw);
          setJournalCount(Array.isArray(list) ? list.length : 0);
        }
        if (activityRaw) {
          const logs = JSON.parse(activityRaw) || [];
          setActivitySessions(logs.length);
          const totalMin = logs.reduce((s, l) => s + (l.minutes || 0), 0);
          setActivityMinutes(totalMin);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const openEditor = () => {
    setEditName(displayName);
    setEditBio(bio);
    setEditOpen(true);
  };

  const saveProfile = async () => {
    try {
      const name = (editName || '').trim() || 'J Doe';
      const about = (editBio || '').trim();
      setDisplayName(name);
      setBio(about);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.displayName, name),
        AsyncStorage.setItem(STORAGE_KEYS.bio, about),
      ]);

      setEditOpen(false);
    } catch {
      Alert.alert('Error', 'Could not save your profile.');
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to change your avatar.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (uri) {
      setAvatarUri(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.avatar, uri);
    }
  };

  const exportAllData = async () => {
    try {
      const [journalsRaw, activityRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.journals),
        AsyncStorage.getItem(STORAGE_KEYS.activityLogs),
      ]);
      const payload = {
        profile: { displayName, bio, avatarUri: avatarUri || null },
        journals: journalsRaw ? JSON.parse(journalsRaw) : [],
        activities: activityRaw ? JSON.parse(activityRaw) : [],
        exportedAt: new Date().toISOString(),
      };
      const fileUri = FileSystem.cacheDirectory + `mindspring-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      Alert.alert('Export Error', 'Could not export your data.');
    }
  };

  const logout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => setIsLoggedIn(false) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1FAEE' }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        {/* Identity */}
        <Text style={styles.header}>Your Profile</Text>
        <Text style={styles.subheader}>Customize your space and track your journey</Text>

        <View style={styles.identityRow}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarFallback}>😊</Text>
              )}
            </View>
            <Text style={styles.changeText}>Change photo</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.bioText}>{bio}</Text>

            <TouchableOpacity style={styles.editBtn} onPress={openEditor}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{journalCount}</Text>
            <Text style={styles.statLabel}>Journal entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activitySessions}</Text>
            <Text style={styles.statLabel}>Activity sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activityMinutes}</Text>
            <Text style={styles.statLabel}>Minutes practiced</Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>
          <PrefRow label="Daily mood reminder" value={dailyMood} onValueChange={setDailyMood} />
          <PrefRow label="Journal nudge" value={journalNudge} onValueChange={setJournalNudge} />
          <PrefRow label="Breathing prompt" value={breathingPrompt} onValueChange={setBreathingPrompt} />
          <PrefRow label="Post stories anonymously" value={anonymousStories} onValueChange={setAnonymousStories} />
        </View>

        {/* Export & Support */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.exportBtn]} onPress={exportAllData}>
            <Text style={styles.actionText}>Export My Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={logout}>
            <Text style={styles.actionText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>Member since {new Date().getFullYear()}</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your name"
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.modalLabel}>Affirmation / Bio</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Short affirmation or bio…"
              value={editBio}
              onChangeText={setEditBio}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSave]} onPress={saveProfile}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PrefRow({ label, value, onValueChange }) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#1D3557' },
  subheader: { fontSize: 14, color: '#6C757D', marginBottom: 12 },

  identityRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 12 },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E6ECEF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: { fontSize: 32 },
  changeText: { color: '#457B9D', fontSize: 12, textAlign: 'center', marginTop: 6 },

  nameText: { fontSize: 20, fontWeight: '800', color: '#1D3557' },
  bioText: { fontSize: 14, color: '#2C2C2C', marginTop: 4 },
  editBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#A8DADC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editBtnText: { color: '#1D3557', fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECEF'
  },
  statValue: { color: '#1D3557', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#6C757D', fontSize: 12, marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6ECEF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { color: '#1D3557', fontWeight: '700', marginBottom: 8 },

  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  prefLabel: { color: '#1D3557', fontSize: 14 },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  exportBtn: { backgroundColor: '#457B9D' },
  logoutBtn: { backgroundColor: '#FF8FA3' },
  actionText: { color: '#FFFFFF', fontWeight: '700' },

  footerNote: { color: '#6C757D', fontSize: 12, marginTop: 10, textAlign: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E6ECEF',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1D3557' },
  modalLabel: { fontSize: 12, color: '#6C757D', marginTop: 10 },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6ECEF',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: '#1D3557',
    marginTop: 6,
  },
  modalRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalCancel: { backgroundColor: '#A8DADC' },
  modalSave: { backgroundColor: '#457B9D' },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700' },
  modalBtnTextCancel: { color: '#1D3557', fontWeight: '700' },
});
