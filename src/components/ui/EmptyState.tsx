import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, space, typeScale } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  body?: string;
  art?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, body, art, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {art ? <View style={styles.art}>{art}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    gap: space.sm,
  },
  art: {
    marginBottom: space.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: typeScale.heading.size,
    lineHeight: typeScale.heading.line,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: typeScale.label.size,
    lineHeight: typeScale.label.line,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: space.md,
  },
});
