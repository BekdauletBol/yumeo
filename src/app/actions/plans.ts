'use server';

import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/db/supabase';
import { FREE_LIMITS, PRO_LIMITS, type PlanType } from '@/lib/limits';

export async function getUserPlanAction(): Promise<PlanType> {
  const { userId } = auth();
  if (!userId) return 'free';

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'free';
  return data.plan as PlanType;
}

export async function checkMaterialLimitAction(projectId: string): Promise<{ allowed: boolean; message?: string }> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const plan = await getUserPlanAction();
  const limit = plan === 'pro' ? PRO_LIMITS.materialsPerProject : FREE_LIMITS.materialsPerProject;

  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('materials')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) throw new Error('Failed to check usage limits');

  if ((count || 0) >= limit) {
    return {
      allowed: false,
      message: `You've reached your ${plan} plan limit of ${limit} materials per project. Upgrade to Pro for unlimited access.`,
    };
  }

  return { allowed: true };
}

export async function checkMessageLimitAction(): Promise<{ allowed: boolean; message?: string }> {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');

  const plan = await getUserPlanAction();
  const limit = plan === 'pro' ? PRO_LIMITS.messagesPerDay : FREE_LIMITS.messagesPerDay;

  const supabase = createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', today.toISOString());

  if (error) throw new Error('Failed to check message limits');

  if ((count || 0) >= limit) {
    return {
      allowed: false,
      message: `You've reached your ${plan} plan limit of ${limit} AI messages per day. Upgrade to Pro for higher limits.`,
    };
  }

  return { allowed: true };
}
