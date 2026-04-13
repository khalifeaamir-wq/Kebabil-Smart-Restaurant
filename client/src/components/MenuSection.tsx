import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchMenuFromSupabase, type MenuCategoryData } from "@/lib/menu";

export function MenuSection() {
  const { data: menuData = [], isLoading } = useQuery<MenuCategoryData[]>({
    queryKey: ["supabase-menu"],
    queryFn: fetchMenuFromSupabase,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const currentCategory = activeCategory || (menuData.length > 0 ? menuData[0].category : "");
  const activeItems = menuData.find(c => c.category === currentCategory)?.items || [];

  if (isLoading) {
    return (
      <section className="py-32 px-4 md:px-8 max-w-6xl mx-auto w-full" id="menu">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-serif text-white mb-4">
            The <span className="text-gradient-gold">Menu</span>
          </h2>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

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

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-16 border-b border-white/10 pb-6">
        {menuData.map((cat) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category)}
            data-testid={`menu-tab-${cat.categoryId}`}
            className={`relative pb-4 text-sm uppercase tracking-widest transition-all duration-300 ${
              currentCategory === cat.category 
                ? "text-primary font-medium" 
                : "text-foreground/50 hover:text-white"
            }`}
          >
            {cat.category}
            {currentCategory === cat.category && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 w-full h-[2px] bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12"
          >
            {activeItems.map((item) => (
              <div 
                key={item.id} 
                data-testid={`menu-item-${item.id}`}
                className="group relative pb-8 border-b border-white/5 hover:border-primary/30 transition-all duration-500"
              >
                <div className="flex justify-between items-baseline mb-3 gap-4">
                  <h3 className="text-xl md:text-2xl font-serif text-white group-hover:text-primary transition-colors" data-testid={`text-item-name-${item.id}`}>
                    {item.name}
                  </h3>
                  <div className="flex-1 border-b border-dashed border-white/20 mx-2 opacity-30 group-hover:border-primary/50 transition-colors"></div>
                  <span className="text-xl font-serif text-primary shrink-0" data-testid={`text-price-${item.id}`}>
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
