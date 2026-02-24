import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/config/theme';

const App: React.FC = () => {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <NotificationProvider>
                    <NavigationContainer
                        theme={{
                            dark: true,
                            colors: {
                                primary: theme.colors.primary,
                                background: theme.colors.background,
                                card: theme.colors.surface,
                                text: theme.colors.text,
                                border: theme.colors.border,
                                notification: theme.colors.accent,
                            },
                        }}
                    >
                        <StatusBar
                            barStyle="light-content"
                            backgroundColor={theme.colors.background}
                            translucent
                        />
                        <RootNavigator />
                    </NavigationContainer>
                </NotificationProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
};

export default App;
