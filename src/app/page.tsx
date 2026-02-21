import Link from "next/link";
import { ArrowRight, ShieldAlert, HeartPulse, SmartphoneNfc } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center py-6 px-8 max-w-7xl mx-auto border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <HeartPulse size={28} />
          </div>
          <span className="text-xl font-bold tracking-tight">RescueChip</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
          <Link href="/activate" className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm">
            Activate Chip
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative py-32 flex flex-col items-center text-center px-4 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8 animate-[fade-in-up_0.5s_ease-out_forwards]">
            <ShieldAlert size={16} />
            <span>Crucial medical data, precisely when it's needed.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent" style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}>
            The smartest addition to your motorcycle helmet.
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mb-12" style={{ animation: "fade-in-up 0.5s ease-out 0.2s both" }}>
            RescueChip uses NFC technology to instantly share your vital medical profile and emergency contacts with first responders in the event of an accident.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center" style={{ animation: "fade-in-up 0.5s ease-out 0.3s both" }}>
            <Link href="/activate" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-bold hover:scale-105 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
              Activate Your Chip <ArrowRight size={20} />
            </Link>
            <Link href="#demo" className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-full text-lg font-bold hover:bg-secondary/80 transition-all">
              See a Demo
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="features" className="w-full max-w-7xl mx-auto py-24 px-8 border-t border-border/50">
          <div className="grid md:grid-cols-3 gap-12">

            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6 relative">
                <SmartphoneNfc size={32} />
                <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Instant NFC Access</h3>
              <p className="text-muted-foreground leading-relaxed">
                First responders simply tap their smartphone against the RescueChip sticker on your helmet. No app required.
              </p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6">
                <HeartPulse size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Vital Medical Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Instantly displays your blood type, allergies, current medications, specific conditions, and organ donor status.
              </p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Emergency Contacts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Keeps your loved ones' contact information readily available, ensuring they can be reached immediately.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <HeartPulse size={20} className="text-primary/50" />
            <span>&copy; {new Date().getFullYear()} RescueChip. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
