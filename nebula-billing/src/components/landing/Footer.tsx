import { motion } from 'framer-motion';
import { Boxes } from 'lucide-react';

const groups = {
  Product: [
    { label: 'Modules', href: '#features' },
    { label: 'Preview', href: '#preview' },
    { label: 'Workflow', href: '#workflow' },
  ],
  Explore: [
    { label: 'Proof', href: '#proof' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ],
  Action: [
    { label: 'Download', href: '#download' },
    { label: 'Top of page', href: '#hero' },
  ],
};

export const Footer = () => {
  return (
    <footer className="border-t border-border/70 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  Bill Gram
                </p>
                <p className="text-xs text-muted-foreground">
                  Desktop operations platform
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-text-secondary">
              A product website for a business app should explain the real
              workflow clearly. This footer keeps the message simple: billing,
              stock, GST, master data, and backups in one place.
            </p>
          </div>

          {Object.entries(groups).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-foreground">
                {title}
              </h4>
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    whileHover={{ x: 4 }}
                    className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-8 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>
            Copyright {new Date().getFullYear()} Bill Gram. Built for clearer
            business operations.
          </p>
          <p>Billing / Inventory / Reports / GST / Backup</p>
        </div>
      </div>
    </footer>
  );
};
