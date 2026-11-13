import type { AppMeta, Review } from "./types";

export const DEMO_APP: AppMeta = {
  appId: "demo.quickbasket",
  appName: "QuickBasket (demo data)",
};

interface Template {
  texts: string[];
  ratings: number[]; // cycled alongside texts
  count: number;
}

// Fully synthetic, hand-written review text for a fictional quick-commerce app.
// No real user data -- this exists so the whole product works offline, with
// no network call and no API key.
const TEMPLATES: Template[] = [
  {
    // bug
    texts: [
      "App crashes every single time I try to check out, so frustrating.",
      "The app freezes on the home screen after the last update, had to reinstall.",
      "Payment page force closes the app, lost my cart twice today.",
      "Keeps crashing when I open the offers tab, totally unusable.",
      "Got an error screen and the app just closed, bug needs fixing asap.",
      "App glitches and logs me out randomly mid-order.",
      "Crashed during checkout and charged my card twice, had to request a refund.",
      "The search feature throws an error and the whole app stops working.",
    ],
    ratings: [1, 1, 2, 1, 2, 1, 1, 2],
    count: 22,
  },
  {
    // delivery
    texts: [
      "Delivery was very late, waited almost 2 hours past the promised slot.",
      "Order never arrived, delivery partner marked it delivered but I got nothing.",
      "Delivery was delayed by over an hour with no notification at all.",
      "Took forever to arrive, the 10-minute promise is a joke most days.",
      "Driver couldn't find my address and the order just sat out for delivery for ages.",
      "Delivery was late again, third time this month.",
      "The delivery slot kept getting pushed back with no explanation.",
    ],
    ratings: [2, 1, 2, 2, 3, 1, 2],
    count: 20,
  },
  {
    // pricing
    texts: [
      "Prices are way too expensive compared to the local store, feels overpriced.",
      "Hidden delivery charge added at the last step, not transparent at all.",
      "Subscription fee keeps going up but the service hasn't improved.",
      "Surge pricing during rain makes basic groceries unaffordable.",
      "The discounted price shown in the app never matches the final bill.",
      "Too costly for what you actually get, cheaper to just go to the store.",
    ],
    ratings: [2, 2, 3, 2, 2, 3],
    count: 14,
  },
  {
    // support
    texts: [
      "Customer support never responded to my refund request for a week.",
      "Raised a complaint and the support team just closed the ticket with no reply.",
      "No response from the helpline after 3 calls about a missing item.",
      "Support chat just gives automated replies, never a real resolution.",
      "Refund never came through even after support confirmed it twice.",
      "Customer service was unhelpful and rude when I asked about a late order.",
    ],
    ratings: [1, 1, 2, 1, 1, 2],
    count: 16,
  },
  {
    // quality
    texts: [
      "Received a damaged packet of fruits, clearly not checked before dispatch.",
      "Got an expired dairy product, had to throw it away immediately.",
      "Wrong item delivered twice in a row, poor quality control.",
      "Vegetables were rotten on arrival, very poor quality this time.",
      "Product was fake, not the branded item shown in the listing.",
      "Packaging was crushed and half the order was spoiled.",
    ],
    ratings: [1, 1, 2, 1, 1, 2],
    count: 12,
  },
  {
    // ux
    texts: [
      "The navigation is so confusing, hard to find the orders page.",
      "New redesign is clunky, takes too many taps to reorder past items.",
      "Hard to use the search filter, results don't match what I typed.",
      "Interface is cluttered and it's hard to find my saved addresses.",
      "The checkout flow is confusing, I accidentally added a subscription.",
      "App layout changed and now I can't find the order tracking page.",
    ],
    ratings: [2, 3, 2, 2, 2, 3],
    count: 14,
  },
  {
    // feature_request
    texts: [
      "Wish there was a way to schedule recurring weekly orders, please add this.",
      "Would be nice to have a dark mode option in the app.",
      "Please add an option to leave delivery instructions for the driver.",
      "I want a way to save multiple payment methods, not just one card.",
      "Missing feature: can't reorder a past order with one tap.",
      "Please add a way to split payment between wallet and card.",
    ],
    ratings: [3, 4, 3, 3, 3, 4],
    count: 12,
  },
  {
    // praise
    texts: [
      "Love this app, groceries delivered so fast every time!",
      "Great app, awesome experience, highly recommend to everyone.",
      "Excellent service, super quick delivery and fresh produce.",
      "Best grocery app I've used, very useful and easy to use.",
      "Amazing how fast the delivery is, impressed every time.",
      "Fantastic app, the UI is clean and ordering is super simple.",
      "Superb experience overall, will keep using this for sure.",
      "Very happy with the quality and speed, five stars from me.",
    ],
    ratings: [5, 5, 5, 5, 5, 4, 5, 5],
    count: 36,
  },
  {
    // other / misc filler
    texts: [
      "It's okay, does the job most of the time.",
      "Decent app overall, nothing special but works fine.",
      "Average experience, some good days and some bad days.",
      "Not bad, but not great either.",
    ],
    ratings: [3, 3, 3, 3],
    count: 14,
  },
];

const WEEKS_OF_HISTORY = 10;

/**
 * Deterministically generates a synthetic review dataset for the demo flow.
 * Same output every time (no Math.random) so screenshots/tests stay stable.
 * Dates are spread backward from `now` across WEEKS_OF_HISTORY weeks.
 */
export function generateDemoReviews(now: Date = new Date()): Review[] {
  const reviews: Review[] = [];
  let counter = 1;
  let globalIndex = 0;

  for (const template of TEMPLATES) {
    for (let i = 0; i < template.count; i++) {
      const text = template.texts[i % template.texts.length];
      const rating = template.ratings[i % template.ratings.length];

      const weeksAgo = globalIndex % WEEKS_OF_HISTORY;
      const dayOffset = (globalIndex * 3) % 7;
      const date = new Date(now);
      date.setUTCDate(date.getUTCDate() - weeksAgo * 7 - dayOffset);

      reviews.push({
        id: `r${counter++}`,
        text,
        rating,
        date: date.toISOString(),
        userName: "Demo user",
      });
      globalIndex++;
    }
  }

  return reviews;
}
