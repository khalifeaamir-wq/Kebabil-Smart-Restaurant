import { motion } from "framer-motion";

export function Experience() {
  return (
    <section className="relative h-[70vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed z-0 scale-105"
        style={{ backgroundImage: "url('/images/experience-fire.png')" }}
      />
      <div className="absolute inset-0 bg-black/70 z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />

      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-[1px] h-24 bg-gradient-to-b from-transparent to-primary mb-8"
        />
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-serif text-white font-bold tracking-widest uppercase mb-8 leading-[1.1]"
        >
          Fire Meets <br/><span className="text-gradient-gold">Flavour</span>
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
          className="w-[1px] h-24 bg-gradient-to-t from-transparent to-primary mt-8"
        />
      </div>
    </section>
  );
}
