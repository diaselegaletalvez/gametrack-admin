import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { GTColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: GTColors.bg }}>
        <ActivityIndicator color={GTColors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;
  return <Redirect href="/(admin)/codigos" />;
}
