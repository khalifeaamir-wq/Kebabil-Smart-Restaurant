import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const signatures = [
  {
    name: "Arabic Shawarma",
    desc: "Authentic Middle Eastern spiced chicken, slow-roasted and thinly sliced.",
    img: "/images/shawarma.png",
    price: "₹249"
  },
  {
    name: "Peshawari Kebab",
    desc: "Tender morsels of meat marinated in rich cream, cashew paste, and mild spices.",
    img: "/images/kebab.png",
    price: "₹349"
  },
  {
    name: "Yemeni Mandi",
    desc: "Aromatic long-grain basmati rice slow-cooked with proprietary spices.",
    img: "/images/about-feast.png",
    price: "₹599"
  }
];

export function SignatureDishes() {
  return (
    <section className="py-32 bg-card relative noise-bg" id="signature">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">Masterpieces</span>
            <div className="h-[1px] w-12 bg-primary"></div>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-serif text-white mb-6"
          >
            Chef's <span className="text-gradient-gold">Signatures</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {signatures.map((dish, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2, duration: 0.8, ease: "easeOut" }}
              className="group relative bg-background border border-white/5 hover:border-primary/30 transition-all duration-700 cursor-pointer flex flex-col h-full"
            >
              <div className="relative h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700 z-10" />
                <img 
                  src={dish.img} 
                  alt={dish.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                <div className="absolute top-4 left-4 z-20">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs rounded-none px-4 py-1.5 shadow-lg border-none">
                    MUST TRY
                  </Badge>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif text-white group-hover:text-primary transition-colors">{dish.name}</h3>
                  <span className="text-primary font-serif text-xl">{dish.price}</span>
                </div>
                <p className="text-foreground/60 text-sm font-light leading-relaxed mt-auto">
                  {dish.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
