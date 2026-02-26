import { motion } from "framer-motion";

export function About() {
  return (
    <section className="py-32 px-4 md:px-8 max-w-7xl mx-auto w-full" id="about">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        {/* Left: Image Collage */}
        <div className="relative h-[600px] md:h-[700px] w-full group">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 overflow-hidden shadow-2xl border border-white/5"
          >
            <img 
              src="/images/about-feast.png" 
              alt="Middle Eastern Feast" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.2] group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30, y: 30 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 overflow-hidden border-[12px] border-background hidden md:block z-10 shadow-2xl"
          >
            <img 
              src="/images/kebab.png" 
              alt="Fresh Kebab" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Right: Brand Story */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col justify-center lg:pl-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-16 bg-primary"></div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">The Story</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-serif text-white mb-10 leading-[1.1]">
            Experience the <br/>
            <span className="text-gradient-gold italic">sizzling sensation</span>
          </h2>

          <div className="space-y-6 text-foreground/70 font-light text-lg leading-relaxed">
            <p>
              Welcome to Kebabil, where we blend the rich, aromatic heritage of Middle Eastern cuisine with the bold, vibrant flavors of India.
            </p>
            <p>
              Our modern restaurant is built around the primal energy of the charcoal grill. We believe in premium ingredients, authentic recipes, and an approachable dining experience that brings people together around the fire.
            </p>
            <div className="pt-8 mt-8 border-t border-white/10">
              <p className="text-white font-serif text-2xl italic tracking-wide text-primary/90">
                "We don't just cook food; we craft memories around the fire."
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
