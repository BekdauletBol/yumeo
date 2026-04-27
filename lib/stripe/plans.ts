/** Yumeo subscription plans */
export const PLANS = {
    free: {
      name: 'Free',
      price: 0,
      maxProjects: 3,
      maxFilesPerProject: 10,
      maxFileSizeMB: 5,
      model: 'claude-sonnet-4-5' as const,
      features: [
        '3 research projects',
        '10 files per project',
        '5 MB file limit',
        'Claude Sonnet 4.5 model',
        'Strict grounding mode',
      ],
    },
    pro: {
      name: 'Pro',
      price: 19,
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
      maxProjects: 50,
      maxFilesPerProject: 100,
      maxFileSizeMB: 50,
      model: 'claude-opus-4-5' as const,
      features: [
        'Unlimited research projects',
        '100 files per project',
        '50 MB file limit',
        'Claude Opus 4.5 model',
        'Strict + flexible grounding modes',
        'Export to DOCX & LaTeX',
        'Priority support',
      ],
    },
  } as const;
  
  export type PlanKey = keyof typeof PLANS;
  
  /** Check if a plan allows a given model */
  export function planAllowsModel(
    plan: PlanKey,
    model: string,
  ): boolean {
    return PLANS[plan].model === model || plan === 'pro';
  }
  
  /** Check if a plan allows uploading another file */
  export function planAllowsMoreFiles(
    plan: PlanKey,
    currentFileCount: number,
  ): boolean {
    return currentFileCount < PLANS[plan].maxFilesPerProject;
  }