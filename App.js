// App.js
import "react-native-gesture-handler";
import React, { useState, useMemo, createContext } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

// Screens
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import AIChatScreen from "./screens/AIChatScreen";
import JournalScreen from "./screens/JournalScreen";
import CommunityCornerScreen from "./screens/CommunityCornerScreen";
// If ActivityStack is a folder with index.js, keep this import.
// If it's a single file ActivityStack.js, this is also fine.
import ActivityStack from "./screens/ActivityStack";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CalmTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F1FAEE",
    card: "#FFFFFF",
    text: "#1D3557",
    primary: "#457B9D",
    border: "#E6ECEF",
    notification: "#FF8FA3",
  },
};

export const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});

function MainAppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#457B9D",
        tabBarInactiveTintColor: "#6C757D",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E6ECEF",
          height: 56 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 6,
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => {
          let icon = "ellipse";
          if (route.name === "Profile") icon = focused ? "person" : "person-outline";
          if (route.name === "Activity") icon = focused ? "fitness" : "fitness-outline";
          if (route.name === "Chat") icon = focused ? "chatbubble" : "chatbubble-outline";
          if (route.name === "Journal") icon = focused ? "create" : "create-outline";
          if (route.name === "Community") icon = focused ? "leaf" : "leaf-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Activity" component={ActivityStack} />
      <Tab.Screen name="Chat" component={AIChatScreen} options={{ title: "MindSpring" }} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Community" component={CommunityCornerScreen} options={{ title: "Wellness" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const authValue = useMemo(() => ({ isLoggedIn, setIsLoggedIn }), [isLoggedIn]);

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authValue}>
        <NavigationContainer theme={CalmTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={isLoggedIn ? "MainApp" : "Onboarding"}
          >
            {isLoggedIn ? (
              <Stack.Screen name="MainApp" component={MainAppTabs} />
            ) : (
              <>
                <Stack.Screen name="Onboarding">
                  {(props) => <OnboardingScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
                </Stack.Screen>
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
                </Stack.Screen>
                <Stack.Screen name="SignUp">
                  {(props) => <SignUpScreen {...props} onSignup={() => setIsLoggedIn(true)} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
