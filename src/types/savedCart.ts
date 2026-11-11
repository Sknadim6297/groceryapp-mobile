/** Snapshot of cart quantities — prices are never stored as authoritative. */
export type SavedCart = {
  id: string;
  name: string;
  quantities: Record<string, number>;
  savedAt: number;
};
