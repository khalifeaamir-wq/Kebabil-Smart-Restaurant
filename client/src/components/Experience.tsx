import { motion } from "framer-motion";

export function Experience() {
  return (
    <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed z-0 scale-110"
        style={{ backgroundImage: "url('/images/experience-fire.png')" }}
      />
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />

      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-serif text-white font-bold tracking-widest uppercase text-stroke"
          style={{ WebkitTextStroke: "1px rgba(198,156,109,0.5)" }}
        >
          Where Fire Meets Flavour
        </motion.h2>
      </div>
    </section>
  );
}
