import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { fonts } from '@/constants/theme';

const GREEN = '#15803D';

export function FreeCashPromoBanner() {
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel="Demo offer. Use forty rupees free cash is not an active discount. No minimum order value. Shown as expiring in one day. Terms apply.">
      <LinearGradient
        colors={['#FFF9EE', '#FFF3D0', '#FFE7A3']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.banner, compact && styles.bannerCompact]}>
        <View style={styles.copy}>
          <Text style={[styles.headline, compact && styles.headlineCompact]}>
            <Text style={styles.use}>Use </Text>
            <Text style={styles.cash}>₹40 FREE CASH</Text>
          </Text>
          <Text style={styles.subtitle}>No minimum order value</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Expires in 1 day</Text>
          </View>
        </View>
        <CoinCluster compact={compact} />
        <Text style={styles.terms}>*T&C apply</Text>
      </LinearGradient>
    </View>
  );
}

function CoinCluster({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.cluster, compact && styles.clusterCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.note}>
        <View style={styles.noteCircle} />
        <Text style={styles.noteMark}>₹</Text>
      </View>
      <View style={styles.coinBack}>
        <Text style={styles.coinBackMark}>₹</Text>
      </View>
      <LinearGradient colors={['#FFF4B8', '#F6C445', '#E39B12']} style={styles.coinFront}>
        <View style={styles.coinRing}>
          <Text style={styles.coinMark}>₹</Text>
        </View>
      </LinearGradient>
      <View style={styles.leaf} />
      <View style={styles.spark} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  banner: {
    borderRadius: 16,
    minHeight: 92,
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerCompact: {
    minHeight: 88,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    zIndex: 1,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 19,
  },
  headlineCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  use: {
    color: '#171717',
  },
  cash: {
    color: GREEN,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: '#171717',
  },
  terms: {
    position: 'absolute',
    right: 12,
    bottom: 6,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 12,
    color: '#A8A29E',
  },
  cluster: {
    width: 108,
    height: 68,
    marginBottom: 8,
  },
  clusterCompact: {
    width: 78,
    height: 58,
    marginBottom: 6,
  },
  note: {
    position: 'absolute',
    left: 0,
    top: 18,
    width: 52,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    transform: [{ rotate: '-16deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noteCircle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(21, 128, 61, 0.45)',
  },
  noteMark: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#166534',
  },
  coinBack: {
    position: 'absolute',
    left: 28,
    top: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0C14B',
    borderWidth: 2,
    borderColor: '#C9922A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBackMark: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#8A5A10',
  },
  coinFront: {
    position: 'absolute',
    right: 2,
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8B84A',
  },
  coinRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 90, 16, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinMark: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#8A5A10',
  },
  leaf: {
    position: 'absolute',
    right: 46,
    bottom: 4,
    width: 14,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    transform: [{ rotate: '-30deg' }],
  },
  spark: {
    position: 'absolute',
    right: 8,
    top: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
  },
});
