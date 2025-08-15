// screens/CommunityCornerScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FeaturedStoriesCarousel({ stories = [] }) {
  const data = useMemo(() => stories.slice(0, 5), [stories]);
  const [activeIdx, setActiveIdx] = useState(0);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  // Keep dots in sync with whatever is visible
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length) {
      const first = viewableItems[0].index ?? 0;
      setActiveIdx(first);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderItem = ({ item }) => (
    <View style={{ width: SCREEN_WIDTH }}>
      <View style={[styles.card, styles.featured]}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>by {item.author}</Text>
        <Text style={styles.cardContent}>{item.content}</Text>
      </View>
    </View>
  );

  // Auto-advance every 5s (resets after swipes)
  useEffect(() => {
    if (!data.length) return () => {};

    // clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const nextIndex = (activeIdx + 1) % data.length;
      // guard against race conditions if FlatList isn't ready yet
      try {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIdx(nextIndex);
      } catch {
        // no-op if not ready; timer will try again
      }
    }, 5000);

    return () => clearInterval(timerRef.current);
  }, [activeIdx, data.length]);

  // Helps FlatList compute positions instantly
  const getItemLayout = (_, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  if (!data.length) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        bounces
        scrollEventThrottle={16}
      />
      <View style={styles.dotsRow}>
        {data.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function CommunityCornerScreen() {
  const insets = useSafeAreaInsets();

  const [stories, setStories] = useState([
    { id: '1', title: 'How I overcame anxiety', author: 'Mia', content: 'I started small — taking daily walks and journaling helped me find peace again. Slowly, my anxiety no longer controlled my life.' },
    { id: '2', title: 'Finding hope after burnout', author: 'Sam', content: 'After leaving a toxic workplace, I focused on rest and therapy. It took months, but I finally feel like myself again.' },
    { id: '3', title: 'My path to self-acceptance', author: 'Aisha', content: 'For years, I felt I wasn’t enough. Through counseling and support groups, I learned to value who I am, imperfections and all.' },
    { id: '4', title: 'Why I started therapy', author: 'Leo', content: 'I was skeptical at first, but therapy became my lifeline. Having a safe space to share my fears made all the difference.' },
    { id: '5', title: 'Recovering from loss', author: 'Ella', content: 'Grief felt endless, but connecting with others who had similar experiences reminded me I wasn’t alone — and healing began.' },
    { id: '6', title: 'Breaking the cycle of stress', author: 'Noah', content: 'Learning breathing exercises and setting boundaries helped me stop living in constant fight-or-flight mode.' },
  ]);

  const resources = [
    { title: 'Jigsaw – Mental Health Support', link: 'https://jigsaw.ie', description: 'Free, confidential support for young people aged 12–25, online and in-person.' },
    { title: 'Free Legal Advice Centres (FLAC)', link: 'https://www.flac.ie', description: 'Free legal information and advice on housing, work, family, and more.' },
    { title: 'HSE – Medical Card & GP Visit Card', link: 'https://www2.hse.ie/medical-card', description: 'Apply for free GP visits, hospital care, and reduced prescription costs.' },
    { title: 'Befrienders Worldwide (Global)', link: 'https://www.befrienders.org/', description: 'International emotional support for anyone feeling distressed or suicidal.' },
    { title: 'Threshold – Tenant & Housing Support', link: 'https://www.threshold.ie', description: 'Free advice for renters and help preventing homelessness.' },
    { title: 'SUSI – Student Grant Scheme', link: 'https://susi.ie', description: 'Apply for grants to help cover college fees and living costs.' },
    { title: 'MABS – Money Advice & Budgeting Service', link: 'https://www.mabs.ie', description: 'Free help with budgeting, debt solutions, and financial planning.' },
    { title: 'SpunOut.ie – Student & Study Resources', link: 'https://spunout.ie/education', description: 'Tips, guides, and advice for study skills and managing college life.' },
  ];

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Error', 'Something went wrong opening that link.');
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const addStory = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const s = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      author: 'Anonymous',
      content: newContent.trim(),
    };
    setStories((prev) => [s, ...prev]);
    setNewTitle('');
    setNewContent('');
    setShowForm(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      {/* Locked lavender → deep purple gradient */}
      <LinearGradient
        colors={['#7A5FA3', '#4B2E83']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <Text style={styles.header}>Wellness Corner 🌿</Text>
        <Text style={styles.subHeader}>Your safe place for resources, stories, and support</Text>

        {/* Featured Stories — swipeable + auto-advance */}
        <Text style={styles.sectionTitle}>🌟 Featured Stories</Text>
        <FeaturedStoriesCarousel stories={stories} />

        {/* Resources */}
        <Text style={styles.sectionTitle}>📌 Key Resources</Text>
        {resources.map((r, idx) => (
          <TouchableOpacity key={idx} style={styles.card} onPress={() => openLink(r.link)}>
            <Text style={styles.cardTitle}>{r.title}</Text>
            <Text style={styles.cardLink}>{r.link}</Text>
            <Text style={[styles.cardContent, { marginTop: 4 }]}>{r.description}</Text>
          </TouchableOpacity>
        ))}

        {/* Community Stories */}
        <View style={styles.storyHeader}>
          <Text style={styles.sectionTitle}>💬 Community Stories</Text>
          <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addStoryBtn}>{showForm ? 'Cancel' : '+ Share Your Story'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.form}>
            <TextInput
              placeholder="Story Title"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Your Story"
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={newContent}
              onChangeText={setNewContent}
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              multiline
            />
            <TouchableOpacity style={styles.submitBtn} onPress={addStory}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Post</Text>
            </TouchableOpacity>
          </View>
        )}

        {stories.map((story) => (
          <View key={story.id} style={styles.card}>
            <Text style={styles.cardTitle}>{story.title}</Text>
            <Text style={styles.cardMeta}>by {story.author}</Text>
            <Text style={styles.cardContent}>{story.content}</Text>
          </View>
        ))}

        {/* Quick Tools */}
        <Text style={styles.sectionTitle}>🧘 Quick Self-Help</Text>
        <View style={styles.quickRow}>
          <Chip label="Breathing (4-4-6)" onPress={() => Alert.alert('Breathing', 'Inhale 4s • Hold 4s • Exhale 6s • Repeat x5')} />
          <Chip label="5-4-3-2-1" onPress={() => Alert.alert('Grounding', 'See 5 • Touch 4 • Hear 3 • Smell 2 • Taste 1')} />
          <Chip label="Hydrate + Stretch" onPress={() => Alert.alert('Hydration', 'Sip water + shoulder rolls for 20s')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Chip = ({ label, onPress }) => (
  <TouchableOpacity style={styles.quickChip} onPress={onPress}>
    <Text style={styles.quickText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  subHeader: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 10, color: '#FFFFFF' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featured: { borderColor: 'rgba(255,255,255,0.5)' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  cardMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  cardContent: { color: '#FFFFFF' },
  cardLink: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#FFFFFF', width: 18 },

  storyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addStoryBtn: { color: '#FFFFFF', fontWeight: '600' },
  form: { marginVertical: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: 'rgba(69,123,157,0.85)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  quickChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  quickText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
});
