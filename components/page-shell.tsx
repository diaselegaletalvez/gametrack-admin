import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { GTColors } from '@/constants/theme';

type Props = {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  acoes?: React.ReactNode;
  style?: ViewStyle;
};

export function PageShell({ titulo, subtitulo, children, acoes }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.cont}>
      <View style={styles.cabec}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
        {acoes}
      </View>
      <View style={styles.bloco}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  cont: { padding: 28, gap: 24 },
  cabec: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  titulo: {
    color: GTColors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitulo: {
    color: GTColors.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
  bloco: { gap: 16 },
});
