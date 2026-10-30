import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroceryHero } from '@/components/onboarding/GroceryHero';
import { WelcomeBenefits } from '@/components/onboarding/WelcomeBenefits';
import { WelcomeBrand } from '@/components/onboarding/WelcomeBrand';
import { WelcomeFooter } from '@/components/onboarding/WelcomeFooter';
import { WelcomeHeadline } from '@/components/onboarding/WelcomeHeadline';
import { colors } from '@/constants/theme';

const FOOTER_BODY = 132;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const contentWidth = Math.min(width, 480);
  const footerSpace = FOOTER_BODY + Math.max(insets.bottom, 12);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: footerSpace + 12 },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.column, { width: contentWidth }]}>
          <WelcomeBrand />
          <WelcomeHeadline compact={compact} />
          <GroceryHero />
          <WelcomeBenefits compact={compact} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <WelcomeFooter />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
  },
});
