import { motion } from "framer-motion";

export function About() {
  return (
    <section className="py-24 md:py-32 px-4 md:px-8 max-w-7xl mx-auto w-full" id="about">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Image Collage */}
        <div className="relative h-[600px] w-full group">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          >
            <img 
              src="/images/about-feast.png" 
              alt="Middle Eastern Feast" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/60 to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30, y: 30 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute -bottom-8 -right-8 w-48 h-48 rounded-xl overflow-hidden border-8 border-background hidden md:block z-10"
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
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-primary"></div>
            <span className="text-primary font-medium tracking-widest uppercase text-sm">Our Story</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight">
            Experience the <span className="text-gradient-gold italic">sizzling sensation</span>
          </h2>

          <div className="space-y-6 text-foreground/80 font-light text-lg leading-relaxed">
            <p>
              Welcome to Kebabil, where we blend the rich, aromatic heritage of Middle Eastern cuisine with the bold, vibrant flavors of India.
            </p>
            <p>
              Our modern quick-service restaurant is built around the primal energy of the charcoal grill. We believe in premium ingredients, authentic recipes, and an approachable dining experience that brings people together.
            </p>
            <p className="text-white font-medium border-l-2 border-primary pl-4 py-2 mt-8">
              "We don't just cook food; we craft memories around the fire."
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
