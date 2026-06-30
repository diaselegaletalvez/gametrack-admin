import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { Alert, Button, Card, Field, Pill, SectionTitle } from '@/components/ui';
import { GTColors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import type { CatalogoJogo } from '@/lib/types';

type FormState = {
  nome: string;
  descricao: string;
  plataforma: string;
  genero: string;
  imagem_url: string;
};

const VAZIO: FormState = {
  nome: '',
  descricao: '',
  plataforma: '',
  genero: '',
  imagem_url: '',
};

export default function CatalogoScreen() {
  const [jogos, setJogos] = useState<CatalogoJogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase
      .from('catalogo_jogos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setErro(error.message);
    setJogos((data ?? []) as CatalogoJogo[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const limpar = () => {
    setForm(VAZIO);
    setEditandoId(null);
  };

  const editar = (j: CatalogoJogo) => {
    setForm({
      nome: j.nome,
      descricao: j.descricao ?? '',
      plataforma: j.plataforma,
      genero: j.genero,
      imagem_url: j.imagem_url ?? '',
    });
    setEditandoId(j.id);
    setAviso(null);
    setErro(null);
  };

  const salvar = async () => {
    setErro(null);
    setAviso(null);
    if (!form.nome.trim() || !form.plataforma.trim() || !form.genero.trim()) {
      setErro('Nome, plataforma e gênero são obrigatórios.');
      return;
    }
    setSalvando(true);
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      plataforma: form.plataforma.trim(),
      genero: form.genero.trim(),
      imagem_url: form.imagem_url.trim() || null,
    };
    const { error } = editandoId
      ? await supabase.from('catalogo_jogos').update(payload).eq('id', editandoId)
      : await supabase.from('catalogo_jogos').insert(payload);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setAviso(editandoId ? 'Jogo atualizado.' : 'Jogo adicionado.');
    limpar();
    carregar();
  };

  const remover = async (j: CatalogoJogo) => {
    if (typeof window !== 'undefined' && !window.confirm(`Remover "${j.nome}" do catálogo?`)) {
      return;
    }
    setErro(null);
    const { error } = await supabase.from('catalogo_jogos').delete().eq('id', j.id);
    if (error) {
      setErro(error.message);
      return;
    }
    if (editandoId === j.id) limpar();
    setAviso(`"${j.nome}" removido.`);
    carregar();
  };

  return (
    <PageShell
      titulo="Catálogo"
      subtitulo="Jogos públicos exibidos pra todos os usuários (tabela catalogo_jogos)."
      acoes={<Button title="Recarregar" variant="ghost" onPress={carregar} />}
    >
      <Card>
        <SectionTitle>{editandoId ? 'Editar jogo' : 'Adicionar jogo'}</SectionTitle>
        <View style={styles.grid}>
          <View style={styles.col2}>
            <Field
              label="Nome"
              value={form.nome}
              onChangeText={(v) => setForm({ ...form, nome: v })}
            />
          </View>
          <View style={styles.col1}>
            <Field
              label="Plataforma"
              value={form.plataforma}
              onChangeText={(v) => setForm({ ...form, plataforma: v })}
              placeholder="PC, Xbox, PlayStation..."
            />
          </View>
          <View style={styles.col1}>
            <Field
              label="Gênero"
              value={form.genero}
              onChangeText={(v) => setForm({ ...form, genero: v })}
              placeholder="FPS, RPG, Roguelike..."
            />
          </View>
          <View style={styles.col2}>
            <Field
              label="URL da capa"
              value={form.imagem_url}
              onChangeText={(v) => setForm({ ...form, imagem_url: v })}
              placeholder="https://…"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.colFull}>
            <Field
              label="Descrição"
              value={form.descricao}
              onChangeText={(v) => setForm({ ...form, descricao: v })}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70, textAlignVertical: 'top' }}
            />
          </View>
        </View>

        {erro ? <Alert tone="danger">{erro}</Alert> : null}
        {aviso ? <Alert tone="success">{aviso}</Alert> : null}

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          {editandoId ? <Button title="Cancelar" variant="ghost" onPress={limpar} /> : null}
          <Button
            title={editandoId ? 'Salvar alterações' : 'Adicionar'}
            onPress={salvar}
            loading={salvando}
          />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Jogos do catálogo</SectionTitle>
          <Text style={{ color: GTColors.textMuted, fontSize: 12 }}>
            {carregando ? 'carregando…' : `${jogos.length} jogo(s)`}
          </Text>
        </View>
        <FlatList
          data={jogos}
          keyExtractor={(j) => j.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View style={styles.jogo}>
              <View style={styles.capaWrap}>
                {item.imagem_url ? (
                  <Image source={{ uri: item.imagem_url }} style={styles.capa} />
                ) : (
                  <View style={[styles.capa, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="image-outline" size={20} color={GTColors.textMuted} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{item.nome}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Pill text={item.plataforma} color={GTColors.info} />
                  <Pill text={item.genero} color={GTColors.accentSoft} />
                </View>
                {item.descricao ? (
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.descricao}
                  </Text>
                ) : null}
              </View>
              <View style={{ gap: 6 }}>
                <Pressable onPress={() => editar(item)} style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={18} color={GTColors.textPrimary} />
                </Pressable>
                <Pressable onPress={() => remover(item)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={GTColors.danger} />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !carregando ? (
              <Text style={{ color: GTColors.textMuted, padding: 12 }}>Catálogo vazio.</Text>
            ) : null
          }
        />
      </Card>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col1: { flexGrow: 1, flexBasis: 160 },
  col2: { flexGrow: 2, flexBasis: 240 },
  colFull: { width: '100%' },
  jogo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: GTColors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  capaWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: GTColors.bg,
    borderColor: GTColors.border,
    borderWidth: 1,
  },
  capa: { width: '100%', height: '100%' },
  nome: { color: GTColors.textPrimary, fontWeight: '700', fontSize: 14 },
  desc: { color: GTColors.textMuted, fontSize: 12, marginTop: 4 },
  iconBtn: {
    backgroundColor: GTColors.bg,
    borderColor: GTColors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
});
