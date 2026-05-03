/** Yumeo subscription plans */
export const PLANS = {
    free: {
      name: 'Free',
      price: 0,
      maxProjects: 2,
      maxFilesPerProject: 5,
      maxFileSizeMB: 25,
      model: 'gpt-4o' as const,
      features: [
        '2 research projects',
        '5 files per project',
        '25 MB file limit',
        'GPT-4o powered',
        'Strict grounding — answers only from your files',
        'Export to DOCX',
      ],
    },
    pro: {
      name: 'Pro',
      price: 9,
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
      maxProjects: -1, // unlimited
      maxFilesPerProject: 50,
      maxFileSizeMB: 100,
      model: 'gpt-4o' as const,
      features: [
        'Unlimited research projects',
        '50 files per project',
        '100 MB file limit',
        'GPT-4o powered',
        'Strict + flexible grounding modes',
        'Export to DOCX + LaTeX',
        'Priority retrieval (more context per query)',
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