import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { Screen, Input, Button } from '../../components/ui';
import { theme } from '../../config/theme';
import type { AuthStackParamList } from '../../navigation/RootNavigator';

type LoginScreenNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<{ navigation: LoginScreenNav }> = ({
    navigation,
}) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login({ email: email.trim(), password });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo / Brand */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🎮</Text>
                        <Text style={styles.appName}>GameVault</Text>
                        <Text style={styles.tagline}>Your digital game collection</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>{error}</Text>
                            </View>
                        ) : null}

                        <Input
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={{ marginTop: theme.spacing.sm }}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerLink}> Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.xxxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
    },
    appName: {
        fontSize: theme.fontSize.hero,
        fontWeight: theme.fontWeight.extrabold,
        color: theme.colors.primary,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    form: {
        width: '100%',
    },
    errorBanner: {
        backgroundColor: `${theme.colors.error}20`,
        borderWidth: 1,
        borderColor: theme.colors.error,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    errorBannerText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.xxl,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
    },
    footerLink: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
});
