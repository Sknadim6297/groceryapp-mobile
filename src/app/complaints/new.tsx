import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, space } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { accountRoutes, complaintDetailsHref } from '@/navigation/accountRoutes';
import { activateDeviceComplaintStore, createComplaint } from '@/services/complaintStore';
import {
  COMPLAINT_CATEGORY_LABELS,
  complaintCategories,
  type ComplaintCategory,
} from '@/types/complaints';

export default function NewComplaintScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { showToast } = useToast();
  const { orders } = usePreviewSession();
  const [category, setCategory] = useState<ComplaintCategory>('order');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderOptions = useMemo(() => orders.slice(0, 8), [orders]);
  const canSubmit =
    subject.trim().length >= 3 && description.trim().length >= 8 && !submitting;

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Raise a Complaint"
        message="Complaint submission is not connected to a live support API."
        withHeader
      />
    );
  }

  async function submit() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    if (Platform.OS !== 'web') {
      await activateDeviceComplaintStore();
    }
    const created = await createComplaint({
      category,
      subject,
      description,
      orderId,
    });
    setSubmitting(false);
    if (!created) {
      setError('Could not save this complaint on the device. Check the fields and try again.');
      showToast('error', 'Complaint was not saved.');
      return;
    }
    showToast('success', 'Complaint saved locally with a device reference ID.');
    router.replace(complaintDetailsHref(created.id));
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Raise a Complaint" fallbackHref={accountRoutes.complaints} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 24 + keyboardOverlap + Math.max(insets.bottom, 12) },
          ]}
          showsVerticalScrollIndicator={false}>
          <DemoBanner message="Local demo ticket only — this does not open a live support case." />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {complaintCategories.map((id) => {
              const active = category === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCategory(id)}
                  style={[styles.chip, active && styles.chipOn]}>
                  <Text style={[styles.chipLabel, active && styles.chipLabelOn]}>
                    {COMPLAINT_CATEGORY_LABELS[id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {orderOptions.length > 0 ? (
            <>
              <Text style={styles.label}>Related order (optional)</Text>
              <View style={styles.chips}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: !orderId }}
                  onPress={() => setOrderId(undefined)}
                  style={[styles.chip, !orderId && styles.chipOn]}>
                  <Text style={[styles.chipLabel, !orderId && styles.chipLabelOn]}>None</Text>
                </Pressable>
                {orderOptions.map((order) => {
                  const active = orderId === order.id;
                  return (
                    <Pressable
                      key={order.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setOrderId(order.id)}
                      style={[styles.chip, active && styles.chipOn]}>
                      <Text style={[styles.chipLabel, active && styles.chipLabelOn]}>#{order.id}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Short summary"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel="Complaint subject"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what happened (at least 8 characters)"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Complaint description"
          />

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + keyboardOverlap }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit complaint"
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
            disabled={!canSubmit}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submit,
              !canSubmit && styles.submitDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            testID="complaint-submit">
            {submitting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitLabel}>Submit Complaint</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  flex: { flex: 1 },
  content: {
    padding: homeLayout.gutter,
    gap: space.md,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipLabelOn: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  textarea: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  submit: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
