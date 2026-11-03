import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import {
  featuredSupportFaqs,
  SUPPORT_CATEGORIES,
  SUPPORT_FAQS,
  supportFaqDetailsHref,
  type SupportCategory,
  type SupportFaqItem,
} from '@/data/supportFaq';
import { profileRoutes } from '@/navigation/profileRoutes';
import { contentColumnWidth } from '@/utils/contentWidth';
import { filterSupportFaqs } from '@/utils/supportFaqSearch';
import { hapticSelection } from '@/utils/haptics';
import { supportChatHref } from '@/utils/supportChat';

type CategoryFilter = SupportCategory | 'all';

const INITIAL_FAQ_COUNT = 4;

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const contentWidth = contentColumnWidth(width);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  function openLiveChat() {
    void hapticSelection();
    router.push(supportChatHref());
  }

  const searching = query.trim().length > 0 || category !== 'all';
  const filtered = useMemo(
    () => filterSupportFaqs(SUPPORT_FAQS, { query, category }),
    [query, category],
  );

  const visibleFaqs = useMemo(() => {
    if (searching || showAllFaqs) {
      return filtered;
    }
    const featured = featuredSupportFaqs(INITIAL_FAQ_COUNT);
    if (category === 'all') {
      return featured;
    }
    return featured.filter((item) => item.category === category);
  }, [category, filtered, searching, showAllFaqs]);

  const gridGap = space.md;
  const sidePad = space.lg;
  const columnWidth = Math.min(contentWidth, width);
  const cardWidth = Math.max(140, Math.floor((columnWidth - sidePad * 2 - gridGap) / 2));

  function openFaq(item: SupportFaqItem) {
    void hapticSelection();
    router.push(supportFaqDetailsHref(item.id));
  }

  function onCategoryPress(id: SupportCategory) {
    void hapticSelection();
    setCategory(id);
    setShowAllFaqs(true);
  }

  function clearFilters() {
    setCategory('all');
    setQuery('');
    setShowAllFaqs(false);
  }

  const enter = reducedMotion ? undefined : FadeInDown.duration(220).springify().damping(18);

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Support Center"
        fallbackHref={profileRoutes.profile}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Support contact"
            hitSlop={8}
            onPress={openLiveChat}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
            <AppIcon name="headset" color={colors.text} size={22} />
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(insets.bottom, 24) + 16,
              width: '100%',
              maxWidth: homeLayout.maxWidth,
              alignSelf: 'center',
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={enter} style={styles.searchRow}>
            <View style={styles.searchField}>
              <AppIcon name="search" color={colors.textSecondary} size={18} />
              <TextInput
                value={query}
                onChangeText={(next) => {
                  setQuery(next);
                  if (next.trim().length > 0) {
                    setShowAllFaqs(true);
                  }
                }}
                placeholder="Search for help, orders, payments..."
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Search for help, orders, payments"
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => {
                    setQuery('');
                    if (category === 'all') {
                      setShowAllFaqs(false);
                    }
                  }}>
                  <AppIcon name="close" color={colors.textSecondary} size={18} />
                </Pressable>
              ) : null}
            </View>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Filter help by category"
              accessibilityState={{ expanded: filterOpen }}
              onPress={() => {
                void hapticSelection();
                setFilterOpen(true);
              }}
              style={[styles.filterBtn, styles.filterBtnShrink]}>
              <AppIcon name="sliders" color={colors.text} size={20} />
            </AnimatedPressable>
          </Animated.View>

          {category !== 'all' ? (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                Showing: {SUPPORT_CATEGORIES.find((item) => item.id === category)?.title ?? 'All'}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Clear category filter" onPress={clearFilters}>
                <Text style={styles.clearFilter}>Clear</Text>
              </Pressable>
            </View>
          ) : null}

          <Animated.View entering={enter} style={styles.chatBanner}>
            <View pointerEvents="none" style={styles.chatDecorTop} />
            <View pointerEvents="none" style={styles.chatDecorBottom} />
            <View style={styles.chatArt}>
              <View style={styles.chatArtGlow} />
              <View style={styles.chatArtPlate}>
                <AppIcon name="headset" color={colors.text} size={34} />
              </View>
              <View style={styles.chatArtBadge}>
                <AppIcon name="chat" color={colors.white} size={12} />
              </View>
            </View>
            <View style={styles.chatCopy}>
              <Text style={styles.chatTitle}>Live Chat</Text>
              <Text style={styles.chatBody}>Get instant help from our support team</Text>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Start Chat"
                onPress={openLiveChat}
                style={styles.chatCta}>
                <AppIcon name="chat" color={colors.white} size={14} />
                <Text style={styles.chatCtaLabel}>Start Chat</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>

          <Animated.View entering={enter} style={styles.faqCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <AppIcon name="help" color={colors.text} size={16} />
              </View>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            </View>

            {visibleFaqs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No matching help topics</Text>
                <Text style={styles.emptyBody}>Try another search or clear filters.</Text>
                <Pressable accessibilityRole="button" onPress={clearFilters}>
                  <Text style={styles.viewAll}>Clear search</Text>
                </Pressable>
              </View>
            ) : (
              visibleFaqs.map((item, index) => {
                const featured = index === 0 && !searching && category === 'all' && !showAllFaqs;
                return (
                  <View key={item.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel={item.question}
                      onPress={() => openFaq(item)}
                      style={[styles.faqRow, featured && styles.faqRowFeatured]}>
                      <View style={styles.faqCopy}>
                        <Text style={styles.faqQuestion}>{item.question}</Text>
                      </View>
                      <AppIcon name="chevron" color={colors.textSecondary} size={18} />
                    </AnimatedPressable>
                  </View>
                );
              })
            )}

            {!searching || showAllFaqs ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showAllFaqs ? 'Show fewer FAQs' : 'View All FAQs'}
                onPress={() => {
                  void hapticSelection();
                  setShowAllFaqs((current) => !current);
                }}
                style={styles.viewAllRow}>
                <Text style={styles.viewAll}>{showAllFaqs && !searching ? 'Show less' : 'View All FAQs'}</Text>
                <AppIcon name="chevron" color={colors.primaryDark} size={16} />
              </Pressable>
            ) : null}
          </Animated.View>

          <Animated.View entering={enter}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBadge, styles.sectionBadgeAlt]}>
                <AppIcon name="stores" color={colors.text} size={16} />
              </View>
              <Text style={styles.sectionTitle}>Help by Category</Text>
            </View>
            <View style={styles.categoryGrid}>
              {SUPPORT_CATEGORIES.map((item) => (
                <CategoryCard
                  key={item.id}
                  width={cardWidth}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  selected={category === item.id}
                  onPress={() => onCategoryPress(item.id)}
                />
              ))}
            </View>
          </Animated.View>

          <Text style={styles.disclaimer}>
            Help content is in-app guidance for Mayapur Bazaar. It is not a live ticket system and does not promise
            refund or response timelines.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.filterSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.filterTitle}>Filter by category</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                clearFilters();
                setFilterOpen(false);
              }}
              style={[styles.filterOption, category === 'all' && styles.filterOptionActive]}>
              <Text style={styles.filterOptionLabel}>All topics</Text>
            </Pressable>
            {SUPPORT_CATEGORIES.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(item.id);
                  setShowAllFaqs(true);
                  setFilterOpen(false);
                }}
                style={[styles.filterOption, category === item.id && styles.filterOptionActive]}>
                <Text style={styles.filterOptionLabel}>{item.title}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CategoryCard({
  width,
  title,
  description,
  icon,
  selected,
  onPress,
}: {
  width: number;
  title: string;
  description: string;
  icon: AppIconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.categoryCard, { width }, selected && styles.categoryCardSelected]}>
      <View style={styles.categoryIcon}>
        <AppIcon name={icon} color={colors.text} size={20} />
      </View>
      <Text numberOfLines={1} style={styles.categoryTitle}>
        {title}
      </Text>
      <Text numberOfLines={2} style={styles.categoryBody}>
        {description}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    overflow: 'hidden',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  searchField: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    ...shadow.soft,
  },
  filterBtnShrink: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  activeFilter: {
    marginTop: -4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFilterText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  clearFilter: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  chatBanner: {
    minHeight: 128,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    overflow: 'hidden',
    position: 'relative',
    ...shadow.soft,
  },
  chatDecorTop: {
    position: 'absolute',
    top: -28,
    right: -20,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chatDecorBottom: {
    position: 'absolute',
    bottom: -36,
    left: 48,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chatArt: {
    width: 84,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArtGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },
  chatArtPlate: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArtBadge: {
    position: 'absolute',
    right: 4,
    bottom: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    zIndex: 1,
  },
  chatTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
  },
  chatBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  chatCta: {
    alignSelf: 'flex-start',
    marginTop: 6,
    minHeight: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatCtaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
    paddingHorizontal: 2,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeAlt: {
    backgroundColor: colors.softYellow,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  faqRow: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faqRowFeatured: {
    backgroundColor: '#FFF9C4',
  },
  faqCopy: {
    flex: 1,
    minWidth: 0,
  },
  faqQuestion: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  viewAllRow: {
    marginTop: 4,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewAll: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  emptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: space.md,
    gap: 6,
    minHeight: 122,
    justifyContent: 'flex-start',
    ...shadow.soft,
  },
  categoryCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  categoryTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  categoryBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: space.xl,
    gap: space.sm,
  },
  filterTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  filterOption: {
    minHeight: 48,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: colors.softBackground,
  },
  filterOptionActive: {
    backgroundColor: colors.softYellow,
  },
  filterOptionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
