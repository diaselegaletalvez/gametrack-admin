import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { Alert, Button, Card, Field, Pill, SectionTitle } from '@/components/ui';
import { PLAN_CODIGOS, PLAN_COLOR, PLAN_LABEL, type PlanCodigo } from '@/constants/plans';
import { GTColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { AdminUserRow } from '@/lib/types';

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<AdminUserRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [trocando, setTrocando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) setErro(error.message);
    setUsuarios((data ?? []) as AdminUserRow[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const trocarPlano = async (user: AdminUserRow, codigo: PlanCodigo) => {
    setErro(null);
    setAviso(null);
    setTrocando(user.user_id);
    const { data, error } = await supabase.rpc('admin_set_user_plan', {
      p_user_id: user.user_id,
      p_codigo: codigo,
    });
    setTrocando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    if (data && typeof data === 'object' && 'ok' in data && !data.ok) {
      setErro(String(data.error ?? 'Falha desconhecida'));
      return;
    }
    setAviso(
      `Plano de ${user.email ?? user.user_id.slice(0, 8)} alterado para ${PLAN_LABEL[codigo]}.`,
    );
    carregar();
  };

  const filtrados = usuarios.filter((u) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.nome_completo ?? '').toLowerCase().includes(q) ||
      (u.gametag ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <PageShell
      titulo="Usuários"
      subtitulo="Lista todos os usuários do Supabase. Permite trocar o plano de qualquer um (pra teste)."
      acoes={<Button title="Recarregar" variant="ghost" onPress={carregar} />}
    >
      <Card>
        <Field
          label="Buscar (e-mail, nome ou gametag)"
          value={busca}
          onChangeText={setBusca}
          placeholder="ex: gabriel"
        />
        {erro ? <Alert tone="danger">{erro}</Alert> : null}
        {aviso ? <Alert tone="success">{aviso}</Alert> : null}
        <Text style={{ color: GTColors.textMuted, fontSize: 12 }}>
          {carregando ? 'carregando…' : `${filtrados.length} de ${usuarios.length} usuário(s)`}
        </Text>
      </Card>

      <FlatList
        data={filtrados}
        keyExtractor={(u) => u.user_id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const planoAtual = item.plano_codigo;
          return (
            <Card>
              <View style={styles.linhaTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.email}>
                    {item.email ?? '(sem e-mail)'}
                    {item.is_admin ? '  ' : ''}
                    {item.is_admin ? <Text style={styles.adminTag}>ADMIN</Text> : null}
                  </Text>
                  <Text style={styles.sub}>
                    {item.nome_completo ?? '—'}
                    {item.gametag ? `  •  @${item.gametag}` : ''}
                    {`  •  ${item.coins ?? 0} pontos`}
                  </Text>
                </View>
                {planoAtual ? (
                  <Pill text={PLAN_LABEL[planoAtual]} color={PLAN_COLOR[planoAtual]} />
                ) : (
                  <Pill text="Sem plano" color={GTColors.textMuted} />
                )}
              </View>

              <View style={styles.planosRow}>
                {PLAN_CODIGOS.map((codigo) => {
                  const ativo = planoAtual === codigo;
                  return (
                    <Pressable
                      key={codigo}
                      disabled={trocando === item.user_id || ativo}
                      onPress={() => trocarPlano(item, codigo)}
                      style={[
                        styles.planoChip,
                        { borderColor: PLAN_COLOR[codigo] + (ativo ? 'ff' : '55') },
                        ativo && { backgroundColor: PLAN_COLOR[codigo] + '33' },
                        trocando === item.user_id && !ativo && { opacity: 0.5 },
                      ]}
                    >
                      <Text style={[styles.planoChipTxt, { color: PLAN_COLOR[codigo] }]}>
                        {PLAN_LABEL[codigo]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          !carregando ? (
            <Text style={{ color: GTColors.textMuted, padding: 12 }}>Nenhum usuário.</Text>
          ) : null
        }
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  linhaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  email: { color: GTColors.textPrimary, fontSize: 15, fontWeight: '600' },
  adminTag: {
    color: GTColors.warning,
    fontSize: 10,
    fontWeight: '800',
  },
  sub: { color: GTColors.textMuted, fontSize: 12, marginTop: 2 },
  planosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  planoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  planoChipTxt: { fontSize: 11, fontWeight: '700' },
});
