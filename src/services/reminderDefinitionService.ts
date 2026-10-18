// services/reminderDefinitionService.ts
import { api } from '@/lib/api';
import {
  V2ReminderDefinition,
  CreateV2ReminderDefinitionPayload,
  UpdateV2ReminderDefinitionPayload,
  ListV2ReminderDefinitionsResponse,
} from '@/types/v2ReminderDefinition.types';

const bizPath = (businessId: string) => `/private/business/${businessId}`;
const V2_REMINDER_DEFS_PATH = 'v2reminderdefinitions';

// GET /private/business/{businessId}/v2reminderdefinitions
// Handles both { items: [...] } and raw array responses.
export const getV2ReminderDefinitions = (businessId: string): Promise<V2ReminderDefinition[]> =>
  api
    .get<ListV2ReminderDefinitionsResponse | V2ReminderDefinition[]>(
      `${bizPath(businessId)}/${V2_REMINDER_DEFS_PATH}`
    )
    .then((r) => {
      const data = r.data;
      if (data && Array.isArray((data as ListV2ReminderDefinitionsResponse).items)) {
        return (data as ListV2ReminderDefinitionsResponse).items;
      }
      if (Array.isArray(data)) return data as V2ReminderDefinition[];
      return [];
    });

// GET /private/business/{businessId}/v2reminderdefinitions/{definitionId}
export const getV2ReminderDefinitionById = (
  businessId: string,
  definitionId: string
): Promise<V2ReminderDefinition> =>
  api
    .get<V2ReminderDefinition>(`${bizPath(businessId)}/${V2_REMINDER_DEFS_PATH}/${definitionId}`)
    .then((r) => r.data);

// POST /private/business/{businessId}/v2reminderdefinitions
export const createV2ReminderDefinition = (
  businessId: string,
  payload: CreateV2ReminderDefinitionPayload
): Promise<V2ReminderDefinition> =>
  api
    .post<V2ReminderDefinition>(`${bizPath(businessId)}/${V2_REMINDER_DEFS_PATH}`, payload)
    .then((r) => r.data);

// PATCH /private/business/{businessId}/v2reminderdefinitions/{definitionId}
export const updateV2ReminderDefinition = (
  businessId: string,
  definitionId: string,
  payload: UpdateV2ReminderDefinitionPayload
): Promise<V2ReminderDefinition> =>
  api
    .patch<V2ReminderDefinition>(
      `${bizPath(businessId)}/${V2_REMINDER_DEFS_PATH}/${definitionId}`,
      payload
    )
    .then((r) => r.data);

// DELETE /private/business/{businessId}/v2reminderdefinitions/{definitionId}
export const deleteV2ReminderDefinition = (
  businessId: string,
  definitionId: string
): Promise<void> =>
  api
    .delete(`${bizPath(businessId)}/${V2_REMINDER_DEFS_PATH}/${definitionId}`)
    .then(() => undefined);