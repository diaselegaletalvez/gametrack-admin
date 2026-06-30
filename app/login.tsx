import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GTColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { session, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace('/(admin)/codigos');
  }, [session, loading]);

  const submit = async () => {
    setErro(null);
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setEnviando(true);
    const { error } = await signIn(email.trim(), senha);
    setEnviando(false);
    if (error) {
      setErro(error);
      return;
    }
    router.replace('/(admin)/codigos');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.titulo}>GameTrack Admin</Text>
        <Text style={styles.subtitulo}>
          Painel interno. Só contas marcadas como admin no Supabase entram.
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="voce@dominio.com"
          placeholderTextColor={GTColors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={GTColors.textMuted}
          style={styles.input}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={enviando}
          style={({ pressed }) => [
            styles.botao,
            (pressed || enviando) && { opacity: 0.7 },
          ]}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTxt}>Entrar</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: GTColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: GTColors.surface,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  titulo: {
    color: GTColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitulo: {
    color: GTColors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  label: {
    color: GTColors.textMuted,
    fontSize: 12,
    marginTop: 8,
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
    fontSize: 15,
  },
  erro: {
    color: GTColors.danger,
    marginTop: 10,
    fontSize: 13,
  },
  botao: {
    backgroundColor: GTColors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  botaoTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
