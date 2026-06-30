import { PageShell } from '@/components/page-shell';
import { Alert, Card, SectionTitle } from '@/components/ui';
import { GTColors } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

export default function ContasScreen() {
  return (
    <PageShell
      titulo="Criar Contas Teste"
      subtitulo="Geração de contas falsas pra simular cenários (família, escolar, youtuber etc.)."
    >
      <Alert tone="info">
        Em breve. Criar usuário programaticamente precisa de service_role — vai virar
        Edge Function. Por enquanto, crie via tela de cadastro do app.
      </Alert>

      <Card>
        <SectionTitle>Ideias pra esta tela</SectionTitle>
        <Text style={styles.txt}>• Criar 1 conta de teste com plano X e seed de dados (jogos, sessões).</Text>
        <Text style={styles.txt}>• Criar grupo familiar (1 conta família + 3 perfis).</Text>
        <Text style={styles.txt}>• Criar conta escolar (1 professor + 5 alunos).</Text>
        <Text style={styles.txt}>• Listar contas marcadas como teste pra apagar em lote.</Text>
      </Card>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  txt: { color: GTColors.textPrimary, fontSize: 13, marginBottom: 2 },
});
