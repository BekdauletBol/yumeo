import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe/client';

export const runtime = 'nodejs';

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout session for upgrading to Pro.
 * Returns the checkout URL for client-side redirect.
 */
export async function POST(_req: Request): Promise<Response> {
  const { userId } = auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const user = await currentUser();
  const userEmail =
    user?.emailAddresses[0]?.emailAddress ?? `user-${userId}@yumeo.app`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const checkoutUrl = await createCheckoutSession({
      userId,
      userEmail,
      successUrl: `${appUrl}/?upgraded=true`,
      cancelUrl:  `${appUrl}/pricing`,
    });

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return new Response(
      JSON.stringify({ error: message, code: 'CHECKOUT_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}