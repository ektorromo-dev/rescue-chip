"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, HeartPulse, SmartphoneNfc, CheckCircle2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center py-6 px-8 max-w-7xl mx-auto border-b border-border/40 relative z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <HeartPulse size={28} />
          </div>
          <span className="text-xl font-bold tracking-tight">RescueChip</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="#caracteristicas" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Características</Link>
          <Link href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</Link>
          <Link href="/activate" className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm">
            Activar Chip
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background border-b border-border shadow-lg py-4 px-8 flex flex-col gap-4 md:hidden animate-[fade-in-up_0.2s_ease-out_forwards]">
            <Link href="#caracteristicas" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-border/50">Características</Link>
            <Link href="#como-funciona" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium py-2 border-b border-border/50">Cómo funciona</Link>
            <Link href="/activate" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold bg-primary text-primary-foreground px-5 py-3 rounded-xl text-center mt-2 shadow-md">
              Activar Chip
            </Link>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative py-24 md:py-32 flex flex-col items-center text-center px-4 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-[#6B7280] text-sm font-medium mb-8 animate-[fade-in-up_0.5s_ease-out_forwards]">
            <ShieldAlert size={16} className="text-[#ef4444]" />
            <span>Datos médicos cruciales, justo cuando se necesitan.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent" style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}>
            La adición más inteligente para tu casco de motocicleta.
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mb-12" style={{ animation: "fade-in-up 0.5s ease-out 0.2s both" }}>
            RescueChip utiliza tecnología NFC para compartir al instante tu perfil médico vital y contactos de emergencia con los paramédicos en caso de accidente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center" style={{ animation: "fade-in-up 0.5s ease-out 0.3s both" }}>
            <Link href="/activate" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-bold hover:scale-105 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
              Activa tu Chip <ArrowRight size={20} />
            </Link>
            <Link href="/profile/RSC-001" className="flex items-center justify-center gap-2 bg-transparent border-2 border-[#374151] text-[#374151] px-8 py-4 rounded-full text-lg font-bold hover:bg-[#374151]/10 transition-all">
              Ver una Demo
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="caracteristicas" className="w-full max-w-7xl mx-auto py-20 px-8 border-t border-border/50 scroll-mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Características Principales</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Diseñado para salvar vidas brindando información rápida y precisa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6 relative">
                <SmartphoneNfc size={32} />
                <div className="absolute inset-0 border border-primary/20 rounded-2xl animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Acceso NFC Instantáneo</h3>
              <p className="text-muted-foreground leading-relaxed">
                Los equipos de rescate solo necesitan acercar su celular al sticker RescueChip en tu casco. Sin aplicaciones intermedias ni tiempos de espera.
              </p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6">
                <HeartPulse size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Datos Médicos Vitales</h3>
              <p className="text-muted-foreground leading-relaxed">
                Muestra de forma inmediata tu tipo de sangre, alergias, medicamentos actuales, condiciones específicas y estado de donación de órganos.
              </p>
            </div>

            <div className="flex flex-col items-start text-left p-6 rounded-3xl bg-card border border-border/50 shadow-sm hover:border-primary/50 transition-colors">
              <div className="bg-primary/10 text-primary p-4 rounded-2xl mb-6">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Contactos de Emergencia</h3>
              <p className="text-muted-foreground leading-relaxed">
                Mantiene la información de contacto de tus seres queridos siempre disponible, asegurando que puedan ser localizados de inmediato.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="w-full max-w-7xl mx-auto py-24 px-8 border-t border-border/50 scroll-mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">¿Cómo funciona?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Estar protegido toma menos de 5 minutos. Sigue estos sencillos pasos para salvaguardar tu bienestar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center relative">
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[2px] bg-border -z-10" />

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Compra tu chip</h3>
              <p className="text-muted-foreground">
                Adquiere tu RescueChip en nuestra tienda o distribuidores autorizados. Recibirás un sticker NFC de alta resistencia.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Activa tu perfil médico</h3>
              <p className="text-muted-foreground">
                Escanea el chip o ingresa a nuestra plataforma para llenar tus datos médicos y registrar a tus contactos de emergencia.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Pégalo en tu casco</h3>
              <p className="text-muted-foreground">
                Adhiere el sticker en un lugar externo y visible de tu casco. ¡Listo! Estás protegido en cada rodada.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse size={20} className="text-primary/50" />
            <span>&copy; {new Date().getFullYear()} RescueChip. Todos los derechos reservados.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Aviso de Privacidad</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Términos de Servicio</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
