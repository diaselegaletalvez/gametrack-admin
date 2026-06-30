import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { Alert, Button, Card, Field, SectionTitle } from '@/components/ui';
import { GTColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { AdminUserRow } from '@/lib/types';

export default function ResetScreen() {
  const [usuarios, setUsuarios] = useState<AdminUserRow[]>([]);
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<AdminUserRow | null>(null);
  const [confirmaTexto, setConfirmaTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [executando, setExecutando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) setErro(error.message);
    setUsuarios((data ?? []) as AdminUserRow[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = usuarios.filter((u) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.nome_completo ?? '').toLowerCase().includes(q) ||
      (u.gametag ?? '').toLowerCase().includes(q)
    );
  });

  const executar = async () => {
    if (!selecionado) return;
    setErro(null);
    setAviso(null);
    setExecutando(true);
    const { data, error } = await supabase.rpc('admin_reset_user_data', {
      p_user_id: selecionado.user_id,
    });
    setExecutando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    if (data && typeof data === 'object' && 'ok' in data && !data.ok) {
      setErro(String(data.error ?? 'Falha desconhecida'));
      return;
    }
    setAviso(`Dados de teste de ${selecionado.email ?? selecionado.user_id} zerados.`);
    setSelecionado(null);
    setConfirmaTexto('');
    carregar();
  };

  const podeExecutar =
    selecionado && confirmaTexto.trim().toUpperCase() === 'RESETAR' && !executando;

  return (
    <PageShell
      titulo="Reset de Teste"
      subtitulo="Zera dados de teste de UMA conta: jogos, conquistas, sessões, pets, missões, compras. Não apaga login/perfil."
    >
      <Alert tone="warning">
        Use só em contas de teste. Esta ação é IRREVERSÍVEL e remove dados do usuário escolhido.
      </Alert>

      <Card>
        <SectionTitle>1. Escolha a conta</SectionTitle>
        <Field
          label="Buscar"
          value={busca}
          onChangeText={setBusca}
          placeholder="e-mail, nome ou gametag"
        />
        {carregando ? (
          <Text style={{ color: GTColors.textMuted }}>carregando…</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {filtrados.slice(0, 12).map((u) => {
              const escolhido = selecionado?.user_id === u.user_id;
              return (
                <Pressable
                  key={u.user_id}
                  onPress={() => {
                    setSelecionado(u);
                    setConfirmaTexto('');
                    setAviso(null);
                  }}
                  style={[styles.userRow, escolhido && styles.userRowAtivo]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userEmail}>{u.email ?? '(sem e-mail)'}</Text>
                    <Text style={styles.userSub}>
                      {u.nome_completo ?? '—'}
                      {u.gametag ? `  •  @${u.gametag}` : ''}
                      {`  •  ${u.coins ?? 0} pontos`}
                    </Text>
                  </View>
                  {escolhido ? <Text style={styles.escolhido}>Selecionado</Text> : null}
                </Pressable>
              );
            })}
            {filtrados.length === 0 ? (
              <Text style={{ color: GTColors.textMuted }}>Nenhum usuário encontrado.</Text>
            ) : null}
          </View>
        )}
      </Card>

      {selecionado ? (
        <Card style={{ borderColor: GTColors.danger + '88' }}>
          <SectionTitle>2. Confirmação dupla</SectionTitle>
          <Text style={{ color: GTColors.textPrimary, fontSize: 14 }}>
            Vou zerar os dados de teste da conta:{' '}
            <Text style={{ color: GTColors.accentSoft, fontWeight: '700' }}>
              {selecionado.email ?? selecionado.user_id}
            </Text>
          </Text>
          <Text style={{ color: GTColors.textMuted, fontSize: 12 }}>
            Serão removidos: jogos, sessões, conquistas, user_pets, user_missions, user_purchases.{'\n'}
            Login, perfil e plano NÃO são apagados (o saldo de moedas será zerado).
          </Text>

          <Field
            label="Digite RESETAR pra liberar o botão"
            value={confirmaTexto}
            onChangeText={(t) => setConfirmaTexto(t.toUpperCase())}
            autoCapitalize="characters"
            placeholder="RESETAR"
          />

          {erro ? <Alert tone="danger">{erro}</Alert> : null}

          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => {
                setSelecionado(null);
                setConfirmaTexto('');
              }}
            />
            <Button
              title="Zerar dados de teste"
              variant="danger"
              disabled={!podeExecutar}
              loading={executando}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  const ok = window.confirm(
                    `Confirma o reset de ${selecionado?.email ?? selecionado?.user_id}? Esta ação é irreversível.`,
                  );
                  if (!ok) return;
                }
                executar();
              }}
            />
          </View>
        </Card>
      ) : null}

      {aviso ? <Alert tone="success">{aviso}</Alert> : null}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GTColors.surfaceElevated,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  userRowAtivo: {
    borderColor: GTColors.accent,
    backgroundColor: GTColors.accentDeep + '55',
  },
  userEmail: { color: GTColors.textPrimary, fontWeight: '600' },
  userSub: { color: GTColors.textMuted, fontSize: 12, marginTop: 2 },
  escolhido: {
    color: GTColors.accentSoft,
    fontWeight: '700',
    fontSize: 12,
  },
});
