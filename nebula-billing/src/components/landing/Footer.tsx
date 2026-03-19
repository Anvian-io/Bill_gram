import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const links = {
  Product: ["Features", "Pricing", "Download", "Changelog"],
  Support: ["Help Center", "Contact Us", "FAQs", "Community"],
  Legal: ["Privacy Policy", "Terms of Service", "Refund Policy"],
};

export const Footer = () => {
  return (
    <footer className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">BillFlow</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              The modern billing & business management solution for Indian wholesalers.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-display font-bold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2024 BillFlow. All rights reserved.</p>
          <div className="flex gap-4">
            {["Twitter", "LinkedIn", "YouTube"].map((social) => (
              <motion.a
                key={social}
                href="#"
                whileHover={{ scale: 1.1 }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {social}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
