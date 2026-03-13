import { Helmet } from 'react-helmet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is BountyBay?',
    answer:
      'BountyBay is a peer-to-peer marketplace where you post a reward (a bounty) for any item you are looking for. Our community of ID-verified hunters searches for your item, and you only pay the reward when they successfully find it.',
  },
  {
    question: 'What is the best way to find a discontinued or rare item?',
    answer:
      'Post a bounty on BountyBay describing the item in detail, including photos, brand, year, and any other specifics. Our hunters specialize in tracking down discontinued toys, rare collectibles, vintage fashion, classic cars, and more. The more detail you share, the faster they can find it.',
  },
  {
    question: 'How can I incentivize someone to find a rare item for me?',
    answer:
      'Set a bounty reward that reflects the rarity and urgency of your search. Higher rewards attract more experienced hunters. You can also add photos and detailed descriptions to make the search easier.',
  },
  {
    question: 'Is there a service that finds hard-to-find products?',
    answer:
      'Yes. BountyBay connects you with a community of hunters who specialize in finding hard-to-find, rare, and discontinued products. You post what you need, set a reward, and hunters do the searching for you.',
  },
  {
    question: 'Do I have to pay upfront?',
    answer:
      'No. Your card is saved securely when you post a bounty, but you are only charged when you accept a find from a hunter. If nobody finds your item, you pay nothing.',
  },
  {
    question: 'What kinds of items can I search for on BountyBay?',
    answer:
      'Anything. Popular categories include discontinued stuffed animals and blankets, rare collectibles and trading cards, vintage fashion and sneakers, classic cars and parts, lost media like deleted Reddit threads or YouTube videos, and much more.',
  },
];

export function HomeFAQ() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="py-10 lg:py-14 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
