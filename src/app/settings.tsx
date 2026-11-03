import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [offers, setOffers] = useState(false);

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Settings" message="Settings are not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold title="Settings" subtitle="Local demo preferences. Nothing syncs to a server.">
      <DemoBanner message="Demo settings only — values stay on this device session." />

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>Order alerts</Text>
            <Text style={styles.meta}>Preview push preference</Text>
          </View>
          <Switch
            value={orderAlerts}
            onValueChange={setOrderAlerts}
            trackColor={{ true: colors.primary, false: '#E5E7EB' }}
            thumbColor={colors.white}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>Offer notifications</Text>
            <Text style={styles.meta}>Demo marketing toggle</Text>
          </View>
          <Switch
            value={offers}
            onValueChange={setOffers}
            trackColor={{ true: colors.primary, false: '#E5E7EB' }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <Pressable style={styles.linkRow} onPress={() => router.push('/help')}>
        <Text style={styles.link}>Help & Support</Text>
      </Pressable>
      <Pressable style={styles.linkRow} onPress={() => router.push('/privacy')}>
        <Text style={styles.link}>Privacy</Text>
      </Pressable>
      <Pressable style={styles.linkRow} onPress={() => router.push('/terms')}>
        <Text style={styles.link}>Terms</Text>
      </Pressable>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  copy: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  linkRow: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primaryInk },
});
