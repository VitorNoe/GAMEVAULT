import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/ui';
import { theme } from '../config/theme';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { GameDetailScreen } from '../screens/GameDetailScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// ===== Type definitions for navigation =====
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    HomeTab: undefined;
    ExploreTab: undefined;
    CollectionTab: undefined;
    ProfileTab: undefined;
};

export type RootStackParamList = {
    MainTabs: undefined;
    GameDetail: { gameId: number; title?: string };
    Notifications: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// ===== Tab Icons (emoji-based for skeleton; swap with vector-icons later) =====
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
    HomeTab: { active: '🏠', inactive: '🏡' },
    ExploreTab: { active: '🔍', inactive: '🔎' },
    CollectionTab: { active: '🎮', inactive: '🕹️' },
    ProfileTab: { active: '👤', inactive: '👥' },
};

// ===== Auth Navigator =====
const AuthNavigator: React.FC = () => (
    <AuthStack.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
        }}
    >
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
);

// ===== Main Tab Navigator =====
const MainTabNavigator: React.FC = () => (
    <MainTab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textMuted,
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: theme.fontWeight.semibold,
            },
            tabBarIcon: () => {
                const icons = TAB_ICONS[route.name] || { active: '•', inactive: '•' };
                return null; // Emoji icons require <Text>; using label only for skeleton
            },
        })}
    >
        <MainTab.Screen
            name="HomeTab"
            component={HomeScreen}
            options={{ tabBarLabel: 'Home' }}
        />
        <MainTab.Screen
            name="ExploreTab"
            component={ExploreScreen}
            options={{ tabBarLabel: 'Explore' }}
        />
        <MainTab.Screen
            name="CollectionTab"
            component={CollectionScreen}
            options={{ tabBarLabel: 'Collection' }}
        />
        <MainTab.Screen
            name="ProfileTab"
            component={ProfileScreen}
            options={{ tabBarLabel: 'Profile' }}
        />
    </MainTab.Navigator>
);

// ===== Root Navigator =====
export const RootNavigator: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <AuthNavigator />;
    }

    return (
        <RootStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: theme.fontWeight.bold },
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
            }}
        >
            <RootStack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
            />
            <RootStack.Screen
                name="GameDetail"
                component={GameDetailScreen}
                options={({ route }) => ({
                    title: route.params?.title || 'Game Details',
                    headerBackTitle: 'Back',
                })}
            />
            <RootStack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: 'Notifications' }}
            />
        </RootStack.Navigator>
    );
};
