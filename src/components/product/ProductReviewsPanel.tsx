import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { ProductStarRating } from '@/components/product/ProductStarRating';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii } from '@/constants/theme';
import type { ProductReview, ProductReviewSummary, ReviewSortId, ReviewVote } from '@/types/productReviews';

type ProductReviewsPanelProps = {
  summary: ProductReviewSummary;
  reviews: ProductReview[];
  sort: ReviewSortId;
  onSortChange: (sort: ReviewSortId) => void;
  voteFor: (reviewId: string) => ReviewVote | null;
  onVote: (review: ProductReview, vote: ReviewVote) => void;
  onWriteReview: () => void;
  compact?: boolean;
};

export function ProductReviewsPanel({
  summary,
  reviews,
  sort,
  onSortChange,
  voteFor,
  onVote,
  onWriteReview,
  compact = false,
}: ProductReviewsPanelProps) {
  const visible = compact ? reviews.slice(0, 3) : reviews;
  const maxBar = Math.max(1, ...summary.distribution);

  return (
    <View style={styles.wrap}>
      <View style={styles.summaryRow}>
        <View style={styles.averageBlock}>
          <Text style={styles.average}>{summary.average.toFixed(1)}</Text>
          <ProductStarRating rating={summary.average} size={14} />
          <Text style={styles.total}>({summary.total} Review{summary.total === 1 ? '' : 's'})</Text>
        </View>
        <View style={styles.bars}>
          {[5, 4, 3, 2, 1].map((star, index) => {
            const count = summary.distribution[index] ?? 0;
            const widthPct = Math.round((count / maxBar) * 100);
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${widthPct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {summary.includesPreview ? (
        <Text style={styles.previewNote}>Includes preview sample reviews — not live store ratings.</Text>
      ) : null}

      <View style={styles.sortRow}>
        {(['helpful', 'newest'] as const).map((option) => {
          const active = sort === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSortChange(option)}
              style={[styles.sortChip, active && styles.sortChipOn]}>
              <Text style={[styles.sortLabel, active && styles.sortLabelOn]}>
                {option === 'helpful' ? 'Helpful' : 'Newest'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Text style={styles.empty}>No reviews yet. Be the first to share your experience.</Text>
      ) : (
        visible.map((review, index) => (
          <ReviewRow
            key={review.id}
            review={review}
            vote={voteFor(review.id)}
            onVote={onVote}
            showDivider={index < visible.length - 1}
          />
        ))
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Write a review"
        onPress={onWriteReview}
        style={({ pressed }) => [styles.writeButton, pressed && styles.pressed]}>
        <Text style={styles.writeLabel}>Write a Review</Text>
      </Pressable>
    </View>
  );
}

function ReviewRow({
  review,
  vote,
  onVote,
  showDivider,
}: {
  review: ProductReview;
  vote: ReviewVote | null;
  onVote: (review: ProductReview, vote: ReviewVote) => void;
  showDivider: boolean;
}) {
  const initial = review.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.review, showDivider && styles.reviewBorder]}>
      <View style={styles.reviewHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.reviewer} numberOfLines={1}>
          {review.name}
        </Text>
        <Text style={styles.when}>{review.whenLabel}</Text>
      </View>
      <Text style={styles.body}>{review.body}</Text>
      {review.tags && review.tags.length > 0 ? (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.reviewMeta}>
        <ProductStarRating rating={review.rating} size={13} showValue />
        <View style={styles.votes}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark review helpful"
            accessibilityState={{ selected: vote === 'helpful' }}
            hitSlop={8}
            onPress={() => onVote(review, 'helpful')}
            style={styles.voteBtn}>
            <AppIcon name="thumbsUp" color={vote === 'helpful' ? colors.primaryInk : colors.textSecondary} size={16} />
            <Text style={styles.voteCount}>{review.helpfulCount}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark review not helpful"
            accessibilityState={{ selected: vote === 'not_helpful' }}
            hitSlop={8}
            onPress={() => onVote(review, 'not_helpful')}
            style={styles.voteBtn}>
            <AppIcon
              name="thumbsDown"
              color={vote === 'not_helpful' ? colors.danger : colors.textSecondary}
              size={16}
            />
            <Text style={styles.voteCount}>{review.notHelpfulCount}</Text>
          </Pressable>
        </View>
      </View>
      {review.photos && review.photos.length > 0 ? (
        <View style={styles.photos}>
          {review.photos.slice(0, 4).map((photo, index) => (
            <CatalogImage
              key={`${review.id}-photo-${index}`}
              source={photo}
              style={styles.photo}
              contentFit="cover"
              label={`${review.name} review photo ${index + 1}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  averageBlock: {
    width: 88,
    alignItems: 'center',
    gap: 4,
  },
  average: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
  },
  total: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bars: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    width: 12,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  previewNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipOn: {
    backgroundColor: colors.primary,
  },
  sortLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  sortLabelOn: {
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  review: {
    gap: 8,
    paddingVertical: 10,
  },
  reviewBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.iconBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  reviewer: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  when: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
  },
  tagLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryInk,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
  },
  voteCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  photos: {
    flexDirection: 'row',
    gap: 8,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.softBackground,
  },
  writeButton: {
    marginTop: 4,
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
