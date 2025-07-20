import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { account } = await request.json();

    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: `${request.headers.get('origin')}/stripe/refresh/${account}`,
      return_url: `${request.headers.get('origin')}/stripe/return/${account}`,
      type: "account_onboarding",
    });

    return Response.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error(
      "An error occurred when calling the Stripe API to create an account link:",
      error
    );
    return Response.json({error: error.message}, {status: 500});
  }
}