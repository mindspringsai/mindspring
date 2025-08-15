// screens/AIChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CalmingBackground from '../components/CalmingBackground';

/**
 * ===== OpenRouter (demo) =====
 * Replace with your key for testing. Move to secure storage for real apps.
 */
const OPENROUTER_API_KEY = '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'; // <-- paste your key
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'openrouter/auto'; // OpenRouter picks a usually-available free model
const BACKUP_MODEL  = 'meta-llama/llama-3.1-8b-instruct:free'; // fallback if primary fails

// Greeting + formatting helpers
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 17) return 'Good evening';
  if (hour >= 12) return 'Good afternoon';
  return 'Good morning';
};
const formatName = (raw) =>
  raw.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// light crisis keyword check (client-side nudge only)
const crisisRegex = /(kill myself|suicide|end my life|hurt myself|i want to die|self[-\s]?harm)/i;

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [askingName, setAskingName] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  // intro
  useEffect(() => {
    setMessages([{
      id: 'intro',
      text: `${getTimeGreeting()} 😊 Before we start, what should I call you? You can say “J Doe” or tell me your name.`,
      sender: 'bot',
    }]);
  }, []);

  // autoscroll on new content
  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const greetWithName = (name) => {
    const safeName = name || 'J Doe';
    const greeting = `${getTimeGreeting()}, ${safeName} 😊 I'm here to support you. What's on your mind?`;
    setMessages((prev) => [...prev, { id: Date.now().toString() + '-greet', text: greeting, sender: 'bot' }]);
  };

  const handleNameCapture = (raw) => {
    const cleaned = formatName(raw || '');
    const finalName = cleaned.length >= 2 ? cleaned : 'J Doe';
    setAskingName(false);
    greetWithName(finalName);
  };

  // Convert local history to OpenAI-style messages + few-shot exemplars
  const toChatMessages = (history) => {
    const system = {
      role: 'system',
      content:
        "You are MindSpring, a warm, supportive mental wellness companion. Respond in 1–4 short sentences, concrete and actionable. Offer one gentle suggestion (e.g., a 4‑4‑6 breath, 5‑4‑3‑2‑1 grounding, or a tiny next step). Avoid diagnosis. If the user describes imminent harm, advise contacting local emergency services and share a crisis resource. Use a calm, friendly tone.",
    };

    const shots = [
      { role: 'user', content: "I'm overwhelmed. Too much to do." },
      { role: 'assistant', content: "That sounds heavy. Try a quick reset: inhale 4s, hold 4s, exhale 6s (x5). Then pick just one doable next step and set a 10‑minute timer. Want help choosing that step?" },
      { role: 'user', content: "I feel numb and can't sleep." },
      { role: 'assistant', content: "Thanks for sharing—numbness can feel scary. Try a 5‑4‑3‑2‑1 grounding scan, then a slow body scan with dim lights. If sleep stays tough, we can create a gentle wind‑down routine together." },
    ];

    const rest = history.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    // keep context modest so small/free models stay focused
    const trimmed = rest.slice(-12);
    return [system, ...shots, ...trimmed];
  };

  // OpenRouter call with fallback
  const callOpenRouter = async (historyPlusUser) => {
    const headers = {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // Recommended meta headers for OpenRouter
      'HTTP-Referer': 'https://mindspring-demo.local',
      'X-Title': 'MindSpring Demo',
    };

    const payload = (model) => ({
      model,
      messages: toChatMessages(historyPlusUser),
      temperature: 0.4,     // tighter
      max_tokens: 180,      // concise
    });

    const tryOnce = async (model) => {
      const resp = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload(model)),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        throw new Error(`OpenRouter ${resp.status}: ${t || 'Request failed'}`);
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content?.trim() || '';
      if (!content) throw new Error('Empty completion');
      return content;
    };

    // primary → backup → local graceful reply
    try {
      return await tryOnce(PRIMARY_MODEL);
    } catch (e1) {
      console.warn('Primary failed:', e1?.message || e1);
      try {
        return await tryOnce(BACKUP_MODEL);
      } catch (e2) {
        console.warn('Backup failed:', e2?.message || e2);
        return "Thanks for opening up. Let’s try a quick 60‑second reset: inhale 4s • hold 4s • exhale 6s (x5). What’s one tiny step you could take after that—like a glass of water or a 5‑minute stretch?";
      }
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now().toString(), text: trimmed, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    if (askingName) {
      handleNameCapture(trimmed);
      return;
    }

    setIsTyping(true);
    let replyText = await callOpenRouter([...messages, userMessage]);
    setIsTyping(false);

    // add a crisis-aware nudge locally (non-diagnostic)
    if (crisisRegex.test(trimmed)) {
      replyText += "\n\nIf you’re in immediate danger, please contact local emergency services or a trusted person. In the US: dial 988 (Suicide & Crisis Lifeline) or text HOME to 741741.";
    }

    setMessages((prev) => [...prev, { id: Date.now().toString() + 'b', text: replyText, sender: 'bot' }]);
  };

  const renderBubble = ({ item }) => {
    if (item.id === 'typing') {
      return (
        <View style={[styles.message, styles.bot, { flexDirection: 'row', alignItems: 'center' }]}>
          <ActivityIndicator size="small" />
          <Text style={[styles.messageText, { marginLeft: 8, opacity: 0.8 }]}>Typing…</Text>
        </View>
      );
    }
    return (
      <View style={[styles.message, item.sender === 'user' ? styles.user : styles.bot]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  const data = [...messages, ...(isTyping ? [{ id: 'typing', text: '', sender: 'bot' }] : [])];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <CalmingBackground theme="blues" duration={14000} />
      <KeyboardAvoidingView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={data}
          renderItem={renderBubble}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputRow, { paddingBottom: Math.max(14, 14) }]}>
          <TextInput
            style={styles.input}
            placeholder={askingName ? 'Type your name (e.g., J Doe)…' : 'Say anything…'}
            placeholderTextColor="#6C757D"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isTyping}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{isTyping ? '…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  message: {
    padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '80%',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  user: { backgroundColor: '#A8DADC', alignSelf: 'flex-end' },
  bot: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6ECEF', alignSelf: 'flex-start' },
  messageText: { fontSize: 16, color: '#1D3557' },
  inputRow: {
    flexDirection: 'row', paddingTop: 12, paddingHorizontal: 12, borderTopWidth: 1,
    borderColor: '#E6ECEF', backgroundColor: 'rgba(255,255,255,0.95)',
  },
  input: {
    flex: 1, padding: 12, borderWidth: 1, borderColor: '#E6ECEF', borderRadius: 10,
    marginRight: 10, backgroundColor: '#F9FBFC', color: '#1D3557',
  },
  sendButton: {
    backgroundColor: '#457B9D', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center',
  },
});
