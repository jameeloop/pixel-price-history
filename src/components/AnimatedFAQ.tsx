import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DecryptedText from '@/components/DecryptedText';

const AnimatedFAQ: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleValueChange = (value: string) => {
    setOpenItem(value);
  };

  return (
    <Accordion type="single" collapsible className="w-full" onValueChange={handleValueChange}>
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left">
          💰 How does the pricing work?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Each upload costs more than the previous one! The price increases by 1 cent with every upload, creating a sense of scarcity and urgency."
              delay={openItem === "item-1" ? 0 : 0}
              speed={25}
            />
            <div className="bg-primary/10 p-3 rounded-lg">
              <DecryptedText 
                text="📈 Price Formula:"
                delay={openItem === "item-1" ? 500 : 0}
                speed={30}
                className="text-sm font-medium"
              />
              <DecryptedText 
                text="$1.00 + (Number of Previous Uploads × $0.01)"
                delay={openItem === "item-1" ? 800 : 0}
                speed={20}
                className="text-sm"
              />
            </div>
            <DecryptedText 
              text="This means the first upload costs $1.00, the second costs $1.01, the third costs $1.02, and so on!"
              delay={openItem === "item-1" ? 1200 : 0}
              speed={25}
              className="text-sm text-muted-foreground"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left">
          🖼️ What happens to my photos?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Your photos are stored securely and displayed in our gallery for everyone to see! Here's what happens:"
              delay={openItem === "item-2" ? 0 : 0}
              speed={25}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="✅ Secure Storage: Your images are stored safely in our cloud database"
                  delay={openItem === "item-2" ? 300 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🎨 Public Gallery: They appear in the experiment gallery for all visitors"
                  delay={openItem === "item-2" ? 500 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📊 Pricing History: Your upload becomes part of the permanent pricing history"
                  delay={openItem === "item-2" ? 700 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔗 Shareable Links: You get a unique link to share your upload"
                  delay={openItem === "item-2" ? 900 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📱 QR Code: Generate a QR code to easily share your contribution"
                  delay={openItem === "item-2" ? 1100 : 0}
                  speed={20}
                />
              </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left">
          🗑️ Can I delete my uploads?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Currently, uploads cannot be deleted to maintain the integrity of the pricing experiment. Here's why:"
              delay={openItem === "item-3" ? 0 : 0}
              speed={25}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🔒 Data Integrity: Deleting uploads would break the pricing sequence"
                  delay={openItem === "item-3" ? 300 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📈 Accurate History: The experiment needs a complete, unmodified record"
                  delay={openItem === "item-3" ? 500 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔬 Research Value: Each upload is valuable data for the psychological study"
                  delay={openItem === "item-3" ? 700 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⚖️ Fairness: Prevents manipulation of the pricing system"
                  delay={openItem === "item-3" ? 900 : 0}
                  speed={20}
                />
              </li>
            </ul>
            <DecryptedText 
              text="Think carefully before uploading - your contribution is permanent!"
              delay={openItem === "item-3" ? 1200 : 0}
              speed={25}
              className="text-sm text-muted-foreground"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left">
          🧪 Is this a real experiment?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Yes! This is a legitimate psychological experiment studying human behavior. Here's what we're researching:"
              delay={openItem === "item-4" ? 0 : 0}
              speed={25}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🎯 Scarcity Effect: How do people respond to increasing prices?"
                  delay={openItem === "item-4" ? 300 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⏰ Urgency Behavior: Does time pressure affect decision-making?"
                  delay={openItem === "item-4" ? 500 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="💰 Value Perception: How do people assign value to digital content?"
                  delay={openItem === "item-4" ? 700 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="👥 Social Influence: How do others' actions affect our choices?"
                  delay={openItem === "item-4" ? 900 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🧠 Cognitive Bias: What mental shortcuts do we use when making decisions?"
                  delay={openItem === "item-4" ? 1100 : 0}
                  speed={20}
                />
              </li>
            </ul>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="🔬 Your participation helps advance psychological research!"
                delay={openItem === "item-4" ? 1400 : 0}
                speed={30}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger className="text-left">
          🔒 Is my data safe?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Absolutely! We take your privacy and data security very seriously:"
              delay={openItem === "item-5" ? 0 : 0}
              speed={25}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🛡️ Encrypted Storage: All data is encrypted both in transit and at rest"
                  delay={openItem === "item-5" ? 300 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔐 Secure Payments: We use Stripe for all payment processing"
                  delay={openItem === "item-5" ? 500 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📧 Email Privacy: Your email is only used for upload identification"
                  delay={openItem === "item-5" ? 700 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🚫 No Personal Data: We don't collect names, addresses, or other personal info"
                  delay={openItem === "item-5" ? 900 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔍 Transparent Research: All data is used only for the stated research purposes"
                  delay={openItem === "item-5" ? 1100 : 0}
                  speed={20}
                />
              </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger className="text-left">
          🎁 What do I get for participating?
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Great question! Here's what you get for being part of this experiment:"
              delay={openItem === "item-6" ? 0 : 0}
              speed={25}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🏆 Permanent Record: Your upload becomes part of internet history"
                  delay={openItem === "item-6" ? 300 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔗 Shareable Content: Get a unique link and QR code to share"
                  delay={openItem === "item-6" ? 500 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📊 Pricing Impact: You directly influence the price for future uploaders"
                  delay={openItem === "item-6" ? 700 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🧠 Learning Experience: Understand psychological pricing dynamics"
                  delay={openItem === "item-6" ? 900 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🌟 Exclusive Access: Be part of a unique social experiment"
                  delay={openItem === "item-6" ? 1100 : 0}
                  speed={20}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📈 Real-time Updates: See how your upload affects the experiment"
                  delay={openItem === "item-6" ? 1300 : 0}
                  speed={20}
                />
              </li>
            </ul>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="💡 Plus, you're contributing to scientific research!"
                delay={openItem === "item-6" ? 1600 : 0}
                speed={30}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AnimatedFAQ;
