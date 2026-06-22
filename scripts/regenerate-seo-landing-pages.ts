import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LandingPageUpdate = {
  slug: string;
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  content: string;
  ctaText: string;
  ctaHref: string;
  seoTitle: string;
  seoDescription: string;
  faq: Array<{ question: string; answer: string }>;
};

function wrapSections(sections: string[]) {
  return sections.join("\n");
}

function platformContent(input: {
  platform: string;
  keyword: string;
  longtails: string[];
  intro: string;
  buyers: string[];
  process: string[];
  reasons: string[];
  fit: string[];
}) {
  return wrapSections([
    `<p>${input.intro}</p>`,
    `<p>This page is written for shoppers searching for <strong>${input.keyword}</strong>, along with related phrases such as <em>${input.longtails.join(", ")}</em>. Instead of piecing together marketplace rules, payment workarounds, parcel forwarding, and shipping estimates on different pages, you can manage the flow in one place with CNSnap.</p>`,
    `<h2>Why overseas buyers use a ${input.platform} agent</h2>`,
    `<p>Many ${input.platform} listings are designed for domestic Chinese checkout, domestic delivery, and Chinese-language seller communication. A ${input.platform} shopping agent helps international buyers move from product discovery to parcel export with fewer errors, clearer pricing, and less back-and-forth.</p>`,
    `<ul>${input.reasons.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    `<h2>What you can buy through our ${input.platform} purchasing service</h2>`,
    `<p>Most customers use this workflow for everyday consumer goods, trend-led products, accessories, hobby items, home products, and marketplace finds that are difficult to buy directly from outside China. If a listing is unclear, a DIY order request gives you a manual review path before payment.</p>`,
    `<ul>${input.buyers.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    `<h2>How the ${input.platform} order flow works</h2>`,
    `<p>The goal is to keep the process simple: confirm the listing, pay for the product, receive warehouse updates, and choose the final international route after packing and weighing. This separation between product payment and shipping payment makes it easier to compare routes without guessing early.</p>`,
    `<ol>${input.process.map((item) => `<li>${item}</li>`).join("")}</ol>`,
    `<h2>Who this page is best for</h2>`,
    `<p>If you are comparing <strong>how to buy from ${input.platform} internationally</strong>, looking for a <strong>${input.platform} agent with warehouse QC</strong>, or trying to understand <strong>${input.platform} parcel forwarding</strong>, this page is the right starting point. It is especially useful when you want one account for product search, order management, package handling, and final shipment checkout.</p>`,
    `<ul>${input.fit.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    `<h2>Before you start shopping</h2>`,
    `<p>Prepare the listing URL, product screenshots, variant details, and any questions about sizing, color, quantity, or seller notes. If the page is hard to parse or the seller information is inconsistent, use the DIY order route so our team can review it manually before you pay.</p>`
  ]);
}

function shippingContent(input: {
  country: string;
  keyword: string;
  longtails: string[];
  intro: string;
  concerns: string[];
  costFactors: string[];
  checklist: string[];
}) {
  return wrapSections([
    `<p>${input.intro}</p>`,
    `<p>This page targets buyers searching for <strong>${input.keyword}</strong> and related long-tail queries such as <em>${input.longtails.join(", ")}</em>. The goal is to give you a cleaner route-planning page before you reach the international shipping payment step.</p>`,
    `<h2>How shipping from China to ${input.country} usually works</h2>`,
    `<p>International parcel delivery depends on product category, route availability, billed weight, customs handling, and the delivery service used after the parcel lands. Because route rules change, the best decision is usually made after warehouse intake, when the parcel can be measured and weighed accurately.</p>`,
    `<ul>${input.concerns.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    `<h2>What affects shipping cost from China to ${input.country}</h2>`,
    `<p>Shoppers often search for a simple number, but the final answer depends on route policy. A lightweight parcel can still be billed by volume, while a dense parcel may price differently depending on speed, destination, and handling requirements. CNSnap separates product payment from international shipping payment so you can compare these factors at the right time.</p>`,
    `<ul>${input.costFactors.map((item) => `<li>${item}</li>`).join("")}</ul>`,
    `<h2>How to prepare before you pay international shipping</h2>`,
    `<p>Before confirming a route, check whether your destination supports the parcel category, whether any battery or sensitive-goods restrictions apply, and whether faster options are worth the extra cost. If customs or route fit is unclear, it is safer to confirm before payment than to fix the issue after dispatch.</p>`,
    `<ol>${input.checklist.map((item) => `<li>${item}</li>`).join("")}</ol>`,
    `<h2>When to use the shipping estimator</h2>`,
    `<p>Use the estimator when you want an early planning range for <strong>${input.keyword}</strong>, when you need to compare route types, or when you are building a shopping list and want to understand whether the final parcel economics still make sense after packing and export.</p>`
  ]);
}

const landingPages: LandingPageUpdate[] = [
  {
    slug: "taobao-agent",
    title: "Taobao Agent Service",
    heroTitle: "Taobao agent service for global buyers",
    heroSubtitle: "Buy from Taobao with one guided workflow for purchasing, warehouse QC, parcel consolidation, and international shipping.",
    content: platformContent({
      platform: "Taobao",
      keyword: "Taobao agent service",
      longtails: ["buy from Taobao internationally", "Taobao shopping agent", "Taobao agent with warehouse QC", "Taobao parcel forwarding"],
      intro: "CNSnap helps international buyers use a Taobao agent service without juggling separate tools for product links, order tracking, warehouse handling, and final shipping payment.",
      buyers: ["Fashion, accessories, home goods, gifts, collectible items, and seasonal marketplace products", "Product requests that need a shopping agent to confirm variants, bundles, or seller notes", "Mixed orders from multiple Taobao sellers that you want to consolidate before export"],
      process: ["Paste a Taobao product URL or submit a DIY request if the listing is unclear", "Confirm specifications, quantity, and pricing before payment", "Receive warehouse photos and item updates after parcel intake", "Combine parcels and choose the final international shipping route after weighing"],
      reasons: ["Overseas payment and delivery support is inconsistent across Taobao sellers", "Chinese-language seller communication can slow down issue resolution without local support", "Warehouse QC and parcel consolidation reduce mistakes before export"],
      fit: ["Buyers comparing Taobao vs direct shipping options", "Users who want a Taobao agent with parcel consolidation", "Shoppers who need help reviewing links, screenshots, or unclear listings before purchase"]
    }),
    ctaText: "Start shopping on Taobao",
    ctaHref: "/",
    seoTitle: "Taobao Agent Service for International Buyers",
    seoDescription: "Use CNSnap as your Taobao agent service for product purchase, warehouse QC, parcel consolidation, and international shipping.",
    faq: [
      {
        question: "Why use a Taobao agent service?",
        answer: "A Taobao agent service helps when sellers do not support overseas payment, international delivery, or clear communication for international buyers."
      },
      {
        question: "Can I consolidate Taobao orders before shipping?",
        answer: "Yes. Taobao orders can arrive at the warehouse first, be checked, and then be combined before final international shipping."
      }
    ]
  },
  {
    slug: "1688-agent",
    title: "1688 Agent Service",
    heroTitle: "1688 buying support for overseas buyers",
    heroSubtitle: "Use a 1688 agent workflow to handle supplier communication, MOQ questions, warehouse intake, and international dispatch.",
    content: platformContent({
      platform: "1688",
      keyword: "1688 agent service",
      longtails: ["buy from 1688 internationally", "1688 purchasing agent", "1688 agent for small orders", "1688 shipping agent"],
      intro: "CNSnap gives international buyers a practical 1688 agent service for sourcing from a wholesale-first marketplace that was not designed around overseas checkout.",
      buyers: ["Small-batch buyers who need help with MOQ clarification", "Users comparing 1688 suppliers before payment", "Customers who want warehouse QC before export on 1688 purchases"],
      process: ["Send the 1688 link or supplier request for manual confirmation", "Review MOQ, unit pricing, specifications, and packaging details", "Pay after the purchase terms are confirmed", "Receive warehouse updates and choose the final route after parcel intake"],
      reasons: ["1688 is supplier-oriented and often assumes domestic purchasing behavior", "MOQ, packaging, and production details may require more manual checking", "A purchasing agent reduces friction when you need communication support and consolidated logistics"],
      fit: ["Buyers searching for a 1688 agent for international orders", "Users who need help with supplier communication on 1688", "Shoppers combining multiple 1688 purchases into one export workflow"]
    }),
    ctaText: "Submit a 1688 request",
    ctaHref: "/diy-order",
    seoTitle: "1688 Agent Service for International Buyers",
    seoDescription: "Buy from 1688 with supplier support, MOQ clarification, warehouse QC, and international shipping through CNSnap.",
    faq: [
      {
        question: "Is 1688 suitable for smaller overseas buyers?",
        answer: "Yes, but supplier terms vary. A 1688 agent can help confirm MOQ, specifications, and whether the supplier fits a smaller order."
      },
      {
        question: "Why use an agent on 1688?",
        answer: "An agent helps bridge supplier communication, payment coordination, warehouse intake, and final parcel export."
      }
    ]
  },
  {
    slug: "tmall-agent",
    title: "Tmall Agent Service",
    heroTitle: "Tmall shopping agent from China",
    heroSubtitle: "Order from Tmall with purchasing support, warehouse QC, and a simpler international delivery workflow.",
    content: platformContent({
      platform: "Tmall",
      keyword: "Tmall agent service",
      longtails: ["buy from Tmall internationally", "Tmall shopping agent", "Tmall agent for overseas buyers", "Tmall forwarding service"],
      intro: "CNSnap helps shoppers use a Tmall agent service when they want access to branded storefronts, predictable order handling, and clearer warehouse-to-export logistics.",
      buyers: ["Buyers focused on official-brand storefronts and marketplace trust", "Customers ordering premium consumer goods, home products, fashion, and branded accessories", "Users who still want QC and parcel consolidation before export"],
      process: ["Paste the Tmall listing or submit a DIY request if the product details need manual review", "Confirm product options and seller notes before payment", "Track warehouse intake and item photos after arrival", "Pay the final shipping fee after the packed parcel is measured"],
      reasons: ["Tmall often attracts shoppers looking for official or branded storefronts", "International buyers still need payment support and export handling", "Warehouse QC adds confidence even when the seller looks more established"],
      fit: ["Users comparing Tmall and Taobao for brand-oriented purchases", "Buyers who want a Tmall shopping agent with QC", "Shoppers who need a single account for purchase, package handling, and final shipping"]
    }),
    ctaText: "Start shopping on Tmall",
    ctaHref: "/",
    seoTitle: "Tmall Agent Service for Overseas Orders",
    seoDescription: "Buy from Tmall with a shopping agent workflow that includes payment support, warehouse QC, and international shipping.",
    faq: [
      {
        question: "Is Tmall different from Taobao for overseas buyers?",
        answer: "Yes. Tmall often emphasizes branded or official storefronts, but overseas buyers still need payment support and international logistics handling."
      },
      {
        question: "Can I still use warehouse QC for Tmall orders?",
        answer: "Yes. Tmall parcels can arrive at the warehouse first, be checked, and be consolidated before export when appropriate."
      }
    ]
  },
  {
    slug: "weidian-agent",
    title: "Weidian Agent Service",
    heroTitle: "Weidian agent for cross-border buyers",
    heroSubtitle: "Use CNSnap to buy from Weidian with payment support, warehouse handling, and parcel export in one account.",
    content: platformContent({
      platform: "Weidian",
      keyword: "Weidian agent service",
      longtails: ["buy from Weidian internationally", "Weidian shopping agent", "Weidian warehouse QC", "Weidian parcel forwarding"],
      intro: "CNSnap makes it easier to use a Weidian agent service when direct overseas checkout is limited, seller communication is inconsistent, or you need warehouse handling before final shipping.",
      buyers: ["Shoppers buying trend-led items, niche sellers, and marketplace finds from Weidian", "Users who want product confirmation before payment", "Customers who need QC and consolidated parcel export after purchase"],
      process: ["Open a Weidian product link or submit a sourcing request if the listing needs review", "Confirm variants, pricing, and seller details before payment", "Follow parcel intake and warehouse updates after the domestic leg is complete", "Choose the final international route after weighing and packing"],
      reasons: ["Weidian checkout and seller workflows are not built around overseas buyers", "Agent support helps reduce communication and payment friction", "Warehouse QC is useful when listing quality varies between sellers"],
      fit: ["Users searching for a Weidian agent with warehouse support", "Buyers who need help purchasing from Weidian outside China", "Shoppers comparing Taobao and Weidian agent options"]
    }),
    ctaText: "Open Weidian order flow",
    ctaHref: "/",
    seoTitle: "Weidian Agent Service with Warehouse QC",
    seoDescription: "Use CNSnap as your Weidian agent service for product purchase, warehouse QC, and global parcel shipping.",
    faq: [
      {
        question: "Can I buy from Weidian outside China?",
        answer: "Yes. A Weidian agent service can handle payment, order coordination, warehouse intake, and final parcel export for international buyers."
      },
      {
        question: "Does Weidian support normal international checkout?",
        answer: "Not consistently. That is why many buyers use an agent workflow for payment support and shipping coordination."
      }
    ]
  },
  {
    slug: "xianyu-agent",
    title: "Xianyu Agent Service",
    heroTitle: "Xianyu buying agent from China",
    heroSubtitle: "Shop second-hand and hard-to-find Xianyu items with manual review, warehouse handling, and export planning.",
    content: platformContent({
      platform: "Xianyu",
      keyword: "Xianyu agent service",
      longtails: ["buy from Xianyu internationally", "Xianyu shopping agent", "Xianyu second-hand buying agent", "Xianyu export support"],
      intro: "CNSnap gives international buyers a practical Xianyu agent service for second-hand, limited, or seller-specific listings that need more manual review than standard marketplace orders.",
      buyers: ["Collectors and hobby buyers looking for rare or second-hand products", "Users who need a manual review path before paying for a one-off listing", "Shoppers who want warehouse handling even for non-standard Xianyu purchases"],
      process: ["Send the Xianyu link or screenshots for manual review", "Confirm condition, seller details, price, and risk before payment", "Track domestic arrival and warehouse updates after purchase", "Choose whether to consolidate or export separately after intake"],
      reasons: ["Xianyu listings can change quickly and often require more seller-specific verification", "Second-hand condition and authenticity concerns need closer review", "A buying agent helps reduce the risk of misunderstandings before payment"],
      fit: ["Users searching for a Xianyu buying agent for overseas delivery", "Collectors who need a second-hand China marketplace workflow", "Shoppers who prefer manual review before committing to niche listings"]
    }),
    ctaText: "Submit a Xianyu sourcing request",
    ctaHref: "/diy-order",
    seoTitle: "Xianyu Agent Service for Second-Hand China Goods",
    seoDescription: "Use CNSnap to buy from Xianyu with manual review, warehouse handling, and international shipping support.",
    faq: [
      {
        question: "Is Xianyu good for rare or second-hand products?",
        answer: "Yes, but many listings need closer seller and condition review. A Xianyu agent helps verify details before payment."
      },
      {
        question: "Does Xianyu require more manual review than other marketplaces?",
        answer: "Usually yes. One-off listings, used goods, and seller-specific details often need more manual confirmation."
      }
    ]
  },
  {
    slug: "germany",
    title: "Shipping from China to Germany",
    heroTitle: "Ship parcels from China to Germany with route clarity",
    heroSubtitle: "Plan Germany-bound parcel delivery with clearer cost factors, route fit, customs awareness, and final shipping decisions.",
    content: shippingContent({
      country: "Germany",
      keyword: "shipping from China to Germany",
      longtails: ["China parcel forwarding to Germany", "shipping cost from China to Germany", "China to Germany parcel delivery", "Germany shipping estimator for China parcels"],
      intro: "CNSnap helps buyers plan shipping from China to Germany by separating product payment from final international shipping payment, so route decisions happen after weighing and packing instead of guesswork.",
      concerns: ["Route availability depends on parcel type, size, and destination handling rules", "Delivery timing can change with export queues, customs processing, and local handoff", "Sensitive-goods restrictions may differ by route even for the same destination"],
      costFactors: ["Actual weight and volumetric weight", "Route speed and service level", "Special handling for sensitive or restricted goods"],
      checklist: ["Confirm whether the product category is eligible for the selected route", "Review parcel size and billed-weight impact after warehouse packing", "Compare timing and cost before paying the final shipping fee"]
    }),
    ctaText: "Estimate shipping to Germany",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to Germany",
    seoDescription: "Compare routes, parcel cost factors, and customs considerations for shipping from China to Germany.",
    faq: [
      {
        question: "How long does shipping from China to Germany take?",
        answer: "Transit time depends on route choice, export timing, customs handling, and the local last-mile carrier."
      },
      {
        question: "Can bulky parcels cost more than expected?",
        answer: "Yes. Large but light parcels may be billed by volumetric weight, which can increase the final shipping fee."
      }
    ]
  },
  {
    slug: "france",
    title: "Shipping from China to France",
    heroTitle: "China parcel shipping guide for France",
    heroSubtitle: "Review route options, customs-sensitive considerations, and parcel cost logic before dispatching to France.",
    content: shippingContent({
      country: "France",
      keyword: "shipping from China to France",
      longtails: ["China parcel forwarding to France", "shipping cost from China to France", "China to France delivery options", "France shipping estimate for China parcels"],
      intro: "CNSnap gives France-bound buyers a cleaner planning page for shipping from China to France, with the main variables explained before the final shipping payment step.",
      concerns: ["Route rules can vary by sensitivity, weight, and destination handling", "Customs outcomes depend on product category, declared information, and local thresholds", "Delivery time is affected by both export processing and the final handoff inside France"],
      costFactors: ["Chargeable weight after packing", "Selected shipping channel and service level", "Restrictions or handling requirements attached to the parcel contents"],
      checklist: ["Check route eligibility for the parcel category", "Use the packed parcel measurements instead of seller estimates", "Compare speed and total cost before confirming dispatch"]
    }),
    ctaText: "Estimate shipping to France",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to France",
    seoDescription: "Understand route options, billed-weight logic, and customs considerations for shipping from China to France.",
    faq: [
      {
        question: "Do all routes to France support the same product types?",
        answer: "No. Sensitive items and line rules can vary by shipping channel, so route checking is important before payment."
      },
      {
        question: "Why estimate before final checkout?",
        answer: "Estimating early helps you compare route fit, timing, and cost before you commit to the international shipping payment."
      }
    ]
  },
  {
    slug: "netherlands",
    title: "Shipping from China to the Netherlands",
    heroTitle: "Ship from China to the Netherlands with fewer surprises",
    heroSubtitle: "Understand route fit, billed-weight logic, and parcel restrictions before shipping to the Netherlands.",
    content: shippingContent({
      country: "the Netherlands",
      keyword: "shipping from China to the Netherlands",
      longtails: ["China parcel forwarding to the Netherlands", "shipping cost from China to the Netherlands", "Netherlands delivery from China", "China to Netherlands shipping estimate"],
      intro: "CNSnap helps buyers planning shipping from China to the Netherlands make route and cost decisions with better information after warehouse intake, instead of relying on incomplete seller-side estimates.",
      concerns: ["Parcel restrictions and route support may differ by product category", "Volumetric-weight billing can change the final cost for bulky items", "Customs-sensitive parcels should be reviewed before dispatch, not after"],
      costFactors: ["Billed weight after packing and measurement", "Route speed and line policy", "Special handling and restricted-goods requirements"],
      checklist: ["Confirm the product type is supported by the route you want", "Use warehouse packing data before paying the final fee", "Compare cost, timing, and route risk in one step"]
    }),
    ctaText: "Estimate shipping to the Netherlands",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to the Netherlands",
    seoDescription: "Plan shipping from China to the Netherlands with route guidance, billed-weight context, and customs awareness.",
    faq: [
      {
        question: "What affects shipping cost to the Netherlands?",
        answer: "Route type, chargeable weight, parcel dimensions, and any special handling requirements all influence the final cost."
      },
      {
        question: "Should I worry about customs paperwork?",
        answer: "Yes. Accurate parcel descriptions and value awareness matter for smooth cross-border handling."
      }
    ]
  },
  {
    slug: "poland",
    title: "Shipping from China to Poland",
    heroTitle: "China shipping options for Poland-bound parcels",
    heroSubtitle: "Check route availability, timing, parcel billing logic, and restrictions before dispatching to Poland.",
    content: shippingContent({
      country: "Poland",
      keyword: "shipping from China to Poland",
      longtails: ["China parcel forwarding to Poland", "shipping cost from China to Poland", "China to Poland delivery options", "Poland shipping estimate from China"],
      intro: "CNSnap helps Poland-bound buyers review shipping from China to Poland with the right cost and route context before final payment, especially when multiple channels are available.",
      concerns: ["Different routes can support different parcel categories", "Economy and faster air routes may behave very differently on timing and price", "Large consolidated parcels may still trigger billed-by-volume pricing"],
      costFactors: ["Actual and volumetric weight after warehouse packing", "Chosen route speed and handling level", "Restrictions related to parcel contents or product sensitivity"],
      checklist: ["Review product restrictions before you choose a route", "Check packed parcel dimensions after intake", "Compare route timing and final price before shipping payment"]
    }),
    ctaText: "Estimate shipping to Poland",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to Poland",
    seoDescription: "Compare route options, parcel billing factors, and restrictions for shipping from China to Poland.",
    faq: [
      {
        question: "Can I ship sensitive products to Poland?",
        answer: "It depends on the route and product type. Sensitive items should be reviewed against route rules before final payment."
      },
      {
        question: "Does parcel consolidation always lower cost?",
        answer: "Not always. Consolidation can improve efficiency, but large parcels may still be billed by volume depending on the route."
      }
    ]
  },
  {
    slug: "united-states",
    title: "Shipping from China to the United States",
    heroTitle: "Shipping from China to the United States",
    heroSubtitle: "Compare shipping routes, parcel cost drivers, and timing expectations before paying for United States delivery.",
    content: shippingContent({
      country: "the United States",
      keyword: "shipping from China to the United States",
      longtails: ["China parcel forwarding to USA", "shipping cost from China to the United States", "China to USA parcel delivery", "USA shipping estimate from China"],
      intro: "CNSnap helps buyers plan shipping from China to the United States with a clearer view of route selection, billed weight, parcel restrictions, and the final shipping payment step.",
      concerns: ["Route rules vary depending on parcel type and sensitivity", "Transit timing is affected by export queues, customs, and domestic handoff after arrival", "Bulky parcels can price differently from smaller, denser packages even when the actual weight looks manageable"],
      costFactors: ["Chargeable weight after the parcel is measured and packed", "Route speed, service level, and destination coverage", "Special handling for sensitive goods or restricted categories"],
      checklist: ["Use the estimator after you have realistic parcel dimensions", "Check whether the chosen route supports the product category", "Compare speed and final cost before you confirm dispatch"]
    }),
    ctaText: "Estimate shipping to the United States",
    ctaHref: "/estimation",
    seoTitle: "Shipping from China to the United States",
    seoDescription: "Compare parcel routes, billed-weight logic, and delivery expectations for shipping from China to the United States.",
    faq: [
      {
        question: "How do I estimate shipping from China to the United States?",
        answer: "Use the shipping estimator after warehouse intake, when the parcel has realistic packed dimensions and route options can be compared properly."
      },
      {
        question: "Why is volumetric weight important for USA shipments?",
        answer: "Large but light parcels can be billed by volume instead of physical weight, which can raise the final shipping fee."
      }
    ]
  },
  {
    slug: "demo",
    title: "Demo Campaign Landing Page",
    heroTitle: "Launch a campaign landing page inside SEO Center",
    heroSubtitle: "Publish a focused promo page with cleaner copy, direct CTAs, and a structure that can be edited like a normal HTML landing page.",
    content: wrapSections([
      "<p>This demo campaign page shows how CNSnap can publish promotion-led landing pages that behave more like editable long-form pages than fixed campaign blocks.</p>",
      "<p>It targets users searching for China shopping deals, shopping agent promotions, shipping discounts, and new-user bonus campaigns. The goal is to make campaign pages easier to edit, easier to localize, and easier to evolve without rebuilding hard-coded sections.</p>",
      "<h2>When to use a campaign landing page</h2>",
      "<p>Use this format when you want to promote seasonal offers, new-user incentives, recharge rewards, shipping discounts, or referral campaigns in a page that can be managed independently from product workflows.</p>",
      "<ul><li>New-user campaigns</li><li>Shipping discount promotions</li><li>Wallet recharge bonuses</li><li>Referral and affiliate pushes</li></ul>",
      "<h2>Why this format is easier to manage</h2>",
      "<p>The page body can now be edited in one HTML content flow, so campaign copy, offer details, usage instructions, and keyword-rich FAQs can be updated without relying on a rigid block layout.</p>",
      "<ul><li>Faster content changes</li><li>More flexible long-tail keyword coverage</li><li>Better alignment between hero messaging and body content</li></ul>",
      "<h2>Suggested next action</h2>",
      "<p>Use campaign pages to move visitors toward registration, product search, wallet recharge, or a specific service flow, depending on the promotion intent.</p>"
    ]),
    ctaText: "Register and start shopping",
    ctaHref: "/register",
    seoTitle: "SEO Campaign Landing Page Demo",
    seoDescription: "A demo campaign landing page with editable HTML content, direct CTAs, and SEO-friendly structure for promotional traffic.",
    faq: [
      {
        question: "Can campaign pages be published as editable HTML landing pages?",
        answer: "Yes. Campaign pages can now be managed with a main HTML content flow instead of relying only on fixed structural blocks."
      },
      {
        question: "Should a campaign page have a direct CTA?",
        answer: "Yes. A campaign landing page should always guide the visitor into a clear next action such as registration, shopping, recharge, or shipping estimation."
      }
    ]
  }
];

async function main() {
  const existingPages = await prisma.seoLandingPage.findMany({
    where: {
      slug: {
        in: landingPages.map((item) => item.slug)
      }
    },
    include: {
      descriptions: true
    }
  });

  for (const update of landingPages) {
    const page = existingPages.find((item) => item.slug === update.slug);
    if (!page) {
      console.warn(`Skipping missing landing page: ${update.slug}`);
      continue;
    }

    await prisma.seoLandingPage.update({
      where: { id: page.id },
      data: {
        title: update.title,
        heroTitle: update.heroTitle,
        heroSubtitle: update.heroSubtitle,
        content: update.content,
        sectionsJson: "[]",
        faqJson: JSON.stringify(update.faq),
        ctaText: update.ctaText,
        ctaHref: update.ctaHref,
        seoTitle: update.seoTitle,
        seoDescription: update.seoDescription
      }
    });

    await prisma.seoLandingPageDescription.updateMany({
      where: {
        landingPageId: page.id,
        languageCode: "en"
      },
      data: {
        heroTitle: update.heroTitle,
        heroSubtitle: update.heroSubtitle,
        content: update.content,
        sectionsJson: "[]",
        faqJson: JSON.stringify(update.faq),
        ctaText: update.ctaText,
        ctaHref: update.ctaHref,
        seoTitle: update.seoTitle,
        seoDescription: update.seoDescription,
        ogTitle: update.seoTitle,
        ogDescription: update.seoDescription,
        twitterTitle: update.seoTitle,
        twitterDescription: update.seoDescription,
        translationStatus: "published"
      }
    });

    console.log(`Updated ${update.slug}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
