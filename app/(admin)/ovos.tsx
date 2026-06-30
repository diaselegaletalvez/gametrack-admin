import { PageShell } from '@/components/page-shell';
import { Alert, Card, SectionTitle } from '@/components/ui';
import { GTColors } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

export default function OvosScreen() {
  return (
    <PageShell
      titulo="Pegar Ovos / Pets"
      subtitulo="Vai surgir quando a Fase 2 (pets + ovos) tiver mecânica jogável."
    >
      <Alert tone="info">
        Em breve. Aqui você vai poder gerar ovos pra contas de teste e forçar a obtenção
        de pets específicos (raridade ou nome) pra debugar a coleção.
      </Alert>

      <Card>
        <SectionTitle>Ideias pra esta tela</SectionTitle>
        <Text style={styles.txt}>• Dar um pet específico pra uma conta (pesquisa por gametag).</Text>
        <Text style={styles.txt}>• Forçar um ovo a chocar imediatamente (skip do timer).</Text>
        <Text style={styles.txt}>• Inserir N ovos no inventário de uma conta de teste.</Text>
        <Text style={styles.txt}>• Resetar a coleção de pets sem mexer no resto.</Text>
      </Card>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  txt: { color: GTColors.textPrimary, fontSize: 13, marginBottom: 2 },
});
