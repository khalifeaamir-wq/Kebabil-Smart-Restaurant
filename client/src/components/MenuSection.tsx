import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import menuData from "@/data/menu.json";

export function MenuSection() {
  const [activeCategory, setActiveCategory] = useState(menuData[0].category);

  const activeItems = menuData.find(c => c.category === activeCategory)?.items || [];

  return (
    <section className="py-24 px-4 md:px-8 max-w-6xl mx-auto w-full" id="menu">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">
          The <span className="text-gradient-gold">Menu</span>
        </h2>
        <div className="w-24 h-[2px] bg-primary mx-auto opacity-50"></div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex overflow-x-auto pb-6 mb-8 gap-4 no-scrollbar hide-scrollbar snap-x justify-start md:justify-center">
        {menuData.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 snap-center ${
              activeCategory === cat.category 
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(198,156,109,0.4)]" 
                : "bg-card text-foreground/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10"
          >
            {activeItems.map((item, i) => (
              <div 
                key={i} 
                className="group relative p-6 rounded-2xl bg-card/50 border border-white/5 hover:border-primary/30 transition-all hover:bg-card/80"
              >
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h3 className="text-xl font-serif text-white group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-lg font-semibold text-primary shrink-0">
                    {item.price}
                  </span>
                </div>
                
                <p className="text-sm text-foreground/70 mb-4 font-light leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  {item.badge && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 border-none">
                      {item.badge}
                    </Badge>
                  )}
                  {item.variants.length > 0 && (
                    <div className="flex gap-2">
                      {item.variants.map((v, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/60 border border-white/10">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
