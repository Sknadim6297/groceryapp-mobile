/** Local demo Live Chat message — not a live agent transcript. */

export type SupportChatSender = 'customer' | 'demo_assistant';

export type SupportChatKind = 'text' | 'image';

export type SupportChatMessage = {
  id: string;
  ownerKey: string;
  sender: SupportChatSender;
  kind: SupportChatKind;
  /** Plain text body for text messages. */
  text?: string;
  /** Local file/blob URI for image messages — never an uploaded CDN URL in demo mode. */
  imageUri?: string;
  createdAt: number;
  /** Always true until a live support backend is connected. */
  localOnly: true;
};

export type SupportChatThread = {
  ownerKey: string;
  messages: SupportChatMessage[];
  updatedAt: number;
};

export const SUPPORT_CHAT_MAX_TEXT = 1000;
export const SUPPORT_CHAT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORT_CHAT_HISTORY_LIMIT = 120;
