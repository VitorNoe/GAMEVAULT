import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { theme } from '../config/theme';

// ===== Loading Spinner =====
export const Loading: React.FC<{ size?: 'small' | 'large'; color?: string }> = ({
    size = 'large',
    color = theme.colors.primary,
}) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size={size} color={color} />
    </View>
);

// ===== Screen Wrapper =====
export const Screen: React.FC<{
    children: React.ReactNode;
    style?: ViewStyle;
}> = ({ children, style }) => (
    <View style={[styles.screen, style]}>{children}</View>
);

// ===== Card =====
export const Card: React.FC<{
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}> = ({ children, style, onPress }) => {
    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.card, style]}
            >
                {children}
            </TouchableOpacity>
        );
    }
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

// ===== Button =====
interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    style,
}) => {
    const btnStyle: ViewStyle[] = [styles.button];
    const txtStyle: TextStyle[] = [styles.buttonText];

    if (variant === 'primary') {
        btnStyle.push(styles.buttonPrimary);
        txtStyle.push({ color: theme.colors.white });
    } else if (variant === 'secondary') {
        btnStyle.push(styles.buttonSecondary);
        txtStyle.push({ color: theme.colors.primary });
    } else if (variant === 'outline') {
        btnStyle.push(styles.buttonOutline);
        txtStyle.push({ color: theme.colors.primary });
    } else {
        btnStyle.push(styles.buttonGhost);
        txtStyle.push({ color: theme.colors.textSecondary });
    }

    if (size === 'sm') {
        btnStyle.push({ paddingVertical: 8, paddingHorizontal: 14 });
        txtStyle.push({ fontSize: theme.fontSize.sm });
    } else if (size === 'lg') {
        btnStyle.push({ paddingVertical: 16, paddingHorizontal: 28 });
        txtStyle.push({ fontSize: theme.fontSize.lg });
    }

    if (disabled || loading) {
        btnStyle.push({ opacity: 0.5 });
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[...btnStyle, style]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? theme.colors.white : theme.colors.primary}
                />
            ) : (
                <Text style={txtStyle}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

// ===== Input =====
interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    error?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address' | 'numeric';
    style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    error,
    autoCapitalize = 'none',
    keyboardType = 'default',
    style,
}) => (
    <View style={[styles.inputContainer, style]}>
        {label && <Text style={styles.inputLabel}>{label}</Text>}
        <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

// ===== Badge =====
export const Badge: React.FC<{
    label: string;
    color?: string;
    bgColor?: string;
    style?: ViewStyle;
}> = ({ label, color = theme.colors.white, bgColor = theme.colors.primary, style }) => (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
);

// ===== MetacriticBadge =====
export const MetacriticBadge: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({
    score,
    size = 'md',
}) => {
    const bg =
        score >= 75
            ? theme.colors.metacriticGreen
            : score >= 50
                ? theme.colors.metacriticYellow
                : theme.colors.metacriticRed;
    const dim = size === 'sm' ? 28 : 38;
    const fs = size === 'sm' ? theme.fontSize.xs : theme.fontSize.md;

    return (
        <View
            style={[
                styles.metacriticBadge,
                { backgroundColor: bg, width: dim, height: dim, borderRadius: dim / 4 },
            ]}
        >
            <Text style={[styles.metacriticText, { fontSize: fs }]}>{score}</Text>
        </View>
    );
};

// ===== GameCover =====
export const GameCover: React.FC<{
    uri?: string | null;
    title: string;
    width?: number;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}> = ({ uri, title, width = 120, height = 160, borderRadius = theme.borderRadius.md, style }) => (
    <View style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: theme.colors.card }, style]}>
        {uri ? (
            <Image
                source={{ uri }}
                style={{ width, height }}
                resizeMode="cover"
            />
        ) : (
            <View style={[styles.placeholderCover, { width, height }]}>
                <Text style={styles.placeholderText}>{title.substring(0, 2).toUpperCase()}</Text>
            </View>
        )}
    </View>
);

// ===== EmptyState =====
export const EmptyState: React.FC<{
    icon?: string;
    title: string;
    subtitle?: string;
}> = ({ icon = '📭', title, subtitle }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{icon}</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
);

// ===== SectionHeader =====
export const SectionHeader: React.FC<{
    title: string;
    action?: { label: string; onPress: () => void };
}> = ({ title, action }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
            <TouchableOpacity onPress={action.onPress}>
                <Text style={styles.sectionAction}>{action.label}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// ===== Styles =====
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.md,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
    },
    buttonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    buttonSecondary: {
        backgroundColor: `${theme.colors.primary}20`,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    buttonGhost: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontWeight: theme.fontWeight.semibold,
        fontSize: theme.fontSize.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 14,
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.xs,
        marginTop: theme.spacing.xs,
    },
    badge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.sm,
    },
    badgeText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    metacriticBadge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    metacriticText: {
        color: theme.colors.white,
        fontWeight: theme.fontWeight.bold,
    },
    placeholderCover: {
        backgroundColor: theme.colors.cardLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: theme.spacing.xxl,
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        color: theme.colors.text,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    emptySubtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.md,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
    sectionAction: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
});
