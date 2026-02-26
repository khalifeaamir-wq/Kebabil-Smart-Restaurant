import { MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Contact() {
  return (
    <section className="py-24 bg-card relative noise-bg" id="contact">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
              Visit <span className="text-gradient-gold">Us</span>
            </h2>
            <p className="text-foreground/70 mb-10 text-lg font-light">
              Ready to experience the best kebabs in town? Drop by or order directly to your door.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Call Us</h4>
                  <p className="text-foreground/70">+91 866 966 7366</p>
                  <p className="text-foreground/70">+91 866 966 7566</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Opening Hours</h4>
                  <p className="text-foreground/70">Mon - Sun: 12:00 PM - 12:00 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Location</h4>
                  <p className="text-foreground/70 max-w-xs">Premium Food District, City Center. Find us near the main plaza.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-2 shadow-lg">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Order
              </Button>
              <Button variant="outline" className="h-14 px-8 rounded-full border-primary/50 text-primary hover:bg-primary/10">
                Get Directions
              </Button>
            </div>
          </div>

          <div className="h-[400px] lg:h-auto w-full rounded-2xl overflow-hidden border border-white/10 relative glass-panel">
            {/* Google Maps Placeholder */}
            <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center text-center p-6">
              <MapPin className="w-12 h-12 text-primary/50 mb-4" />
              <p className="text-white/50">Interactive Map Component</p>
              <p className="text-xs text-white/30 mt-2">Embed real Google Maps iframe here</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
