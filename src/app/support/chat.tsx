import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { supportFaqById } from '@/data/supportFaq';
import { profileRoutes } from '@/navigation/profileRoutes';
import {
  activateDeviceSupportChatStore,
  appendSupportChatMessage,
  loadSupportChatThread,
  supportChatOwnerKey,
} from '@/services/supportChatStore';
import {
  SUPPORT_CHAT_MAX_IMAGE_BYTES,
  SUPPORT_CHAT_MAX_TEXT,
  type SupportChatMessage,
} from '@/types/supportChat';
import { contentColumnWidth } from '@/utils/contentWidth';
import { hapticSelection } from '@/utils/haptics';
import {
  buildSupportChatListItems,
  canSendChatText,
  formatChatClock,
  type SupportChatListItem,
} from '@/utils/supportChat';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLiveChatScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const { session, devSession } = useAuthSession();
  const params = useLocalSearchParams<{ faqId?: string | string[] }>();
  const faqIdParam = firstParam(params.faqId)?.trim() ?? '';
  const faq = faqIdParam ? supportFaqById(faqIdParam) : undefined;

  const ownerKey = supportChatOwnerKey(
    session?.mobile
      ? { mobile: session.mobile, kind: 'temporary-ui' }
      : devSession?.mobile
        ? { mobile: devSession.mobile, kind: 'development-test' }
        : { mobile: null, kind: 'preview-guest' },
  );

  const contentWidth = contentColumnWidth(width);
  const bubbleMax = Math.min(280, Math.floor(contentWidth * 0.72));
  const listRef = useRef<FlatList<SupportChatListItem> | null>(null);
  const sendingRef = useRef(false);
  const nearBottomRef = useRef(true);
  const storeReadyRef = useRef(Platform.OS === 'web');

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [dismissedFaqId, setDismissedFaqId] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);

  const faqChip = faq && dismissedFaqId !== faq.id ? faq.question : null;
  const listItems = useMemo(() => buildSupportChatListItems(messages), [messages]);
  const canSend = (canSendChatText(draft) || Boolean(pendingImageUri)) && !sending;
  const enter = reducedMotion ? undefined : FadeInUp.duration(180);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: animated && !reducedMotion });
    });
  }, [reducedMotion]);

  const reloadThread = useCallback(async () => {
    try {
      if (!storeReadyRef.current && Platform.OS !== 'web') {
        await activateDeviceSupportChatStore();
        storeReadyRef.current = true;
      }
      const thread = await loadSupportChatThread(ownerKey);
      setMessages(thread.messages);
      setSaveError(null);
    } catch {
      setSaveError('Could not load the local demo chat history.');
    } finally {
      setLoading(false);
    }
  }, [ownerKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!storeReadyRef.current && Platform.OS !== 'web') {
          await activateDeviceSupportChatStore();
          storeReadyRef.current = true;
        }
        const thread = await loadSupportChatThread(ownerKey);
        if (cancelled) {
          return;
        }
        setMessages(thread.messages);
        setSaveError(null);
      } catch {
        if (!cancelled) {
          setSaveError('Could not load the local demo chat history.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerKey]);

  async function persistCustomerMessage(input: {
    kind: 'text' | 'image';
    text?: string;
    imageUri?: string;
  }) {
    if (sendingRef.current) {
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setSaveError(null);
    try {
      const saved = await appendSupportChatMessage(ownerKey, {
        sender: 'customer',
        kind: input.kind,
        text: input.text,
        imageUri: input.imageUri,
      });
      setMessages((current) => [...current, saved]);
      nearBottomRef.current = true;
      setShowJump(false);
      scrollToLatest(true);
    } catch {
      setSaveError('Could not save this message on this device. Your draft was kept.');
      throw new Error('save-failed');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function onSend() {
    void hapticSelection();
    const text = draft.trim();
    const imageUri = pendingImageUri;
    if ((!text && !imageUri) || sendingRef.current) {
      return;
    }
    if (text && !canSendChatText(text)) {
      showToast('warning', `Keep messages under ${SUPPORT_CHAT_MAX_TEXT} characters.`);
      return;
    }
    try {
      if (imageUri) {
        await persistCustomerMessage({ kind: 'image', imageUri, text: text || undefined });
        setPendingImageUri(null);
      }
      if (text) {
        await persistCustomerMessage({ kind: 'text', text });
      }
      setDraft('');
    } catch {
      // Draft retained; saveError already set.
    }
  }

  async function onPickImage() {
    void hapticSelection();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('warning', 'Photo library permission is required to attach an image.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (picked.canceled || !picked.assets[0]?.uri) {
        return;
      }
      const asset = picked.assets[0];
      if (typeof asset.fileSize === 'number' && asset.fileSize > SUPPORT_CHAT_MAX_IMAGE_BYTES) {
        showToast('warning', 'Choose an image under 5 MB for the demo chat.');
        return;
      }
      setPendingImageUri(asset.uri);
    } catch {
      showToast('error', 'Could not open the photo library.');
    }
  }

  function renderItem({ item }: { item: SupportChatListItem }) {
    if (item.type === 'day') {
      return (
        <View style={styles.dayWrap}>
          <Text style={styles.dayLabel}>{item.label}</Text>
        </View>
      );
    }
    const message = item.message;
    const mine = message.sender === 'customer';
    return (
      <Animated.View entering={enter} style={[styles.row, mine ? styles.rowMine : styles.rowSupport]}>
        {!mine ? (
          <View style={styles.avatar}>
            <AppIcon name="headset" color={colors.text} size={16} />
          </View>
        ) : (
          <View style={styles.avatarSpacer} />
        )}
        <View style={[styles.bubbleCol, mine ? styles.bubbleColMine : null, { maxWidth: bubbleMax + 24 }]}>
          {!mine ? <Text style={styles.senderLabel}>Demo Assistant</Text> : null}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleSupport, { maxWidth: bubbleMax }]}>
            {message.kind === 'image' && message.imageUri ? (
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel="Open attached image"
                onPress={() => setPreviewUri(message.imageUri ?? null)}>
                <Image source={{ uri: message.imageUri }} style={styles.image} contentFit="cover" transition={120} />
              </Pressable>
            ) : null}
            {message.text ? (
              <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : null]}>{message.text}</Text>
            ) : null}
            {mine ? (
              <Text style={styles.metaInside}>{formatChatClock(message.createdAt)} · Local only</Text>
            ) : null}
          </View>
          {!mine ? <Text style={styles.metaOutside}>{formatChatClock(message.createdAt)}</Text> : null}
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Live Chat"
        fallbackHref={profileRoutes.help}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Demo chat information"
            hitSlop={8}
            onPress={() => setInfoOpen(true)}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}>
            <AppIcon name="info" color={colors.text} size={20} />
          </Pressable>
        }
      />
      <View style={styles.statusStrip}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText} numberOfLines={1}>
          Demo Chat · Not connected to a live agent
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {faqChip ? (
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel} numberOfLines={1}>
                Regarding: {faqChip}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss FAQ context"
                hitSlop={8}
                onPress={() => {
                  if (faq) {
                    setDismissedFaqId(faq.id);
                  }
                }}>
                <AppIcon name="close" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={[styles.listWrap, { maxWidth: homeLayout.maxWidth, width: '100%', alignSelf: 'center' }]}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.primaryInk} />
              <Text style={styles.stateBody}>Loading local demo chat…</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={listItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.listContent,
                listItems.length === 0 ? styles.listContentEmpty : null,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={() => {
                if (nearBottomRef.current) {
                  scrollToLatest(false);
                }
              }}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const distance = contentSize.height - (contentOffset.y + layoutMeasurement.height);
                const near = distance < 80;
                nearBottomRef.current = near;
                setShowJump(!near && messages.length > 0);
              }}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <View style={styles.emptyArt}>
                    <AppIcon name="chat" color={colors.text} size={28} />
                  </View>
                  <Text style={styles.emptyTitle}>How can we help you?</Text>
                  <Text style={styles.emptyBody}>
                    Start a conversation to describe your issue. Messages stay on this device — this is a demo chat,
                    not a live support agent.
                  </Text>
                </View>
              }
            />
          )}

          {showJump ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Jump to latest messages"
              onPress={() => {
                nearBottomRef.current = true;
                setShowJump(false);
                scrollToLatest(true);
              }}
              style={styles.jumpBtn}>
              <AppIcon name="chevronDown" color={colors.text} size={18} />
            </AnimatedPressable>
          ) : null}
        </View>

        {saveError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{saveError}</Text>
            <Pressable accessibilityRole="button" onPress={() => void reloadThread()}>
              <Text style={styles.errorRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {pendingImageUri ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(160)} style={styles.pendingWrap}>
            <Image source={{ uri: pendingImageUri }} style={styles.pendingImage} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove selected image"
              onPress={() => setPendingImageUri(null)}
              style={styles.pendingRemove}>
              <AppIcon name="close" color={colors.white} size={14} />
            </Pressable>
            <Text style={styles.pendingHint}>Local preview only · not uploaded</Text>
          </Animated.View>
        ) : null}

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.composer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach image"
              hitSlop={6}
              onPress={() => void onPickImage()}
              style={styles.attachBtn}>
              <AppIcon name="paperclip" color={colors.textSecondary} size={20} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Type your message"
              multiline
              maxLength={SUPPORT_CHAT_MAX_TEXT}
              style={styles.input}
              editable={!sending}
            />
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => void onSend()}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}>
              {sending ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <AppIcon name="send" color={colors.text} size={18} />
              )}
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={infoOpen} transparent animationType="fade" onRequestClose={() => setInfoOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setInfoOpen(false)}>
          <Pressable style={styles.infoSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.infoIcon}>
              <AppIcon name="info" color={colors.text} size={22} />
            </View>
            <Text style={styles.infoTitle}>Demo Live Chat</Text>
            <Text style={styles.infoBody}>
              This screen stores messages on this device only. No support agent is online, and nothing is uploaded to a
              live helpdesk. Use email if you need to contact the store outside this preview.
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setInfoOpen(false)}>
              <Text style={styles.infoClose}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(previewUri)} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewUri(null)}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" />
          ) : null}
          <Text style={styles.previewHint}>Tap anywhere to close · local image</Text>
        </Pressable>
      </Modal>
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusStrip: {
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    paddingTop: 2,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipRow: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.text,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: 2,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  stateBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  emptyArt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dayWrap: {
    alignItems: 'center',
    marginVertical: space.sm,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: space.sm,
    gap: 8,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowSupport: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSpacer: {
    width: 0,
  },
  bubbleCol: {
    gap: 4,
  },
  bubbleColMine: {
    alignItems: 'flex-end',
  },
  senderLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleSupport: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    ...shadow.soft,
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bubbleTextMine: {
    fontFamily: fonts.medium,
  },
  metaInside: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.primaryInk,
    alignSelf: 'flex-end',
  },
  metaOutside: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  image: {
    width: '100%',
    aspectRatio: 1.2,
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
  jumpBtn: {
    position: 'absolute',
    right: 18,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  errorBanner: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorRetry: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  pendingWrap: {
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    alignSelf: 'flex-start',
  },
  pendingImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  pendingRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingHint: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  composerWrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.warmBackground,
  },
  composer: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    ...shadow.soft,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    maxHeight: 110,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  infoSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: space.xl,
    gap: space.md,
    alignItems: 'center',
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  infoBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoClose: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryInk,
    paddingVertical: 8,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  previewImage: {
    width: '100%',
    height: '70%',
  },
  previewHint: {
    marginTop: space.lg,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.white,
  },
  pressed: {
    opacity: 0.75,
  },
});
