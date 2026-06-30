import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { GTColors } from '@/constants/theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        placeholderTextColor={GTColors.textMuted}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading, style, ...rest }: ButtonProps) {
  const palette = {
    primary: { bg: GTColors.accent, fg: '#fff', bd: GTColors.accent },
    ghost: { bg: GTColors.surfaceElevated, fg: GTColors.textPrimary, bd: GTColors.border },
    danger: { bg: GTColors.danger, fg: '#fff', bd: GTColors.danger },
  }[variant];
  return (
    <Pressable
      {...rest}
      disabled={loading || rest.disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.bd },
        (pressed || loading) && { opacity: 0.75 },
        rest.disabled && { opacity: 0.4 },
        typeof style === 'function' ? undefined : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.buttonTxt, { color: palette.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Pill({
  text,
  color = GTColors.accentSoft,
  bg,
}: {
  text: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg ?? color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.pillTxt, { color }]}>{text}</Text>
    </View>
  );
}

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'danger' | 'warning';
  children: React.ReactNode;
}) {
  const color = {
    info: GTColors.info,
    success: GTColors.success,
    danger: GTColors.danger,
    warning: GTColors.warning,
  }[tone];
  return (
    <View style={[styles.alert, { borderColor: color + '88', backgroundColor: color + '15' }]}>
      <Text style={{ color: GTColors.textPrimary, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GTColors.surface,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  section: {
    color: GTColors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  label: {
    color: GTColors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: GTColors.surfaceElevated,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: GTColors.textPrimary,
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  buttonTxt: { fontWeight: '700', fontSize: 14 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillTxt: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  alert: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
