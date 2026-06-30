import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GTColors, SIDEBAR_WIDTH } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Item = {
  href:
    | '/(admin)/codigos'
    | '/(admin)/usuarios'
    | '/(admin)/catalogo'
    | '/(admin)/reset'
    | '/(admin)/ovos'
    | '/(admin)/contas';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const ITENS: Item[] = [
  { href: '/(admin)/codigos', icon: 'pricetags-outline', label: 'Gerar Códigos' },
  { href: '/(admin)/usuarios', icon: 'people-outline', label: 'Usuários' },
  { href: '/(admin)/catalogo', icon: 'game-controller-outline', label: 'Catálogo' },
  { href: '/(admin)/reset', icon: 'refresh-outline', label: 'Reset de Teste' },
  { href: '/(admin)/ovos', icon: 'egg-outline', label: 'Pegar Ovos / Pets' },
  { href: '/(admin)/contas', icon: 'person-add-outline', label: 'Criar Contas Teste' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandDot} />
        <View>
          <Text style={styles.brandTitle}>GameTrack</Text>
          <Text style={styles.brandSub}>Admin Console</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {ITENS.map((item) => {
          const ativa = pathname.startsWith(item.href.replace('/(admin)', ''));
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable style={[styles.item, ativa && styles.itemAtivo]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={ativa ? GTColors.textPrimary : GTColors.textMuted}
                />
                <Text style={[styles.itemLabel, ativa && styles.itemLabelAtivo]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.email} numberOfLines={1}>
          {session?.user.email}
        </Text>
        <Pressable onPress={signOut} style={styles.sair}>
          <Ionicons name="log-out-outline" size={16} color={GTColors.danger} />
          <Text style={styles.sairTxt}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: GTColors.surface,
    borderRightColor: GTColors.border,
    borderRightWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 18,
  },
  brandDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: GTColors.accent,
  },
  brandTitle: {
    color: GTColors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  brandSub: {
    color: GTColors.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menu: { gap: 2, flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemAtivo: {
    backgroundColor: GTColors.accentDeep,
  },
  itemLabel: {
    color: GTColors.textMuted,
    fontSize: 14,
  },
  itemLabelAtivo: {
    color: GTColors.textPrimary,
    fontWeight: '600',
  },
  footer: {
    borderTopColor: GTColors.border,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  email: {
    color: GTColors.textMuted,
    fontSize: 12,
  },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sairTxt: {
    color: GTColors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
