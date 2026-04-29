"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu, X } from "lucide-react";

const LANDING_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Barlow+Condensed:wght@400;600;700&display=swap');

  :root {
    --red: #E8231A;
    --red-dim: #9B1510;
    --white: #F4F0EB;
    --off-white: #C8C0B4;
    --dark: #0A0A08;
    --dark-mid: #111110;
    --dark-card: #161614;
    --border: rgba(244,240,235,0.08);
    --border-hover: rgba(232,35,26,0.4);
  }
  .landing-root * { margin:0; padding:0; box-sizing:border-box; }
  .landing-root { background:var(--dark); color:var(--white); font-family:'Barlow',sans-serif; font-weight:300; overflow-x:hidden; }
  html { scroll-behavior:smooth; }

  /* NAV */
  .rc-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; justify-content:space-between; align-items:center; padding:20px 40px; background:linear-gradient(to bottom,rgba(10,10,8,.95),transparent); transition:background .3s; }
  .rc-nav.scrolled { background:rgba(10,10,8,.98); }
  .nav-logo { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; color:var(--white); text-decoration:none; }
  .nav-logo span { color:var(--red); }
  .nav-links { display:flex; gap:28px; list-style:none; align-items:center; }
  .nav-links a { color:var(--off-white); text-decoration:none; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; font-weight:500; transition:color .2s; }
  .nav-links a:hover { color:var(--white); }
  .nav-cta { background:var(--red) !important; color:var(--white) !important; padding:10px 22px !important; border-radius:2px; font-weight:600 !important; transition:background .2s !important; }
  .nav-cta:hover { background:#c41c14 !important; }
  .nav-login { color:var(--off-white) !important; border:1px solid rgba(244,240,235,0.2); padding:8px 18px !important; border-radius:2px; transition:all .2s !important; }
  .nav-login:hover { border-color:rgba(244,240,235,0.5) !important; color:var(--white) !important; }

  /* HERO */
  .hero { position:relative; min-height:100vh; display:flex; flex-direction:column; justify-content:flex-end; padding:0 60px 80px; overflow:hidden; }
  .hero-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; filter:grayscale(20%) brightness(.5) contrast(1.1); transform:scale(1.03); animation:slow-zoom 14s ease-in-out infinite alternate; }
  @keyframes slow-zoom { from{transform:scale(1.03)} to{transform:scale(1.0)} }
  .hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(10,10,8,.97) 0%,rgba(10,10,8,.45) 45%,rgba(10,10,8,.15) 75%,rgba(10,10,8,.4) 100%),linear-gradient(to right,rgba(10,10,8,.4) 0%,transparent 60%); }
  .hero-grain { position:absolute; inset:0; pointer-events:none; opacity:.5; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E"); }
  .hero-accent { position:absolute; top:0; right:120px; width:2px; height:100%; background:linear-gradient(to bottom,transparent 0%,var(--red) 30%,var(--red-dim) 70%,transparent 100%); opacity:.4; }
  .hero-content { position:relative; z-index:2; max-width:720px; animation:hero-in 1s ease both; }
  @keyframes hero-in { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  .hero-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(232,35,26,.12); border:1px solid rgba(232,35,26,.3); border-radius:2px; padding:6px 14px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#ff6b63; margin-bottom:28px; font-weight:500; }
  .hero-badge::before { content:''; width:6px; height:6px; background:var(--red); border-radius:50%; animation:pulse-dot 2s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
  .hero h1 { font-family:'Bebas Neue',sans-serif; font-size:clamp(64px,9vw,110px); line-height:.92; letter-spacing:2px; margin-bottom:24px; }
  .hero-sub { font-size:16px; line-height:1.7; color:var(--off-white); max-width:480px; margin-bottom:40px; font-weight:300; }
  .hero-actions { display:flex; flex-direction:column; align-items:flex-start; gap:16px; }
  
  .btn-primary { display:inline-block; background:var(--red); color:var(--white); text-decoration:none; padding:16px 36px; font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:600; letter-spacing:2px; text-transform:uppercase; border-radius:2px; transition:background .2s,transform .15s; }
  .btn-primary:hover { background:#c41c14; transform:translateY(-1px); }

  .hero-secondary-btns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .btn-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    background: transparent;
    border: 1px solid rgba(244,240,235,0.2);
    border-radius: 2px;
    color: var(--off-white);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    text-decoration: none;
    transition: border-color 0.2s, color 0.2s;
  }
  .btn-secondary:hover {
    border-color: var(--red);
    color: var(--white);
  }

  /* SECTION LABELS */
  .section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--red); font-weight:600; margin-bottom:16px; }
  .section-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,5vw,60px); line-height:1; letter-spacing:1px; margin-bottom:16px; }

  /* PRECIOS */
  .pricing { padding:120px 60px; background:var(--dark-mid); }
  .pricing-inner { max-width:1000px; margin:0 auto; }
  .pricing-header { text-align:center; margin-bottom:60px; padding: 0 16px; }
  .pricing-header p { font-size:16px; color:var(--off-white); max-width:440px; margin:16px auto 0; line-height:1.6; }
  
  .pricing-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 0 16px 8px;
    scrollbar-width: none;
  }
  .pricing-scroll::-webkit-scrollbar { display: none; }
  
  @media(min-width: 901px) {
    .pricing-scroll {
      justify-content: center;
      overflow-x: visible;
    }
  }

  .price-card {
    flex: 0 0 260px;
    scroll-snap-align: center;
    background: var(--dark-card);
    border-radius: 10px;
    padding: 24px 20px;
    border: 1px solid var(--border);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition:background .2s;
  }
  .price-card:hover { background:#1a1a18; }
  .price-card.featured { background:var(--dark); }
  .price-card.featured::before { content:'MÁS POPULAR'; position:absolute; top:0; left:50%; transform:translateX(-50%); background:var(--red); color:white; font-size:9px; letter-spacing:2.5px; font-weight:700; padding:4px 14px; font-family:'Barlow Condensed',sans-serif; border-radius: 0 0 4px 4px; }
  
  .price-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; margin-bottom:8px; }
  .price-desc { font-size:13px; color:var(--off-white); margin-bottom:24px; line-height:1.5; min-height:16px; }
  .price-amount { display:flex; align-items:baseline; gap:4px; margin-bottom:8px; }
  .price-currency { font-size:18px; color:var(--off-white); font-weight:300; }
  .price-value { font-family:'Bebas Neue',sans-serif; font-size:52px; line-height:1; }
  .price-period { font-size:12px; color:var(--off-white); letter-spacing:1px; text-transform:uppercase; margin-bottom:12px; }
  .price-sub { font-size: 13px; color: var(--off-white); min-height: 20px; margin-bottom: 24px; }
  
  .btn-price { display:block; width: 100%; text-align:center; text-decoration:none; padding:13px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; transition:all .2s; margin-top: auto; cursor:pointer; }
  .btn-price-outline { border:1px solid var(--border); color:var(--off-white); background:transparent; }
  .btn-price-outline:hover { border-color:var(--red); color:var(--red); }
  .btn-price-solid { background:var(--red); color:var(--white); border:1px solid var(--red); }
  .btn-price-solid:hover { background:#c41c14; }

  .scroll-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 12px;
  }
  .scroll-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(244,240,235,0.15);
  }
  .scroll-dot.active { background: var(--red); }
  @media(min-width: 901px) {
    .scroll-dots { display: none; }
  }

  /* SOCIAL PROOF */
  .trust { padding:80px 60px; background:var(--dark); border-top:1px solid var(--border); text-align: center; }
  .trust-inner { max-width:800px; margin:0 auto; display:flex; flex-direction: column; align-items:center; }
  .trust-badges { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin: 32px 0 40px; width: 100%; }
  .trust-badge { display:flex; align-items:center; justify-content: center; gap:8px; background:var(--dark-card); border:1px solid var(--border); padding:20px 16px; border-radius:4px; font-size:13px; letter-spacing:1px; text-transform:uppercase; font-weight:500; transition:border-color .2s; }
  .trust-badge:hover { border-color:rgba(232,35,26,.3); }
  .trust-cta { width: 100%; max-width: 400px; }

  /* CÓMO FUNCIONA */
  .how-it-works { padding:100px 60px; background:var(--dark-mid); }
  .hiw-inner { max-width:900px; margin:0 auto; }
  .hiw-header { margin-bottom: 60px; text-align: center; }
  .hiw-steps { display:flex; flex-direction:column; }
  .hiw-step { display:flex; gap:32px; padding: 40px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
  .hiw-step:last-child { border-bottom: none; }
  .hiw-icon { width:64px; height:64px; border:1px solid var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--dark-card); font-size:24px; flex-shrink: 0; }
  .hiw-content h3 { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:700; letter-spacing:.5px; margin-bottom:12px; text-transform:uppercase; }
  .hiw-content p { font-size:16px; line-height:1.65; color:var(--off-white); }

  /* BENEFICIOS */
  .benefits { padding:100px 60px; background:var(--dark); border-top:1px solid var(--border); }
  .benefits-inner { max-width:900px; margin:0 auto; }
  .benefits-header { margin-bottom: 60px; text-align: center; }
  .benefits-list { display:flex; flex-direction:column; }
  .benefit-item { padding: 40px 0; border-bottom: 1px solid var(--border); }
  .benefit-item:last-child { border-bottom: none; }
  .benefit-item h3 { font-size:20px; font-weight:700; color:var(--white); margin-bottom:12px; }
  .benefit-item p { font-size:16px; line-height:1.65; color:var(--off-white); max-width: 800px; }

  /* AGENCIAS */
  .agency-pricing { padding:120px 60px; background:var(--dark-mid); border-top:1px solid var(--border); }
  .agency-inner { max-width:1000px; margin:0 auto; }
  .agency-header { text-align:center; margin-bottom:56px; }
  .agency-header p { font-size:16px; color:var(--off-white); max-width:520px; margin:14px auto 0; line-height:1.65; }
  .agency-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:var(--border); border:1px solid var(--border); border-radius:4px; overflow:hidden; }
  .agency-card { background:var(--dark-card); padding:40px 32px; position:relative; transition:background .2s; }
  .agency-card:hover { background:#1a1a18; }
  .agency-card.featured { background:var(--dark-mid); }
  .agency-card.dark-card-agency { background:#0d0d0b; }
  .agency-badge { position:absolute; top:0; left:50%; transform:translateX(-50%); background:var(--red); color:white; font-size:9px; letter-spacing:2.5px; font-weight:700; padding:4px 14px; font-family:'Barlow Condensed',sans-serif; }
  .agency-tier { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:2px; margin-bottom:6px; }
  .agency-divider { height:1px; background:var(--border); margin:20px 0; }
  .agency-features { list-style:none; display:flex; flex-direction:column; gap:10px; margin-bottom:32px; }
  .agency-features li { font-size:13px; color:var(--off-white); display:flex; align-items:center; gap:8px; }
  .agency-features li::before { content:'—'; color:var(--red); font-size:11px; flex-shrink:0; }
  .btn-agency-outline { display:block; text-align:center; text-decoration:none; padding:13px; border-radius:2px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; border:1px solid var(--border); color:var(--off-white); transition:all .2s; }
  .btn-agency-outline:hover { border-color:var(--red); color:var(--red); }
  .btn-agency-solid { display:block; text-align:center; text-decoration:none; padding:13px; border-radius:2px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; background:var(--red); color:var(--white); border:1px solid var(--red); transition:all .2s; }
  .btn-agency-solid:hover { background:#c41c14; }

  /* CTA FINAL */
  .cta-final { position:relative; min-height:70vh; display:flex; align-items:center; overflow:hidden; }
  .cta-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center 35%; filter:grayscale(20%) brightness(.38) contrast(1.15); }
  .cta-overlay { position:absolute; inset:0; background:linear-gradient(to right,rgba(10,10,8,.97) 0%,rgba(10,10,8,.7) 55%,rgba(10,10,8,.35) 100%); }
  .cta-content { position:relative; z-index:2; padding:80px 60px; max-width:680px; }
  .cta-content .section-title { font-size:clamp(40px,6vw,80px); margin:16px 0 24px; }
  .cta-content p { font-size:16px; color:var(--off-white); max-width:440px; margin:0 0 48px; line-height:1.7; }
  .cta-actions { display:flex; gap:16px; flex-wrap:wrap; align-items:center; }

  /* FOOTER */
  .rc-footer { padding:40px 60px; background:var(--dark-mid); border-top:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
  .footer-links { display:flex; gap:24px; list-style:none; }
  .footer-links a { color:var(--off-white); text-decoration:none; font-size:12px; letter-spacing:1px; text-transform:uppercase; transition:color .2s; }
  .footer-links a:hover { color:var(--white); }
  .rc-footer small { color:rgba(200,192,180,.4); font-size:11px; letter-spacing:.5px; }

  /* STICKY CTA MOBILE */
  .sticky-cta-mobile {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--red);
    padding: 10px 16px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.4);
    display: none;
  }
  .sticky-cta-btn {
    display: block;
    width: 100%;
    background: white;
    color: var(--red);
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    text-align: center;
    text-decoration: none;
    padding: 13px;
    border: none;
    border-radius: 4px;
  }
  @media(max-width: 768px) {
    .sticky-cta-mobile { display: block; }
  }

  /* MOBILE */
  @media(max-width:900px){
    .rc-nav{padding:16px 20px;} .nav-links{display:none;}
    .hamburger { display:flex !important; }
    .hero{padding:0 24px 80px;min-height:100svh;} .hero-accent{display:none;}
    .pricing,.trust,.how-it-works,.benefits{padding:80px 24px;}
    .agency-pricing{padding:80px 24px;} .agency-cards{grid-template-columns:1fr;}
    .cta-content{padding:60px 24px;}
    .rc-footer{padding:32px 24px;flex-direction:column;text-align:center;}
  }

  /* MOBILE MENU OVERLAY */
  .hamburger { display: none; background: none; border: none; color: var(--white); cursor: pointer; padding: 4px; z-index: 1001; }
  .mobile-menu-overlay { position: fixed; inset: 0; background: rgba(10,10,8,0.98); z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
  .mobile-menu-overlay.open { opacity: 1; pointer-events: auto; }
  .mobile-menu-links { list-style: none; display: flex; flex-direction: column; gap: 32px; text-align: center; }
  .mobile-menu-links a { color: var(--white); text-decoration: none; font-size: 20px; font-weight: 600; font-family: 'Barlow Condensed', sans-serif; letter-spacing: 2px; text-transform: uppercase; }
  .mobile-menu-links .nav-cta { margin-top: 16px; font-size: 16px !important; }

  /* ════════════════════════════════════════
     MÓVIL — 480px
  ════════════════════════════════════════ */
  @media(max-width:480px){
    /* NAV */
    .rc-nav{ padding:12px 16px; gap:6px; }
    .nav-logo{ font-size:17px; letter-spacing:-0.3px; }
    .nav-links{ display:none; }
    .nav-cta{ padding:8px 12px !important; font-size:12px !important; letter-spacing:0 !important; white-space:nowrap; }
    .nav-login{ font-size:12px !important; padding:8px 10px !important; display:none; }

    /* HERO */
    .hero{ padding: 80px 16px 60px; min-height:100svh; justify-content:flex-end; }
    .hero-badge{ font-size:10px; padding:6px 10px; letter-spacing:1px; margin-bottom:16px; }
    .hero h1{ font-size:52px; line-height:.9; letter-spacing:1px; margin-bottom:20px; word-break:keep-all; }
    .hero-sub{ font-size:13px; line-height:1.6; max-width:100%; margin-bottom:28px; }
    .hero-actions{ flex-direction:column; gap:10px; align-items:stretch; width:100%; }
    .btn-primary{ width:100%; text-align:center; justify-content:center; font-size:13px; padding:15px 16px; }
    
    .hero-secondary-btns { grid-template-columns: 1fr; width: 100%; }

    /* PRICING */
    .pricing{ padding:52px 0; }
    .pricing-header h2{ font-size:28px; margin-bottom:8px; }
    .pricing-header p{ font-size:13px; }

    /* TRUST */
    .trust{ padding:52px 16px; }
    .trust-badges{ grid-template-columns:1fr; gap:12px; }

    /* HOW IT WORKS */
    .how-it-works { padding:52px 16px; }
    .hiw-step { flex-direction: column; gap: 16px; padding: 32px 0; }

    /* BENEFITS */
    .benefits { padding:52px 16px; }

    /* AGENCIAS */
    .agency-pricing{ padding:52px 16px; }
    .agency-header h2{ font-size:26px; }
    .agency-cards{ grid-template-columns:1fr; gap:10px; }
    .agency-card{ padding:20px 16px; }
    .agency-tier{ font-size:18px; }

    /* CTA FINAL */
    .cta-final{ min-height: 400px; }
    .cta-content{ padding:40px 16px; text-align:center; }
    .cta-content h2{ font-size:36px; line-height:.95; }
    .cta-content p{ font-size:13px; }
    .cta-content .btn-primary{ width:100%; justify-content:center; margin-top:24px; }

    /* FOOTER */
    .rc-footer{ padding:20px 16px 88px; flex-direction:column; text-align:center; font-size:12px; gap:10px; }
  }

  /* ════════════════════════════════════════
     MÓVIL PEQUEÑO — 375px
  ════════════════════════════════════════ */
  @media(max-width:375px){
    .hero h1{ font-size:44px; }
    .nav-cta{ padding:7px 10px !important; font-size:11px !important; }
    .price-amount{ font-size:44px; }
    .trust-badges{ grid-template-columns:1fr; }
  }
`;

export default function Home() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [session, setSession] = useState<{ user?: { email?: string } } | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBuyNow = async (paquete: string) => {
    if (loadingPlan) return;
    setLoadingPlan(paquete);
    
    // Track InitiateCheckout
    if (typeof window !== 'undefined' && (window as any).fbq) {
      const prices: Record<string, number> = { individual: 349, pareja: 549, familiar: 949 };
      (window as any).fbq('track', 'InitiateCheckout', {
        value: prices[paquete] || 349,
        currency: 'MXN',
      });
    }

    // Capturar UTM
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source') || 'direct';
    const utm_medium = urlParams.get('utm_medium') || 'none';
    const utm_campaign = urlParams.get('utm_campaign') || 'none';

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paquete, utm_source, utm_medium, utm_campaign }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Error al procesar");
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      alert("Error: " + msg);
      setLoadingPlan(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    // Nav scroll effect
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);

    // Fade-in scroll
    const fader = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }, i * 60);
          fader.unobserve(e.target);
        }
      });
    }, { threshold: 0.07 });

    document
      .querySelectorAll(".price-card, .trust-badge, .hiw-step, .benefit-item, .agency-card")
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
        (el as HTMLElement).style.transform = "translateY(16px)";
        (el as HTMLElement).style.transition = "opacity .5s ease, transform .5s ease";
        fader.observe(el);
      });

    // Force play on videos
    const forcePlay = (v: HTMLVideoElement) => {
      v.muted = true;
      v.load();
      const attempt = () => v.play().catch(() => { });
      attempt();
      v.addEventListener("canplay", attempt, { once: true });
      v.addEventListener("loadeddata", attempt, { once: true });
    };
    const playAllVideos = () => {
      document.querySelectorAll<HTMLVideoElement>("video").forEach(forcePlay);
    };
    playAllVideos();
    [300, 800, 1500, 3000].forEach(ms => setTimeout(playAllVideos, ms));

    // CTA video speed
    document.querySelectorAll<HTMLVideoElement>(".cta-video").forEach((v) => {
      v.addEventListener("loadedmetadata", () => { v.playbackRate = 1.6; });
      if (v.readyState >= 1) v.playbackRate = 1.6;
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
      fader.disconnect();
    };
  }, []);

  return (
    <div className="landing-root">
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      {/* NAV */}
      <nav className={`rc-nav${navScrolled ? " scrolled" : ""}`}>
        <Link href="/" className="nav-logo">RESCUE<span>CHIP</span></Link>
        <ul className="nav-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><a href="#comunidad">Comunidad</a></li>
          <li><a href="#agencias">Agencias</a></li>
          {session ? (
            <li><Link href="/dashboard" className="nav-cta">Mi perfil médico</Link></li>
          ) : (
            <li><Link href="/activate" className="nav-cta">Activar mi chip</Link></li>
          )}
          {!session && (
            <li><Link href="/login" className="nav-login">Iniciar sesión</Link></li>
          )}
        </ul>
        <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir menú">
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-links">
          <li><a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo funciona</a></li>
          <li><a href="#precios" onClick={() => setMobileMenuOpen(false)}>Precios</a></li>
          <li><a href="#comunidad" onClick={() => setMobileMenuOpen(false)}>Comunidad</a></li>
          <li><a href="#agencias" onClick={() => setMobileMenuOpen(false)}>Agencias</a></li>
          {session ? (
            <li><Link href="/dashboard" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Mi perfil médico</Link></li>
          ) : (
            <li><Link href="/activate" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Activar mi chip</Link></li>
          )}
          {!session && (
            <li><Link href="/login" style={{ marginTop: '16px', fontSize: '14px', color: 'var(--off-white)', textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>Iniciar sesión</Link></li>
          )}
        </ul>
      </div>

      {/* HERO */}
      <section className="hero">
        <iframe
          src="https://www.youtube.com/embed/Fxe5OhX0Ra0?autoplay=1&mute=1&loop=1&playlist=Fxe5OhX0Ra0&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
          allow="autoplay; fullscreen"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh',
            minWidth: '177.78vh',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            pointerEvents: 'none',
          }}
        />
        <div className="hero-overlay" />
        <div className="hero-grain" />
        <div className="hero-accent" />
        <div className="hero-content">
          <div className="hero-badge">Alineado con NOM-034-SSA3-2013 · Identificación Médica</div>
          <h1>Mantén informada a tu familia si algo te pasa.</h1>
          <p className="hero-sub">Un chip NFC y un Código QR en tu casco que permite a los paramédicos o testigos acceder a tu perfil médico y alertar a tu familia con tu ubicación exacta. Sin app. Sin registro previo. En segundos. Además de una tarjeta médica para tu cartera.</p>
          <div className="hero-actions">
            <a href="#precios" className="btn-primary">Protege tu rodada — $349</a>
            <div className="hero-secondary-btns">
              <a href="/profile/RSC-DEMO" target="_blank" className="btn-secondary">
                🩺 Lo que el paramédico ve
              </a>
              <a href="/emergencia/demo" target="_blank" className="btn-secondary">
                👨‍👩‍👧 Lo que tu familia ve
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section className="pricing" id="precios">
        <div className="pricing-inner">
          <div className="pricing-header">
            <div className="section-label">Elige tu protección</div>
            <h2 className="section-title">Envío gratis a todo México</h2>
            <p>Un solo pago. Sin suscripción. Tu perfil activo de por vida.</p>
          </div>
          <div className="pricing-scroll">
            <div className="price-card">
              <div className="price-name">INDIVIDUAL</div>
              <div className="price-desc">1 kit</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">349</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-sub">&nbsp;</div>
              <button onClick={() => handleBuyNow("individual")} className="btn-price btn-price-outline">
                {loadingPlan === "individual" ? "Procesando..." : "PROTECCIÓN INDIVIDUAL"}
              </button>
            </div>
            <div className="price-card featured">
              <div className="price-name">PAREJA</div>
              <div className="price-desc">2 kits</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">549</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-sub">$274 por persona</div>
              <button onClick={() => handleBuyNow("pareja")} className="btn-price btn-price-solid">
                {loadingPlan === "pareja" ? "Procesando..." : "PROTEGER A MI PAREJA TAMBIÉN"}
              </button>
            </div>
            <div className="price-card">
              <div className="price-name">FAMILIAR</div>
              <div className="price-desc">Hasta 4 kits</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">949</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-sub">Desde $237 por persona</div>
              <button onClick={() => handleBuyNow("familiar")} className="btn-price btn-price-outline">
                {loadingPlan === "familiar" ? "Procesando..." : "PROTEGER A MI FAMILIA"}
              </button>
            </div>
          </div>
          <div className="scroll-dots">
            <div className="scroll-dot active" />
            <div className="scroll-dot" />
            <div className="scroll-dot" />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="trust" id="comunidad">
        <div className="trust-inner">
          <div className="section-label">Comunidad RescueChip</div>
          <h2 className="section-title">Riders que ya eligieron protegerse</h2>
          <div className="trust-badges">
            <div className="trust-badge">🏥 Alineado con NOM-034-SSA3-2013</div>
            <div className="trust-badge">🔒 Datos cifrados</div>
            <div className="trust-badge">🇲🇽 Hecho en México</div>
            <div className="trust-badge">⚡ Sin suscripción</div>
          </div>
          <div className="trust-cta">
            <a href="#precios" className="btn-primary" style={{ display: 'block' }}>TRANQUILIDAD PARA MI FAMILIA — $349</a>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="how-it-works" id="como-funciona">
        <div className="hiw-inner">
          <div className="hiw-header">
            <div className="section-label">Así de simple</div>
            <h2 className="section-title">¿Cómo funciona?</h2>
          </div>
          <div className="hiw-steps">
            <div className="hiw-step">
              <div className="hiw-icon">📱</div>
              <div className="hiw-content">
                <h3>Instala en tu casco</h3>
                <p>Paso 1. Pega el chip NFC. Paso 2. Pega el sticker QR encima del Chip para cubrirlo por completo. Paso 3. Pega sticker "Retira en caso de emergencia" encima del QR para evitar escaneos "curiosos". Resistente al agua, al calor y a las mentiras de tu ex.</p>
              </div>
            </div>
            <div className="hiw-step">
              <div className="hiw-icon">🩺</div>
              <div className="hiw-content">
                <h3>Alguien escanea</h3>
                <p>Un testigo o paramédico acerca su celular al chip o escanea el QR. Sin app, sin registro. Tu perfil médico aparece en segundos.</p>
              </div>
            </div>
            <div className="hiw-step">
              <div className="hiw-icon">📞</div>
              <div className="hiw-content">
                <h3>Tu familia recibe alerta</h3>
                <p>Tus contactos de emergencia reciben SMS y email automático con tu ubicación GPS exacta y un protocolo de acción.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="benefits">
        <div className="benefits-inner">
          <div className="benefits-header">
            <div className="section-label">Por qué RescueChip</div>
            <h2 className="section-title">Habla por ti cuando tú no puedes</h2>
          </div>
          <div className="benefits-list">
            <div className="benefit-item">
              <h3>Tu familia sabe dónde estás</h3>
              <p>Alertas SMS + email automáticos con tu ubicación GPS exacta al momento que un paramédico o testigo lo escanean. No necesitas hacer nada, RescueChip habla por ti.</p>
            </div>
            <div className="benefit-item">
              <h3>Funciona sin app, sin registro previo</h3>
              <p>El chip NFC no necesita batería. Funciona con cualquier celular Android o iPhone 7+. Siempre listo para avisarle a tu familia.</p>
            </div>
            <div className="benefit-item">
              <h3>Tus datos, tu control</h3>
              <p>Edita tu perfil médico, contactos de emergencia y datos personales desde tu dashboard en cualquier momento. Tú decides qué información compartes.</p>
            </div>
            <div className="benefit-item">
              <h3>Un pago. Para siempre.</h3>
              <p>$349 MXN con envío incluido. Sin mensualidades. Sin suscripciones. Sin letra chica. Tu perfil activo de por vida.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AGENCIAS */}
      <section className="agency-pricing" id="agencias">
        <div className="agency-inner">
          <div className="agency-header">
            <div className="section-label">Para agencias y empresas</div>
            <h2 className="section-title">Planes para Agencias de Motos<br />y Empresas</h2>
            <p>Ofrece seguridad médica como valor agregado a tus clientes y mejora la experiencia de compra en tu negocio.</p>
          </div>
          <div className="agency-cards">
            <div className="agency-card">
              <div className="agency-tier">Starter</div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>Chips NFC programados con folios únicos RSC</li><li>Activación directa por el usuario final</li>
                <li>Perfil médico completo por chip</li><li>Alertas automáticas SMS + email al escanear</li><li>Soporte por WhatsApp durante la implementación</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Starter%20de%20RescueChip%20para%20agencias.%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-outline">Solicitar</a>
            </div>
            <div className="agency-card featured">
              <span className="agency-badge">Recomendado</span>
              <div className="agency-tier">Growth</div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>Chips NFC programados con folios únicos RSC</li><li>Todo lo del plan Starter</li>
                <li>Manual de ventas RescueChip para tu equipo (PDF)</li><li>Capacitación virtual para tu equipo de ventas</li><li>Soporte prioritario por WhatsApp</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Growth%20de%20RescueChip%20para%20agencias.%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-solid">Solicitar</a>
            </div>
            <div className="agency-card dark-card-agency">
              <div className="agency-tier">Premium</div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>Chips NFC programados con folios únicos RSC</li><li>Todo lo del plan Growth</li>
                <li>Sesión de onboarding presencial o virtual</li><li>Material físico de punto de venta incluido</li><li>Gerente de cuenta dedicado</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Premium%20de%20RescueChip%20para%20vol%C3%BAmenes%20corporativos.%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-outline">Contáctanos</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final">
        <iframe
          className="cta-video"
          src="https://www.youtube.com/embed/JIGHjUEMUSw?autoplay=1&mute=1&loop=1&playlist=JIGHjUEMUSw&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
          allow="autoplay; fullscreen"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100vh',
            minWidth: '177.78vh',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            pointerEvents: 'none',
          }}
        />
        <div className="cta-overlay" />
        <div className="cta-content">
          <div className="section-label">¿Listo para rodar protegido?</div>
          <h2 className="section-title">Tu chip llega en<br />5-7 días hábiles</h2>
          <p>Pago único. Sin suscripción. Envío incluido a todo México. Tu perfil activo desde el primer escaneo.</p>
          <div className="cta-actions">
            <a href="#precios" className="btn-primary">Proteger mis rodadas — $349</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="rc-footer">
        <Link href="/" className="nav-logo">RESCUE<span>CHIP</span></Link>
        <ul className="footer-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#precios">Precios</a></li>
          <li><Link href="/terminos">Términos y Condiciones</Link></li>
          <li><Link href="/privacidad">Aviso de Privacidad</Link></li>
        </ul>
        <small>© 2026 RescueChip. Todos los derechos reservados.</small>
      </footer>
      
      {/* STICKY CTA MOBILE */}
      <div className="sticky-cta-mobile">
        <button onClick={() => handleBuyNow("individual")} className="sticky-cta-btn">
          {loadingPlan === "individual" ? "Procesando..." : "Quiero estar protegido — $349"}
        </button>
      </div>
    </div>
  );
}
