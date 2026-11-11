import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import {
  relatedSupportFaqs,
  supportFaqById,
  supportFaqDetailsHref,
  type SupportFaqItem,
} from '@/data/supportFaq';
import { profileRoutes } from '@/navigation/profileRoutes';
import { contentColumnWidth } from '@/utils/contentWidth';
import { hapticSelection } from '@/utils/haptics';
import { supportChatHref } from '@/utils/supportChat';

type FeedbackValue = 'up' | 'down' | null;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportFaqDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const faqId = firstParam(params.id)?.trim() ?? '';
  const faq = useMemo(() => (faqId ? supportFaqById(faqId) : undefined), [faqId]);
  const related = useMemo(() => (faq ? relatedSupportFaqs(faq.id, 3) : []), [faq]);
  const contentWidth = contentColumnWidth(width);
  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackValue>>({});
  const feedbackBusy = useRef(false);

  function openLiveChat() {
    void hapticSelection();
    router.push(supportChatHref(faq ? { faqId: faq.id } : undefined));
  }

  const feedback = faq ? (feedbackById[faq.id] ?? null) : null;
  const enter = reducedMotion ? undefined : FadeInDown.duration(220).springify().damping(18);

  function openRelated(item: SupportFaqItem) {
    void hapticSelection();
    if (item.id === faqId) {
      return;
    }
    router.replace(supportFaqDetailsHref(item.id));
  }

  function setFeedback(next: FeedbackValue) {
    if (!faq || feedbackBusy.current) {
      return;
    }
    feedbackBusy.current = true;
    void hapticSelection();
    setFeedbackById((current) => ({
      ...current,
      [faq.id]: current[faq.id] === next ? null : next,
    }));
    requestAnimationFrame(() => {
      feedbackBusy.current = false;
    });
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Support Center Details"
        fallbackHref={profileRoutes.help}
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

      <ScrollView
        key={faqId || 'missing-faq'}
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {!faq ? (
          <EmptyState
            title="Help topic not found"
            body="This FAQ id is missing or no longer available. Go back to Support Center to browse help topics."
            art={<AppIcon name="help" color={colors.textSecondary} size={36} />}
            action={
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Back to Support Center"
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace(profileRoutes.help);
                }}
                style={styles.notFoundCta}>
                <Text style={styles.notFoundCtaLabel}>Back to Support Center</Text>
              </AnimatedPressable>
            }
          />
        ) : (
          <>
            <Animated.View entering={enter} style={[styles.answerCard, { maxWidth: contentWidth }]}>
              <View style={styles.titleRow}>
                <Text style={styles.question}>{faq.question}</Text>
                <View style={styles.detailArt}>
                  <AppIcon name={faq.detailIcon ?? 'help'} color={colors.text} size={26} />
                </View>
              </View>

              <View style={styles.divider} />

              {faq.intro ? <Text style={styles.intro}>{faq.intro}</Text> : null}

              {faq.steps && faq.steps.length > 0 ? (
                <View style={styles.steps}>
                  {faq.steps.map((step, index) => (
                    <View key={`${faq.id}-step-${index}`} style={styles.stepRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.stepCopy}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepBody}>{step.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.paragraph}>{faq.answer}</Text>
              )}

              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Chat with Support"
                onPress={openLiveChat}
                style={styles.chatCta}>
                <AppIcon name="chat" color={colors.text} size={18} />
                <Text style={styles.chatCtaLabel}>Chat with Support</Text>
              </AnimatedPressable>
            </Animated.View>

            {related.length > 0 ? (
              <Animated.View entering={enter} style={styles.relatedCard}>
                <View style={styles.relatedHeader}>
                  <View style={styles.relatedBadge}>
                    <AppIcon name="link" color={colors.text} size={14} />
                  </View>
                  <Text style={styles.relatedTitle}>Related Questions</Text>
                </View>
                {related.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <View style={styles.relatedDivider} /> : null}
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel={item.question}
                      onPress={() => openRelated(item)}
                      style={styles.relatedRow}>
                      <Text style={styles.relatedQuestion}>{item.question}</Text>
                      <AppIcon name="chevron" color={colors.textSecondary} size={18} />
                    </AnimatedPressable>
                  </View>
                ))}
              </Animated.View>
            ) : null}

            <Animated.View entering={enter} style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>Was this helpful?</Text>
              <View style={styles.feedbackActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark as helpful"
                  accessibilityState={{ selected: feedback === 'up' }}
                  onPress={() => setFeedback('up')}
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    feedback === 'up' && styles.feedbackBtnUp,
                    pressed && styles.pressed,
                  ]}>
                  <AppIcon
                    name="thumbsUp"
                    color={feedback === 'up' ? colors.text : colors.textSecondary}
                    size={18}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark as not helpful"
                  accessibilityState={{ selected: feedback === 'down' }}
                  onPress={() => setFeedback('down')}
                  style={({ pressed }) => [
                    styles.feedbackBtn,
                    feedback === 'down' && styles.feedbackBtnDown,
                    pressed && styles.pressed,
                  ]}>
                  <AppIcon
                    name="thumbsDown"
                    color={feedback === 'down' ? colors.text : colors.textSecondary}
                    size={18}
                  />
                </Pressable>
              </View>
            </Animated.View>

            {feedback ? (
              <Text style={styles.feedbackNote}>
                Thanks — noted for this session only. Feedback is not stored or sent to support servers.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
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
    paddingTop: space.lg,
    gap: space.md,
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
  answerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.lg,
    gap: space.md,
    alignSelf: 'stretch',
    ...shadow.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  question: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  detailArt: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  steps: {
    gap: space.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  stepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  stepBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  chatCta: {
    marginTop: space.sm,
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.soft,
  },
  chatCtaLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  relatedCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
    ...shadow.card,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
    paddingHorizontal: 4,
  },
  relatedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  relatedRow: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relatedQuestion: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  relatedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    ...shadow.soft,
  },
  feedbackLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  feedbackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  feedbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnUp: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  feedbackBtnDown: {
    borderColor: colors.ink,
    backgroundColor: colors.cream,
  },
  feedbackNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  notFoundCta: {
    minHeight: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundCtaLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
