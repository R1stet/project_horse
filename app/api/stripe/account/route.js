import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: "DK",
      capabilities: {
        card_payments: {requested: true},
        transfers: {requested: true}
      },
      business_type: 'individual',
      business_profile: {
        mcc: '7299', // Miscellaneous personal services
        name: 'Individual Seller',
        product_description: 'Equestrian marketplace seller',
        support_email: 'support@ridelikeapro.dk',
        url: 'https://ridelikeapro.dk'
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily'
          }
        }
      }
    });

    return Response.json({account: account.id});
  } catch (error) {
    console.error('An error occurred when calling the Stripe API to create an account:', error);
    return Response.json({error: error.message}, {status: 500});
  }
}