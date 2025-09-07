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
          How does the pricing experiment work? 🤔
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Each upload costs 1¢ more than the previous one, creating scarcity and urgency."
              delay={openItem === "item-1" ? 0 : 0}
              speed={15}
            />
            <div className="bg-primary/10 p-3 rounded-lg">
              <DecryptedText 
                text="📈 Formula: $1.00 + (Previous Uploads × $0.01)"
                delay={openItem === "item-1" ? 400 : 0}
                speed={12}
                className="text-sm font-medium"
              />
            </div>
            <DecryptedText 
              text="First upload: $1.00, second: $1.01, third: $1.02, and so on!"
              delay={openItem === "item-1" ? 700 : 0}
              speed={15}
              className="text-sm text-muted-foreground"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left">
          What happens after I upload a photo? 📤
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Your photos are stored securely and displayed publicly:"
              delay={openItem === "item-2" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="✅ Secure cloud storage"
                  delay={openItem === "item-2" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🎨 Public gallery display"
                  delay={openItem === "item-2" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📊 Permanent pricing history"
                  delay={openItem === "item-2" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔗 Unique shareable link"
                  delay={openItem === "item-2" ? 500 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📱 QR code generation"
                  delay={openItem === "item-2" ? 600 : 0}
                  speed={12}
                />
              </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left">
          Is my email address kept private? 🔒
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Yes! Your email is completely private and secure:"
              delay={openItem === "item-3" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🔐 Never displayed publicly"
                  delay={openItem === "item-3" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🛡️ Encrypted storage"
                  delay={openItem === "item-3" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📧 No spam or sharing"
                  delay={openItem === "item-3" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🎯 Only for payments & identification"
                  delay={openItem === "item-3" ? 500 : 0}
                  speed={12}
                />
              </li>
            </ul>
            <DecryptedText 
              text="Privacy first - we only collect what's necessary!"
              delay={openItem === "item-3" ? 700 : 0}
              speed={15}
              className="text-sm text-muted-foreground"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left">
          Can I upload multiple photos? 📸📸
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Yes! Upload as many as you want, but each costs more:"
              delay={openItem === "item-4" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="💰 Each upload increases price by 1¢"
                  delay={openItem === "item-4" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔄 Same email can upload multiple times"
                  delay={openItem === "item-4" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📈 Later uploads cost more"
                  delay={openItem === "item-4" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⚡ Real-time price updates"
                  delay={openItem === "item-4" ? 500 : 0}
                  speed={12}
                />
              </li>
            </ul>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="💡 Upload quickly for better prices!"
                delay={openItem === "item-4" ? 700 : 0}
                speed={12}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-5">
        <AccordionTrigger className="text-left">
          What's the psychology behind this experiment? 🧠
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Studies human behavior and decision-making:"
              delay={openItem === "item-5" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="💰 Scarcity psychology"
                  delay={openItem === "item-5" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⏰ FOMO and urgency effects"
                  delay={openItem === "item-5" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📈 Loss aversion behavior"
                  delay={openItem === "item-5" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="👥 Social proof influence"
                  delay={openItem === "item-5" ? 500 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🧠 Cognitive biases"
                  delay={openItem === "item-5" ? 600 : 0}
                  speed={12}
                />
              </li>
            </ul>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="🔬 Real psychological research data!"
                delay={openItem === "item-5" ? 800 : 0}
                speed={12}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-6">
        <AccordionTrigger className="text-left">
          Can I upload anything I want? 🎨
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="Almost! Most content is welcome with guidelines:"
              delay={openItem === "item-6" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="✅ Photos, artwork, memes, screenshots"
                  delay={openItem === "item-6" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="✅ Digital art and creative content"
                  delay={openItem === "item-6" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="✅ Fun and interesting images"
                  delay={openItem === "item-6" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🔄 PNG, JPG, GIF - cropped to square"
                  delay={openItem === "item-6" ? 500 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⚖️ Must own rights to the image"
                  delay={openItem === "item-6" ? 600 : 0}
                  speed={12}
                />
              </li>
            </ul>
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="🎨 Be creative - add to internet history!"
                delay={openItem === "item-6" ? 800 : 0}
                speed={12}
                className="text-sm font-medium"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-7">
        <AccordionTrigger className="text-left">
          Is NSFW content allowed? 🚫
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <DecryptedText 
              text="No, NSFW content is prohibited - keep it family-friendly:"
              delay={openItem === "item-7" ? 0 : 0}
              speed={15}
            />
            <ul className="space-y-2 text-sm">
              <li>
                <DecryptedText 
                  text="🚫 No adult or explicit content"
                  delay={openItem === "item-7" ? 200 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="👨‍👩‍👧‍👦 Family-friendly only"
                  delay={openItem === "item-7" ? 300 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="🏢 Workplace appropriate"
                  delay={openItem === "item-7" ? 400 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="⚡ Auto-moderation active"
                  delay={openItem === "item-7" ? 500 : 0}
                  speed={12}
                />
              </li>
              <li>
                <DecryptedText 
                  text="📝 Clean and respectful content"
                  delay={openItem === "item-7" ? 600 : 0}
                  speed={12}
                />
              </li>
            </ul>
            <div className="bg-red-500/10 p-3 rounded-lg">
              <DecryptedText 
                text="⚠️ Violations = removal without refund"
                delay={openItem === "item-7" ? 800 : 0}
                speed={12}
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
