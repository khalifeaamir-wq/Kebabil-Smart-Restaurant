import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import menuData from "@/data/menu.json";

export function MenuSection() {
  const [activeCategory, setActiveCategory] = useState(menuData[0].category);

  const activeItems = menuData.find(c => c.category === activeCategory)?.items || [];

  return (
    <section className="py-32 px-4 md:px-8 max-w-6xl mx-auto w-full" id="menu">
      <div className="text-center mb-20">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-primary font-medium tracking-widest uppercase text-sm">Culinary Journey</span>
          <div className="h-[1px] w-12 bg-primary"></div>
        </div>
        <h2 className="text-4xl md:text-6xl font-serif text-white mb-4">
          The <span className="text-gradient-gold">Menu</span>
        </h2>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-16 border-b border-white/10 pb-6">
        {menuData.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            className={`relative pb-4 text-sm uppercase tracking-widest transition-all duration-300 ${
              activeCategory === cat.category 
                ? "text-primary font-medium" 
                : "text-foreground/50 hover:text-white"
            }`}
          >
            {cat.category}
            {activeCategory === cat.category && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"
              />
            )}
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
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12"
          >
            {activeItems.map((item, i) => (
              <div 
                key={i} 
                className="group relative pb-8 border-b border-white/5 hover:border-primary/30 transition-all duration-500"
              >
                <div className="flex justify-between items-baseline mb-3 gap-4">
                  <h3 className="text-xl md:text-2xl font-serif text-white group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex-1 border-b border-dashed border-white/20 mx-2 opacity-30 group-hover:border-primary/50 transition-colors"></div>
                  <span className="text-xl font-serif text-primary shrink-0">
                    {item.price}
                  </span>
                </div>
                
                <p className="text-sm text-foreground/60 mb-5 font-light leading-relaxed max-w-[90%]">
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-auto">
                  {item.badge && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs tracking-wider uppercase rounded-none px-3">
                      {item.badge}
                    </Badge>
                  )}
                  {item.variants.length > 0 && (
                    <div className="flex gap-2">
                      {item.variants.map((v, j) => (
                        <span key={j} className="text-xs px-2 py-1 bg-white/5 text-white/50 uppercase tracking-wider">
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
