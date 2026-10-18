// services/messageTemplateService.ts
import { api } from '@/lib/api';
import {
  MessageTemplate,
  MessageTemplateListItem,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
} from '../types/messageTemplate.types';

const bizPath = (businessId: string) => `/private/business/${businessId}`;

// GET /private/business/{businessId}/v2messagetemplates
// Maps each item explicitly so nested `templates` (email/whatsapp) are preserved.
export const getMessageTemplates = (businessId: string): Promise<MessageTemplateListItem[]> =>
  api
    .get<unknown[]>(`${bizPath(businessId)}/v2messagetemplates`)
    .then((r) =>
      (r.data ?? []).map((item: any): MessageTemplateListItem => ({
        id:               item.id ?? item.key,
        key:              item.key ?? '',
        name:             item.name ?? '',
        channels:         item.channels ?? [],
        reminder_type:    item.reminder_type,
        serviceType:      item.serviceType ?? item.reminder_type,
        businessCategory: item.businessCategory ?? item.business_category ?? '',
        placeholders:     item.placeholders ?? [],
        isActive:         item.isActive ?? item.is_active ?? true,
        templates: {
          email: item.templates?.email
            ? { subject: item.templates.email.subject ?? '', body: item.templates.email.body ?? '' }
            : undefined,
          whatsapp: item.templates?.whatsapp
            ? { body: item.templates.whatsapp.body ?? '' }
            : undefined,
        },
      }))
    );

// GET /private/business/{businessId}/v2messagetemplate/{id}
export const getMessageTemplateById = (businessId: string, id: string): Promise<MessageTemplate> =>
  api
    .get<MessageTemplate>(`${bizPath(businessId)}/v2messagetemplate/${id}`)
    .then((r) => r.data);

// POST /private/business/{businessId}/v2messagetemplates
export const createMessageTemplate = (
  businessId: string,
  dto: CreateMessageTemplateDto
): Promise<MessageTemplate> =>
  api
    .post<MessageTemplate>(`${bizPath(businessId)}/v2messagetemplates`, dto)
    .then((r) => r.data);

// PATCH /private/business/{businessId}/v2messagetemplate/{id}
export const updateMessageTemplate = (
  businessId: string,
  id: string,
  dto: UpdateMessageTemplateDto
): Promise<MessageTemplate> =>
  api
    .patch<MessageTemplate>(`${bizPath(businessId)}/v2messagetemplate/${id}`, dto)
    .then((r) => r.data);

// DELETE /private/business/{businessId}/v2messagetemplate/{id}
export const deleteMessageTemplate = (businessId: string, id: string): Promise<void> =>
  api
    .delete(`${bizPath(businessId)}/v2messagetemplate/${id}`)
    .then(() => undefined);