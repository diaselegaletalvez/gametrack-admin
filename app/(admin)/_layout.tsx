import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Sidebar } from '@/components/sidebar';
import { GTColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function AdminLayout() {
  const { session, loading, isAdmin, checkingAdmin, signOut } = useAuth();

  if (loading || checkingAdmin || isAdmin === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GTColors.accent} />
        <Text style={styles.loadingTxt}>Verificando acesso…</Text>
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <View style={styles.bloqueio}>
          <Text style={styles.bloqueioTitulo}>Acesso restrito</Text>
          <Text style={styles.bloqueioTxt}>
            Esta conta ({session.user.email}) não está marcada como admin no Supabase.
            {'\n\n'}
            Pra liberar, rode no SQL Editor:
            {'\n'}
            <Text style={styles.code}>
              update public.profiles set is_admin = true where user_id = (select id from auth.users where email = &apos;{session.user.email}&apos;);
            </Text>
          </Text>
          <Pressable onPress={signOut} style={styles.botaoSair}>
            <Text style={styles.botaoSairTxt}>Sair</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Sidebar />
      <View style={styles.conteudo}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: GTColors.bg,
  },
  conteudo: {
    flex: 1,
    backgroundColor: GTColors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GTColors.bg,
    padding: 24,
  },
  loadingTxt: { color: GTColors.textMuted, marginTop: 12 },
  bloqueio: {
    maxWidth: 520,
    backgroundColor: GTColors.surface,
    borderColor: GTColors.danger,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  bloqueioTitulo: {
    color: GTColors.danger,
    fontSize: 22,
    fontWeight: '700',
  },
  bloqueioTxt: {
    color: GTColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    color: GTColors.accentSoft,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  botaoSair: {
    marginTop: 12,
    backgroundColor: GTColors.surfaceElevated,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botaoSairTxt: {
    color: GTColors.textPrimary,
    fontWeight: '600',
  },
});
