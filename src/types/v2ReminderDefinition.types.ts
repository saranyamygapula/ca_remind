// ─── Enums / Constants ───────────────────────────────────────────────────────

export type ReminderChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'IN_APP' | string;

// ─── Base / Shared ────────────────────────────────────────────────────────────

export interface V2ReminderDefinitionBase {
  name: string;
  channel: ReminderChannel;
  offsetDays: number;
  messageTemplateId: string;
  isActive: boolean;
}

// ─── API Response Model ───────────────────────────────────────────────────────

export interface V2ReminderDefinition extends V2ReminderDefinitionBase {
  id: string;
  taskDefinitionId: string;
  businessId: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface CreateV2ReminderDefinitionPayload extends V2ReminderDefinitionBase {
  taskDefinitionId: string;
}

export interface UpdateV2ReminderDefinitionPayload extends Partial<V2ReminderDefinitionBase> {}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ListV2ReminderDefinitionsResponse {
  items: V2ReminderDefinition[];
}