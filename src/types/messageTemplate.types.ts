// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────
export type ChannelType = 'email' | 'whatsapp' | 'sms' | 'in_app';
export type ReminderType = 'GST' | 'TDS' | 'ITR' | 'ROC' | 'MSME';
export type BusinessCategory = 'ACCOUNTS' | 'TAX' | 'COMPLIANCE' | 'AUDIT' | 'GENERAL';

// ─────────────────────────────────────────────
// Template Structures
// ─────────────────────────────────────────────
export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface WhatsAppTemplate {
  body: string;
}


export interface Templates {
  email?: EmailTemplate;
  whatsapp?: WhatsAppTemplate;
  sms?: { body: string };
  in_app?: { body: string };
}

// ─────────────────────────────────────────────
// 1️⃣ Message Template (Full Details)
// ─────────────────────────────────────────────
export interface MessageTemplate {
  id: string;
  key?: string;           // new: deterministic key e.g. "GST_REMINDER"
  name: string;
  templates: Templates;
  placeholders: string[];
  channels: ChannelType[];
  reminder_type: ReminderType;
  serviceType?: string;
  businessCategory: BusinessCategory;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// 2️⃣ Message Template List Item (Same as full)
// ─────────────────────────────────────────────
export interface MessageTemplateListItem {
  id: string;
  key: string;
  name: string;
  channels: ChannelType[];
  reminder_type: ReminderType;
  serviceType?: string;
  businessCategory: string;
  placeholders: string[];
  isActive: boolean;
  templates: Templates;        // ← ADD THIS ONE LINE
}
// ─────────────────────────────────────────────
// 3️⃣ Create Message Template Request
// ─────────────────────────────────────────────
export interface CreateMessageTemplateDto {
  name: string;
  key?: string;           // new: optional deterministic key
  templates: Templates;
  placeholders: string[];
  channels: ChannelType[];
  reminder_type: ReminderType;
  serviceType?: string;
  businessCategory: BusinessCategory;
  isActive: boolean;
}
// ─────────────────────────────────────────────
// 4️⃣ Update Message Template Request
// ─────────────────────────────────────────────
export interface UpdateMessageTemplateDto {
  name?: string;
  key?: string;           // new: optional
  templates?: Templates;
  placeholders?: string[];
  channels?: ChannelType[];
  reminder_type?: ReminderType;
  serviceType?: string;
  businessCategory?: string;
  isActive?: boolean;
}