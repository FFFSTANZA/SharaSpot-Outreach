import type { FollowUpTemplate, FollowUpTemplatePayload, SequencePreset } from "@/types";
import {
  listFollowUpTemplates as listFollowUpTemplatesApi,
  upsertFollowUpTemplate as upsertFollowUpTemplateApi,
  deleteFollowUpTemplate as deleteFollowUpTemplateApi,
  getFollowUpTemplateById as getFollowUpTemplateByIdApi,
} from "@/lib/apis/followUpTemplates";

export async function listFollowUpTemplates(): Promise<FollowUpTemplate[]> {
  return listFollowUpTemplatesApi();
}

export async function getFollowUpTemplateById(id: string): Promise<FollowUpTemplate> {
  return getFollowUpTemplateByIdApi(id);
}

export async function upsertFollowUpTemplate(
  template: FollowUpTemplatePayload & { id?: string }
): Promise<FollowUpTemplate> {
  return upsertFollowUpTemplateApi(template);
}

export async function deleteFollowUpTemplate(id: string): Promise<void> {
  await deleteFollowUpTemplateApi(id);
}

export function getLastUsedTemplates(templates: FollowUpTemplate[], count: number = 3): FollowUpTemplate[] {
  return [...templates]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, count);
}

export function followUpTemplateToPreset(template: FollowUpTemplate): SequencePreset {
  return {
    name: template.id,
    label: template.name,
    description: template.description || `Custom ${template.steps.length}-step template`,
    steps: template.steps,
  };
}
