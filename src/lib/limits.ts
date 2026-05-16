export const FREE_LIMITS = {
  materialsPerProject: 5,
  messagesPerDay: 20,
}

export const PRO_LIMITS = {
  materialsPerProject: 50,
  messagesPerDay: 500,
}

export type PlanType = 'free' | 'pro';

export function getLimit(plan: PlanType, key: keyof typeof FREE_LIMITS) {
  return plan === 'pro' ? PRO_LIMITS[key] : FREE_LIMITS[key];
}
