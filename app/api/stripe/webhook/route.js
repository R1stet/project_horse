import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return Response.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object;
      console.log('Account updated:', account.id);
      
      // Check if onboarding is complete
      if (account.details_submitted && account.charges_enabled) {
        console.log('Onboarding completed for account:', account.id);
        // Here you could update your database to mark the seller as active
      }
      break;
      
    case 'account.application.deauthorized':
      console.log('Account deauthorized:', event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return Response.json({ received: true });
}