import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { Alert, Button, Card, Field, Label, Pill, SectionTitle } from '@/components/ui';
import { PLAN_CODIGOS, PLAN_COLOR, PLAN_LABEL, type PlanCodigo } from '@/constants/plans';
import { GTColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { ActivationCode, Plan } from '@/lib/types';

export default function CodigosScreen() {
  const [planos, setPlanos] = useState<Plan[]>([]);
  const [codigos, setCodigos] = useState<ActivationCode[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Form
  const [planCodigo, setPlanCodigo] = useState<PlanCodigo>('premium');
  const [quantidade, setQuantidade] = useState('5');
  const [diasValidade, setDiasValidade] = useState('30');
  const [maxUsos, setMaxUsos] = useState('1');
  const [prefixo, setPrefixo] = useState('GT');
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const [{ data: pl, error: e1 }, { data: cd, error: e2 }] = await Promise.all([
      supabase.from('plans').select('*').order('ordem'),
      supabase
        .from('activation_codes')
        .select('*, plan:plans(codigo, nome)')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    if (e1 || e2) setErro((e1 ?? e2)?.message ?? 'Erro carregando dados.');
    setPlanos((pl ?? []) as Plan[]);
    setCodigos((cd ?? []) as ActivationCode[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const planoSelecionado = useMemo(
    () => planos.find((p) => p.codigo === planCodigo) ?? null,
    [planos, planCodigo],
  );

  const gerar = async () => {
    setAviso(null);
    setErro(null);
    const qtd = parseInt(quantidade, 10);
    const dias = parseInt(diasValidade, 10);
    const usos = parseInt(maxUsos, 10);
    if (!planoSelecionado) {
      setErro('Plano não carregado ainda.');
      return;
    }
    if (!Number.isFinite(qtd) || qtd <= 0 || qtd > 200) {
      setErro('Quantidade entre 1 e 200.');
      return;
    }
    if (!Number.isFinite(dias) || dias < 0) {
      setErro('Dias de validade >= 0 (0 = permanente).');
      return;
    }
    if (!Number.isFinite(usos) || usos < 1) {
      setErro('Máx. usos >= 1.');
      return;
    }
    setGerando(true);
    const { data, error } = await supabase.rpc('admin_create_codes', {
      p_plan_codigo: planoSelecionado.codigo,
      p_quantidade: qtd,
      p_dias_validade: dias,
      p_max_usos: usos,
      p_prefixo: prefixo.trim().toUpperCase() || null,
    });
    setGerando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    const lista = Array.isArray(data) ? data : [];
    setAviso(`${lista.length} código(s) gerado(s): ${lista.join(', ')}`);
    carregar();
  };

  return (
    <PageShell
      titulo="Gerar Códigos"
      subtitulo="Cria códigos de ativação na tabela activation_codes."
      acoes={<Button title="Recarregar" variant="ghost" onPress={carregar} />}
    >
      <Card>
        <SectionTitle>Novo lote de códigos</SectionTitle>

        <View>
          <Label>Plano</Label>
          <View style={styles.planosRow}>
            {PLAN_CODIGOS.map((codigo) => {
              const ativo = planCodigo === codigo;
              return (
                <Pressable
                  key={codigo}
                  onPress={() => setPlanCodigo(codigo)}
                  style={[
                    styles.planoChip,
                    { borderColor: PLAN_COLOR[codigo] + (ativo ? 'ff' : '55') },
                    ativo && { backgroundColor: PLAN_COLOR[codigo] + '33' },
                  ]}
                >
                  <Text style={[styles.planoChipTxt, { color: PLAN_COLOR[codigo] }]}>
                    {PLAN_LABEL[codigo]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Field
              label="Quantidade"
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.gridItem}>
            <Field
              label="Dias de validade (0 = permanente)"
              value={diasValidade}
              onChangeText={setDiasValidade}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.gridItem}>
            <Field
              label="Máx. usos por código"
              value={maxUsos}
              onChangeText={setMaxUsos}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.gridItem}>
            <Field
              label="Prefixo (opcional)"
              value={prefixo}
              onChangeText={(t) => setPrefixo(t.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {erro ? <Alert tone="danger">{erro}</Alert> : null}
        {aviso ? <Alert tone="success">{aviso}</Alert> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Button title="Gerar códigos" onPress={gerar} loading={gerando} />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Códigos gerados</SectionTitle>
          <Text style={{ color: GTColors.textMuted, fontSize: 12 }}>
            {carregando ? 'carregando…' : `${codigos.length} código(s)`}
          </Text>
        </View>
        <View style={styles.tabelaHead}>
          <Text style={[styles.colCodigo, styles.headTxt]}>Código</Text>
          <Text style={[styles.colPlano, styles.headTxt]}>Plano</Text>
          <Text style={[styles.colNum, styles.headTxt]}>Usos</Text>
          <Text style={[styles.colNum, styles.headTxt]}>Validade</Text>
          <Text style={[styles.colStatus, styles.headTxt]}>Status</Text>
        </View>
        <FlatList
          data={codigos}
          keyExtractor={(c) => c.code}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const esgotado = item.usos >= item.max_usos;
            const planoCod = (item.plan?.codigo ?? 'gratis') as PlanCodigo;
            return (
              <View style={styles.linha}>
                <Text style={[styles.colCodigo, styles.codTxt]} selectable>
                  {item.code}
                </Text>
                <View style={styles.colPlano}>
                  <Pill text={PLAN_LABEL[planoCod] ?? planoCod} color={PLAN_COLOR[planoCod]} />
                </View>
                <Text style={[styles.colNum, styles.celula]}>
                  {item.usos}/{item.max_usos}
                </Text>
                <Text style={[styles.colNum, styles.celula]}>
                  {item.dias_validade === 0 ? '∞' : `${item.dias_validade}d`}
                </Text>
                <View style={styles.colStatus}>
                  {item.ativo && !esgotado ? (
                    <Pill text="Ativo" color={GTColors.success} />
                  ) : esgotado ? (
                    <Pill text="Esgotado" color={GTColors.warning} />
                  ) : (
                    <Pill text="Inativo" color={GTColors.textMuted} />
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !carregando ? (
              <Text style={{ color: GTColors.textMuted, padding: 12 }}>Sem códigos ainda.</Text>
            ) : null
          }
        />
      </Card>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  planosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  planoChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  planoChipTxt: { fontSize: 12, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: { flexGrow: 1, flexBasis: 180 },
  tabelaHead: {
    flexDirection: 'row',
    borderBottomColor: GTColors.border,
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginTop: 4,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sep: { height: 1, backgroundColor: GTColors.border + '55' },
  headTxt: {
    color: GTColors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  celula: { color: GTColors.textPrimary, fontSize: 13 },
  codTxt: { color: GTColors.accentSoft, fontFamily: 'monospace', fontSize: 13 },
  colCodigo: { flex: 2 },
  colPlano: { flex: 1.4 },
  colNum: { flex: 1, textAlign: 'left' },
  colStatus: { flex: 1.2 },
});
