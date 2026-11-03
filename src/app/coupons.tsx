import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CouponDetailsSheet } from '@/components/coupons/CouponDetailsSheet';
import { CouponTicketCard } from '@/components/coupons/CouponTicketCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { DEMO_COUPONS, isCouponExpired } from '@/data/demoCoupons';
import {
  activateDeviceCouponCollectionStore,
  loadCollectedCouponIds,
  saveCollectedCouponIds,
} from '@/services/couponCollectionStore';
import type { DemoCoupon } from '@/types/coupons';

type CouponFilter = 'available' | 'collected' | 'expired';

const FILTERS: { id: CouponFilter; label: string }[] = [
  { id: 'available', label: 'Available' },
  { id: 'collected', label: 'Collected' },
  { id: 'expired', label: 'Expired' },
];

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { couponId, setCouponId } = usePreviewSession();
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<CouponFilter>('available');
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<DemoCoupon | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceCouponCollectionStore();
      }
      const ids = await loadCollectedCouponIds();
      if (cancelled) {
        return;
      }
      setCollectedIds(ids);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const collectedSet = useMemo(() => new Set(collectedIds), [collectedIds]);

  const visibleCoupons = useMemo(() => {
    return DEMO_COUPONS.filter((coupon) => {
      const expired = isCouponExpired(coupon);
      const collected = collectedSet.has(coupon.id);
      if (filter === 'expired') {
        return expired;
      }
      if (filter === 'collected') {
        return collected && !expired;
      }
      return !expired && !collected;
    });
  }, [collectedSet, filter]);

  const persistCollected = useCallback(async (next: string[]) => {
    setCollectedIds(next);
    await saveCollectedCouponIds(next);
  }, []);

  const handleCollect = useCallback(
    async (coupon: DemoCoupon) => {
      if (isCouponExpired(coupon)) {
        showToast('warning', 'Expired demo coupons cannot be collected.');
        return;
      }
      if (collectedSet.has(coupon.id)) {
        showToast('info', 'Already collected (demo).');
        return;
      }
      const next = [...collectedIds, coupon.id];
      await persistCollected(next);
      showToast('success', `${coupon.title} collected locally — not redeemed on a server.`);
    },
    [collectedIds, collectedSet, persistCollected, showToast],
  );

  const handleApply = useCallback(
    (coupon: DemoCoupon) => {
      if (isCouponExpired(coupon) || !collectedSet.has(coupon.id)) {
        showToast('warning', 'Collect this demo coupon before applying it in preview.');
        return;
      }
      const next = couponId === coupon.id ? null : coupon.id;
      setCouponId(next);
      showToast(
        'success',
        next ? `${coupon.title} applied to preview checkout only.` : 'Preview coupon removed.',
      );
      setSelected(null);
      if (next && router.canGoBack()) {
        router.back();
      }
    },
    [collectedSet, couponId, setCouponId, showToast],
  );

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Promocode" message="Coupons are not connected yet." withHeader />;
  }

  if (!ready) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="coupons-screen">
      <AppScreenHeader
        title="Promocode"
        right={
          <View style={styles.headerIcon} accessibilityElementsHidden>
            <AppIcon name="ticket" color={colors.text} size={22} />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
          visibleCoupons.length === 0 ? styles.grow : null,
        ]}
        showsVerticalScrollIndicator={false}>
        <DemoBanner message="Demo / Preview promocodes — collect locally only. Nothing is redeemed on a live bill." />

        <View style={styles.filters} accessibilityRole="tablist">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(item.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                testID={`coupon-filter-${item.id}`}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {couponId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove preview coupon"
            onPress={() => {
              setCouponId(null);
              showToast('info', 'Preview coupon cleared.');
            }}
            style={styles.clearRow}>
            <Text style={styles.clearLabel}>Clear preview checkout coupon</Text>
          </Pressable>
        ) : null}

        {visibleCoupons.length === 0 ? (
          <View style={styles.empty} testID="coupons-empty">
            <AppIcon name="ticket" color={colors.textSecondary} size={36} />
            <Text style={styles.emptyTitle}>
              {filter === 'collected'
                ? 'No collected coupons'
                : filter === 'expired'
                  ? 'No expired coupons'
                  : 'No available coupons'}
            </Text>
            <Text style={styles.emptyBody}>
              {filter === 'collected'
                ? 'Tap Collect on an available demo offer to save it locally.'
                : filter === 'expired'
                  ? 'Expired demo offers appear here and cannot be redeemed.'
                  : 'All available demo offers are collected — check the Collected tab.'}
            </Text>
          </View>
        ) : (
          visibleCoupons.map((coupon) => {
            const expired = isCouponExpired(coupon);
            const collected = collectedSet.has(coupon.id);
            return (
              <CouponTicketCard
                key={coupon.id}
                coupon={coupon}
                collected={collected}
                expired={expired}
                applied={couponId === coupon.id}
                onPress={() => setSelected(coupon)}
                onCollect={() => {
                  void handleCollect(coupon);
                }}
              />
            );
          })
        )}
      </ScrollView>

      <CouponDetailsSheet
        coupon={selected}
        collected={selected ? collectedSet.has(selected.id) : false}
        expired={selected ? isCouponExpired(selected) : false}
        applied={selected ? couponId === selected.id : false}
        onClose={() => setSelected(null)}
        onCollect={() => {
          if (selected) {
            void handleCollect(selected);
          }
        }}
        onApply={() => {
          if (selected) {
            handleApply(selected);
          }
        }}
        onCopied={() => showToast('success', 'Demo coupon code copied.')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 12,
    gap: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  grow: {
    flexGrow: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  clearRow: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  clearLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
