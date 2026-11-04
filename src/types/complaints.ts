export const complaintCategories = [
  'order',
  'delivery',
  'product',
  'payment',
  'app',
  'other',
] as const;

export type ComplaintCategory = (typeof complaintCategories)[number];

export const complaintStatuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type ComplaintStatus = (typeof complaintStatuses)[number];

/**
 * Device-local support complaint for UI preview.
 * Not a live ticketing system — IDs are local only.
 */
export type DeviceComplaint = {
  id: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  orderId?: string;
  status: ComplaintStatus;
  createdAt: number;
  updatedAt: number;
};

export type ComplaintDraft = {
  category: ComplaintCategory;
  subject: string;
  description: string;
  orderId?: string;
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  order: 'Order issue',
  delivery: 'Delivery',
  product: 'Product quality',
  payment: 'Payment',
  app: 'App / account',
  other: 'Other',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
