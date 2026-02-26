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
    <section className="py-24 bg-card relative noise-bg" id="signature">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif text-white mb-4"
          >
            Chef's <span className="text-gradient-gold">Signatures</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 max-w-2xl mx-auto"
          >
            Our most celebrated dishes, perfected over the glowing coals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {signatures.map((dish, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="group relative rounded-2xl overflow-hidden bg-background border border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(198,156,109,0.15)] hover:-translate-y-2 cursor-pointer"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <img 
                  src={dish.img} 
                  alt={dish.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80" />
                
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground font-semibold border-none backdrop-blur-md shadow-lg">
                    MUST TRY
                  </Badge>
                </div>
              </div>

              <div className="p-6 relative z-10 -mt-10">
                <div className="glass-panel p-4 rounded-xl mb-4 text-center transform group-hover:-translate-y-2 transition-transform duration-500">
                  <span className="text-primary font-bold text-xl">{dish.price}</span>
                </div>
                <h3 className="text-2xl font-serif text-white mb-2 group-hover:text-primary transition-colors">{dish.name}</h3>
                <p className="text-foreground/70 text-sm font-light leading-relaxed">
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
