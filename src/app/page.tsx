"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CheckoutModal from "@/components/CheckoutModal";
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
  .hero h1 em { font-style:normal; color:var(--red); display:block; }
  .hero-sub { font-size:16px; line-height:1.7; color:var(--off-white); max-width:480px; margin-bottom:40px; font-weight:300; }
  .hero-actions { display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
  .btn-primary { display:inline-block; background:var(--red); color:var(--white); text-decoration:none; padding:16px 36px; font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:600; letter-spacing:2px; text-transform:uppercase; border-radius:2px; transition:background .2s,transform .15s; }
  .btn-primary:hover { background:#c41c14; transform:translateY(-1px); }
  .btn-ghost { display:inline-flex; align-items:center; gap:8px; color:var(--off-white); text-decoration:none; font-size:13px; letter-spacing:1px; text-transform:uppercase; font-weight:500; transition:color .2s; }
  .btn-ghost:hover { color:var(--white); }
  .hero-scroll { position:absolute; bottom:30px; left:50%; transform:translateX(-50%); z-index:2; display:flex; flex-direction:column; align-items:center; gap:6px; animation:hero-in 1s ease .4s both; }
  .scroll-line { width:1px; height:40px; background:linear-gradient(to bottom,var(--red),transparent); animation:scroll-pulse 2s ease-in-out infinite; }
  @keyframes scroll-pulse { 0%,100%{opacity:1;height:40px} 50%{opacity:.4;height:24px} }
  .scroll-text { font-size:9px; letter-spacing:3px; text-transform:uppercase; color:var(--off-white); writing-mode:vertical-lr; transform:rotate(180deg); }

  /* SECTION LABELS */
  .section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--red); font-weight:600; margin-bottom:16px; }
  .section-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,5vw,60px); line-height:1; letter-spacing:1px; margin-bottom:16px; }

  /* STATS */
  .stat-interrupt { background:var(--red); padding:32px 60px; display:flex; justify-content:space-between; align-items:center; gap:32px; flex-wrap:wrap; position:relative; overflow:hidden; }
  .stat-interrupt::after { content:'DATOS'; position:absolute; right:-10px; top:50%; transform:translateY(-50%); font-family:'Bebas Neue',sans-serif; font-size:140px; color:rgba(0,0,0,.07); letter-spacing:12px; white-space:nowrap; pointer-events:none; }
  .si-cell { text-align:center; position:relative; z-index:1; }
  .si-num { font-family:'Bebas Neue',sans-serif; font-size:46px; line-height:1; color:rgba(255,255,255,.95); }
  .si-cap { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,.65); margin-top:5px; max-width:160px; line-height:1.5; }
  .si-sep { width:1px; height:44px; background:rgba(255,255,255,.18); }

  /* NARRATIVE */
  .narrative { padding:120px 60px; background:var(--dark-mid); overflow:hidden; }
  .narrative-inner { max-width:1200px; margin:0 auto; }
  .narrative-header { max-width:560px; margin-bottom:80px; }
  .narrative-header p { font-size:17px; line-height:1.7; color:var(--off-white); }
  .steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:0; }
  .step { padding:40px; border-left:1px solid var(--border); position:relative; transition:border-color .3s; }
  .step:hover { border-color:var(--border-hover); }
  .step:hover .step-icon { background:rgba(232,35,26,.15); border-color:rgba(232,35,26,.4); }
  .step-num { font-family:'Bebas Neue',sans-serif; font-size:80px; color:rgba(244,240,235,.04); position:absolute; top:16px; right:20px; line-height:1; }
  .step-icon { width:48px; height:48px; border:1px solid var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:20px; background:var(--dark-card); transition:all .3s; font-size:20px; }
  .step h3 { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:700; letter-spacing:.5px; margin-bottom:10px; text-transform:uppercase; }
  .step p { font-size:14px; line-height:1.65; color:var(--off-white); }

  /* AWARENESS */
  .awareness { display:grid; grid-template-columns:1fr 1fr; min-height:80vh; }
  .aw-video-wrap { position:relative; overflow:hidden; min-height:500px; }
  .aw-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:grayscale(40%) brightness(.65) contrast(1.1); transition:transform 8s ease; }
  .aw-video-wrap:hover .aw-video { transform:scale(1.04); }
  .aw-overlay { position:absolute; inset:0; background:linear-gradient(to right,transparent 0%,rgba(10,10,8,.3) 100%); }
  .aw-tag { position:absolute; bottom:24px; left:24px; font-family:'Barlow Condensed',sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:rgba(244,240,235,.4); border:1px solid rgba(244,240,235,.15); padding:6px 12px; }
  .aw-content { background:var(--dark-mid); padding:80px 60px; display:flex; flex-direction:column; justify-content:center; }
  .aw-content h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(38px,4.5vw,58px); line-height:.94; margin-bottom:24px; }
  .aw-content h2 em { font-style:normal; color:var(--red); display:block; }
  .blockquote { border-left:2px solid var(--red); padding:14px 0 14px 24px; font-size:18px; line-height:1.5; font-style:italic; color:rgba(244,240,235,.8); margin-bottom:28px; max-width:420px; }
  .aw-content p { font-size:15px; line-height:1.8; color:var(--off-white); max-width:400px; margin-bottom:32px; }

  /* GRID */
  .pgrid-section { background:var(--dark); }
  .pgrid-header { padding:80px 60px 40px; max-width:600px; }
  .pgrid-header h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,5vw,60px); line-height:.94; margin-bottom:12px; }
  .pgrid-header p { font-size:15px; color:var(--off-white); line-height:1.75; }
  .pgrid { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:300px 300px; gap:3px; }
  .pgrid-cell { position:relative; overflow:hidden; cursor:pointer; }
  .pgrid-cell.tall { grid-row:span 2; }
  .pgrid-cell img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; filter:grayscale(40%) brightness(.7) contrast(1.1); transition:filter .5s,transform .7s; }
  .pgrid-cell:hover img { filter:grayscale(10%) brightness(.6) contrast(1.15); transform:scale(1.05); }
  .pgrid-cap { position:absolute; inset:0; background:linear-gradient(to top,rgba(10,10,8,.9) 0%,transparent 55%); display:flex; align-items:flex-end; padding:20px; opacity:0; transition:opacity .35s; }
  .pgrid-cell:hover .pgrid-cap { opacity:1; }
  .pgrid-cap span { font-family:'Barlow Condensed',sans-serif; font-size:12px; letter-spacing:2px; text-transform:uppercase; color:var(--off-white); }

  /* CHIP ANIMADO */
  .chip-showcase { padding:100px 60px; background:var(--dark); display:flex; align-items:center; justify-content:center; gap:100px; }
  .chip-container { position:relative; width:420px; height:auto; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .chip-container img { width:100%; height:auto; display:block; }
  .chip-ring { position:absolute; inset:0; border:1px solid rgba(232,35,26,.15); border-radius:50%; animation:ring-pulse 3s ease-in-out infinite; }
  .chip-ring:nth-child(2) { inset:-24px; border-color:rgba(232,35,26,.08); animation-delay:.5s; }
  .chip-ring:nth-child(3) { inset:-52px; border-color:rgba(232,35,26,.04); animation-delay:1s; }
  @keyframes ring-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.03);opacity:.6} }
  .chip-core { position:absolute; inset:30px; background:var(--dark-card); border-radius:50%; border:1px solid var(--border); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; }
  .chip-logo { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; }
  .chip-logo span { color:var(--red); }
  .chip-folio { font-size:10px; letter-spacing:2px; color:var(--off-white); font-family:'Barlow Condensed',sans-serif; }
  .chip-nfc { color:var(--red); font-size:20px; margin-top:2px; }
  .chip-info { max-width:480px; }
  .chip-info h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(36px,4.5vw,56px); line-height:.94; margin-bottom:20px; }
  .chip-info h2 em { font-style:normal; color:var(--red); }
  .chip-info p { font-size:15px; line-height:1.8; color:var(--off-white); margin-bottom:32px; }

  /* PRODUCT */
  .product { display:grid; grid-template-columns:1fr 1fr; min-height:60vh; }
  .product-media { position:relative; overflow:hidden; }
  .product-media img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; filter:brightness(.8) contrast(1.05); transition:transform 8s ease; }
  .product-media:hover img { transform:scale(1.04); }
  .product-media-overlay { position:absolute; inset:0; background:linear-gradient(to left,rgba(10,10,8,.3) 0%,transparent 60%); }
  .product-content { background:var(--dark-card); padding:80px 60px; display:flex; flex-direction:column; justify-content:center; }
  .product-content p { font-size:16px; line-height:1.75; color:var(--off-white); margin-bottom:32px; }
  .product-features { list-style:none; display:flex; flex-direction:column; gap:12px; margin-bottom:40px; }
  .product-features li { display:flex; align-items:flex-start; gap:12px; font-size:14px; color:var(--off-white); }
  .product-features li::before { content:''; width:16px; height:16px; min-width:16px; border-radius:50%; background:rgba(232,35,26,.15); border:1px solid rgba(232,35,26,.4); margin-top:1px; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8l2.5 2.5L12 5.5' stroke='%23E8231A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-size:contain; }

  /* PARAMÉDICO */
  .paramedic { position:relative; min-height:75vh; display:flex; align-items:center; overflow:hidden; }
  .paramedic-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; filter:grayscale(15%) brightness(.58) contrast(1.1); }
  .paramedic-overlay { position:absolute; inset:0; background:linear-gradient(to right,rgba(10,10,8,.97) 0%,rgba(10,10,8,.7) 55%,rgba(10,10,8,.25) 100%); }
  .paramedic-content { position:relative; z-index:2; padding:80px 60px; max-width:560px; }
  .paramedic-content h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(38px,5vw,64px); line-height:.93; margin-bottom:20px; }
  .paramedic-content h2 em { font-style:normal; color:var(--red); display:block; }
  .paramedic-content p { font-size:15px; line-height:1.8; color:var(--off-white); max-width:400px; margin-bottom:32px; }

  /* GALERÍA CASCO */
  .helmet-gallery { padding:80px 60px; background:var(--dark-mid); }
  .helmet-gallery-inner { max-width:1200px; margin:0 auto; }
  .helmet-gallery-inner h2 { font-family:'Bebas Neue',sans-serif; font-size:clamp(32px,4vw,52px); line-height:.94; margin-bottom:12px; }
  .helmet-gallery-inner > p { font-size:15px; color:var(--off-white); margin-bottom:48px; max-width:500px; }
  .helmet-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
  .helmet-cell { position:relative; overflow:hidden; aspect-ratio:3/4; }
  .helmet-cell img { width:100%; height:100%; object-fit:cover; object-position:center; filter:brightness(.85) contrast(1.05); transition:transform .6s,filter .4s; }
  .helmet-cell:hover img { transform:scale(1.05); filter:brightness(.95); }

  /* PRICING */
  .pricing { padding:120px 60px; background:var(--dark-mid); }
  .pricing-inner { max-width:1000px; margin:0 auto; }
  .pricing-header { text-align:center; margin-bottom:60px; }
  .pricing-header p { font-size:16px; color:var(--off-white); max-width:440px; margin:16px auto 0; line-height:1.6; }
  .pricing-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:var(--border); border:1px solid var(--border); border-radius:4px; overflow:hidden; }
  .price-card { background:var(--dark-card); padding:40px 32px; position:relative; transition:background .2s; }
  .price-card:hover { background:#1a1a18; }
  .price-card.featured { background:var(--dark); }
  .price-card.featured::before { content:'MÁS POPULAR'; position:absolute; top:0; left:50%; transform:translateX(-50%); background:var(--red); color:white; font-size:9px; letter-spacing:2.5px; font-weight:700; padding:4px 14px; font-family:'Barlow Condensed',sans-serif; }
  .price-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; margin-bottom:8px; }
  .price-desc { font-size:13px; color:var(--off-white); margin-bottom:24px; line-height:1.5; min-height:36px; }
  .price-amount { display:flex; align-items:baseline; gap:4px; margin-bottom:8px; }
  .price-currency { font-size:18px; color:var(--off-white); font-weight:300; }
  .price-value { font-family:'Bebas Neue',sans-serif; font-size:52px; line-height:1; }
  .price-period { font-size:12px; color:var(--off-white); letter-spacing:1px; text-transform:uppercase; margin-bottom:28px; }
  .price-divider { height:1px; background:var(--border); margin-bottom:24px; }
  .price-features { list-style:none; display:flex; flex-direction:column; gap:10px; margin-bottom:32px; }
  .price-features li { font-size:13px; color:var(--off-white); display:flex; align-items:center; gap:8px; }
  .price-features li::before { content:'—'; color:var(--red); font-size:11px; flex-shrink:0; }
  .btn-price { display:block; text-align:center; text-decoration:none; padding:13px; border-radius:2px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; transition:all .2s; }
  .btn-price-outline { border:1px solid var(--border); color:var(--off-white); }
  .btn-price-outline:hover { border-color:var(--red); color:var(--red); }
  .btn-price-solid { background:var(--red); color:var(--white); border:1px solid var(--red); }
  .btn-price-solid:hover { background:#c41c14; }

  /* AGENCIAS */
  .agency-pricing { padding:120px 60px; background:var(--dark); border-top:1px solid var(--border); }
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
  .agency-units { font-size:13px; color:var(--off-white); margin-bottom:22px; letter-spacing:.5px; }
  .agency-price-wrap { display:flex; align-items:baseline; gap:4px; margin-bottom:6px; }
  .agency-currency { font-size:18px; color:var(--off-white); }
  .agency-value { font-family:'Bebas Neue',sans-serif; font-size:48px; line-height:1; }
  .agency-curr-label { font-size:14px; color:var(--off-white); letter-spacing:1px; margin-left:4px; }
  .agency-negotiable { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; color:var(--white); display:block; margin-bottom:6px; }
  .agency-divider { height:1px; background:var(--border); margin:20px 0; }
  .agency-features { list-style:none; display:flex; flex-direction:column; gap:10px; margin-bottom:32px; }
  .agency-features li { font-size:13px; color:var(--off-white); display:flex; align-items:center; gap:8px; }
  .agency-features li::before { content:'—'; color:var(--red); font-size:11px; flex-shrink:0; }
  .btn-agency-outline { display:block; text-align:center; text-decoration:none; padding:13px; border-radius:2px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; border:1px solid var(--border); color:var(--off-white); transition:all .2s; }
  .btn-agency-outline:hover { border-color:var(--red); color:var(--red); }
  .btn-agency-solid { display:block; text-align:center; text-decoration:none; padding:13px; border-radius:2px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; background:var(--red); color:var(--white); border:1px solid var(--red); transition:all .2s; }
  .btn-agency-solid:hover { background:#c41c14; }

  /* TRUST */
  .trust { padding:80px 60px; background:var(--dark); border-top:1px solid var(--border); }
  .trust-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:100px; align-items:center; }
  .trust-content p { font-size:16px; line-height:1.75; color:var(--off-white); margin-bottom:36px; }
  .trust-badges { display:flex; gap:12px; flex-wrap:wrap; }
  .trust-badge { display:flex; align-items:center; gap:8px; background:var(--dark-card); border:1px solid var(--border); padding:10px 16px; border-radius:2px; font-size:12px; letter-spacing:1px; text-transform:uppercase; font-weight:500; transition:border-color .2s; }
  .trust-badge:hover { border-color:rgba(232,35,26,.3); }
  .testimonials { display:flex; flex-direction:column; gap:16px; }
  .testimonial { background:var(--dark-card); border:1px solid var(--border); border-radius:4px; padding:28px; transition:border-color .2s; }
  .testimonial:hover { border-color:rgba(232,35,26,.2); }
  .testimonial-text { font-size:15px; line-height:1.65; color:var(--off-white); margin-bottom:20px; font-style:italic; }
  .testimonial-author { display:flex; align-items:center; gap:12px; }
  .author-avatar { width:40px; height:40px; border-radius:50%; background:var(--red); display:flex; align-items:center; justify-content:center; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px; flex-shrink:0; }
  .author-info { display:flex; flex-direction:column; gap:2px; }
  .author-info strong { font-size:13px; font-weight:600; }
  .author-info span { font-size:12px; color:var(--off-white); }

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

  /* MOBILE */
  @media(max-width:900px){
    .rc-nav{padding:16px 20px;} .nav-links{display:none;}
    .hamburger { display:flex !important; }
    .hero{padding:0 24px 80px;min-height:100svh;} .hero-accent{display:none;}
    .stat-interrupt{flex-direction:column;padding:36px 24px;text-align:center;} .si-sep{display:none;}
    .narrative,.pricing,.trust{padding:80px 24px;}
    .awareness,.product{grid-template-columns:1fr;}
    .aw-content,.product-content{padding:48px 24px;}
    .pgrid-header,.helmet-gallery{padding:60px 24px;}
    .pgrid{grid-template-columns:1fr 1fr;grid-template-rows:auto;}
    .pgrid-cell.tall{grid-row:span 1;}
    .steps{grid-template-columns:1fr;}
    .step{border-left:none;border-bottom:1px solid var(--border);}
    .agency-pricing{padding:80px 24px;} .agency-cards{grid-template-columns:1fr;}
    .trust-inner{grid-template-columns:1fr;gap:48px;}
    .helmet-grid{grid-template-columns:1fr 1fr;}
    .chip-showcase{flex-direction:column;padding:40px 24px 80px 24px;gap:24px;text-align:center;}
    .paramedic-content,.cta-content{padding:60px 24px;}
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
     Pantallas de celular estándar
  ════════════════════════════════════════ */
  @media(max-width:480px){

    /* NAV */
    .rc-nav{ padding:12px 16px; gap:6px; }
    .nav-logo{ font-size:17px; letter-spacing:-0.3px; }
    .nav-links{ display:none; }
    .nav-cta{
      padding:8px 12px !important;
      font-size:12px !important;
      letter-spacing:0 !important;
      white-space:nowrap;
    }
    .nav-login{
      font-size:12px !important;
      padding:8px 10px !important;
      display:none;
    }

    /* HERO */
    .hero{
      padding: 80px 16px 60px;
      min-height:100svh;
      justify-content:flex-end;
    }
    .hero-badge{
      font-size:10px;
      padding:6px 10px;
      letter-spacing:1px;
      margin-bottom:16px;
    }
    .hero h1{
      font-size:52px;
      line-height:.9;
      letter-spacing:1px;
      margin-bottom:20px;
      word-break:keep-all;
    }
    .hero-sub{
      font-size:13px;
      line-height:1.6;
      max-width:100%;
      margin-bottom:28px;
    }
    .hero-ctas{
      flex-direction:column;
      gap:10px;
      align-items:stretch;
      width:100%;
    }
    .btn-primary{
      width:100%;
      text-align:center;
      justify-content:center;
      font-size:13px;
      padding:15px 16px;
    }
    .btn-ghost{ font-size:13px; justify-content:center; }
    .hero-scroll{ display:none; }

    /* STATS */
    .stat-interrupt{
      flex-direction:column;
      padding:28px 16px;
      gap:0;
    }
    .si-stat{ padding:16px 0; width:100%; }
    .si-val{ font-size:40px; }
    .si-label{ font-size:11px; }
    .si-sep{ display:none; }
    .si-cell{ border-bottom:1px solid var(--border); }
    .si-cell:last-child{ border-bottom:none; }

    /* NARRATIVE */
    .narrative{ padding:52px 16px; }
    .narrative-lead{ font-size:26px; line-height:1.2; }
    .steps{ grid-template-columns:1fr; gap:0; }
    .step{ padding:20px 16px; border-left:none; border-bottom:1px solid var(--border); }
    .step:last-child{ border-bottom:none; }
    .step-num{ font-size:44px; }
    .step h3{ font-size:17px; }
    .step p{ font-size:14px; }

    /* AWARENESS */
    .awareness{ grid-template-columns:1fr; }
    .aw-video-wrap{ height:260px; }
    .aw-video{ width:100%; height:100%; object-fit:cover; }
    .aw-content{ padding:36px 16px; }
    .aw-content h2{ font-size:28px; line-height:1.1; }
    .aw-quote{ font-size:14px; }

    /* GRID CONSCIOUSNESS */
    .pgrid-header{ padding:40px 16px 20px; }
    .pgrid-header h2{ font-size:28px; }
    .pgrid{ grid-template-columns:1fr; }
    .pgrid-cell{ min-height:160px; }
    .pgrid-cell.tall{ grid-row:span 1; min-height:200px; }

    /* CHIP */
    .chip-showcase{
      flex-direction:column;
      padding:24px 16px 64px 16px;
      gap:16px;
      text-align:center;
      align-items:center;
    }
    .chip-info h2{ font-size:28px; }
    .chip-specs{
      grid-template-columns:1fr 1fr;
      gap:12px;
      text-align:center;
    }
    .chip-spec-val{ font-size:22px; }

    /* PRODUCT */
    .product{ grid-template-columns:1fr; }
    .product-img{ height:260px; }
    .product-content{ padding:36px 16px; }
    .product-content h2{ font-size:26px; }

    /* GALERÍA */
    .helmet-gallery{ padding:40px 16px; }
    .helmet-grid{ grid-template-columns:1fr 1fr; gap:8px; }
    .helmet-cell{ height:140px; }

    /* PRICING — columna única */
    .pricing{ padding:52px 16px; }
    .pricing-header h2{ font-size:28px; margin-bottom:8px; }
    .pricing-header p{ font-size:13px; }
    .pricing-grid{
      grid-template-columns:1fr !important;
      gap:12px;
      margin-top:32px;
    }
    .pricing-cards { 
      grid-template-columns: 1fr; 
      gap: 12px; 
      border: none; 
      background: transparent; 
      border-radius: 0; 
    }
    .price-card{
      padding:24px 20px;
      border-radius:8px;
    }
    .price-card.featured{
      border:1px solid var(--red);
    }
    .price-name{ font-size:17px; }
    .price-desc{ font-size:13px; }
    .price-amount{ font-size:52px; }
    .price-features li{ font-size:13px; padding:6px 0; }
    .price-cta{
      padding:13px;
      font-size:14px;
      margin-top:20px;
      width:100%;
    }

    /* AGENCIAS */
    .agency-pricing{ padding:52px 16px; }
    .agency-header h2{ font-size:26px; }
    .agency-cards{ grid-template-columns:1fr; gap:10px; }
    .agency-card{ padding:20px 16px; }
    .agency-tier{ font-size:18px; }

    /* TRUST */
    .trust{ padding:52px 16px; }
    .trust-inner{ grid-template-columns:1fr; gap:36px; }
    .trust-badges{ grid-template-columns:1fr 1fr; gap:12px; }
    .trust-badge{ padding:16px; }
    .testimonial{ padding:20px 16px; }
    .testimonial-text{ font-size:14px; }

    /* PARAMÉDICO */
    .paramedic{ min-height:320px; }
    .paramedic-content{ padding:40px 16px; }
    .paramedic-content h2{ font-size:26px; }

    /* CTA FINAL */
    .cta-section{ min-height:320px; }
    .cta-content{ padding:40px 16px; text-align:center; }
    .cta-content h2{ font-size:36px; line-height:.95; }
    .cta-content p{ font-size:13px; }
    .cta-content .btn-primary{
      width:100%;
      justify-content:center;
      margin-top:24px;
    }

    /* FOOTER */
    .rc-footer{
      padding:20px 16px;
      flex-direction:column;
      text-align:center;
      font-size:12px;
      gap:10px;
    }
  }

  /* ════════════════════════════════════════
     MÓVIL PEQUEÑO — 375px
     iPhone SE, Galaxy A series
  ════════════════════════════════════════ */
  @media(max-width:375px){
    .hero h1{ font-size:44px; }
    .nav-cta{ padding:7px 10px !important; font-size:11px !important; }
    .price-amount{ font-size:44px; }
    .helmet-grid{ grid-template-columns:1fr; }
    .chip-specs{ grid-template-columns:1fr 1fr; }
    .trust-badges{ grid-template-columns:1fr; }
  }
`

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [session, setSession] = useState<{ user?: { email?: string } } | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      .querySelectorAll(".step, .price-card, .testimonial, .trust-badge, .si-cell, .pgrid-cell, .helmet-cell")
      .forEach((el) => {
        (el as HTMLElement).style.opacity = "0";
        (el as HTMLElement).style.transform = "translateY(16px)";
        (el as HTMLElement).style.transition = "opacity .5s ease, transform .5s ease";
        fader.observe(el);
      });

    // Forzar play en videos — múltiples estrategias para Next.js + Supabase
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
      <CheckoutModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      {/* NAV */}
      <nav className={`rc-nav${navScrolled ? " scrolled" : ""}`}>
        <Link href="/" className="nav-logo">RESCUE<span>CHIP</span></Link>
        <ul className="nav-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#producto">El chip</a></li>
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
          <li><a href="#producto" onClick={() => setMobileMenuOpen(false)}>El chip</a></li>
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
          <div className="hero-badge">NOM-034-SSA3-2013 · Identificación Médica Prehospitalaria</div>
          <h1>
            En una emergencia,
            <em>cada segundo</em>
            cuenta.
          </h1>
          <p className="hero-sub">RescueChip es el primer sistema de identificación médica prehospitalaria de 3 capas para motociclistas en México: chip NFC + QR de respaldo + tarjeta médica. Tus datos vitales siempre accesibles.</p>
          <div className="hero-actions">
            <a href="#precios" className="btn-primary">Protege tu rodada — $349</a>
            <a href="/profile/RSC-DEMO" target="_blank" className="btn-ghost" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5,3 13,8 5,13" fill="currentColor" stroke="none" />
              </svg>
              Mira un demo
            </a>
            <a href="#como-funciona" className="btn-ghost">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="7" /><path d="M6 8l2 2 3-3" />
              </svg>
              Ver cómo funciona
            </a>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="scroll-line" />
          <span className="scroll-text">Scroll</span>
        </div>
      </section>

      {/* STATS */}
      <div className="stat-interrupt">
        <div className="si-cell"><div className="si-num">14,000+</div><div className="si-cap">Motociclistas muertos por año en México</div></div>
        <div className="si-sep" />
        <div className="si-cell"><div className="si-num">3 min</div><div className="si-cap">Ventana crítica de atención tras accidente</div></div>
        <div className="si-sep" />
        <div className="si-cell"><div className="si-num">68%</div><div className="si-cap">De accidentados llegan sin identificación médica</div></div>
        <div className="si-sep" />
        <div className="si-cell"><div className="si-num">10 seg</div><div className="si-cap">Tiempo promedio para acceder al perfil médico completo</div></div>
      </div>

      {/* NARRATIVE */}
      <section className="narrative" id="como-funciona">
        <div className="narrative-inner">
          <div className="narrative-header">
            <div className="section-label">La realidad</div>
            <h2 className="section-title">¿Qué pasa cuando<br />tienes un accidente?</h2>
            <p>En un accidente, los primeros minutos determinan todo. Sin información, los paramédicos trabajan a ciegas. RescueChip cambia eso.</p>
          </div>
          <div className="steps">
            <div className="step"><div className="step-num">01</div><div className="step-icon">🏍️</div><h3>El accidente</h3><p>Quedas inconsciente. Nadie sabe tu tipo de sangre, tus alergias, ni a quién llamar. Los minutos pasan.</p></div>
            <div className="step"><div className="step-num">02</div><div className="step-icon">📱</div><h3>Alguien escanea</h3><p>Un testigo o paramédico acerca su celular al chip NFC en tu casco o escanea el QR del sticker. Sin app, sin registro. 3 capas de respaldo: chip NFC, QR y tarjeta médica.</p></div>
            <div className="step"><div className="step-num">03</div><div className="step-icon">🩺</div><h3>Datos vitales</h3><p>Tipo de sangre, alergias, medicamentos, enfermedades crónicas. Todo disponible al instante.</p></div>
            <div className="step"><div className="step-num">04</div><div className="step-icon">📞</div><h3>Tu familia recibe alerta</h3><p>Tus contactos de emergencia reciben SMS y correo automático con tu ubicación exacta en segundos.</p></div>
            <div className="step"><div className="step-num">05</div><div className="step-icon">🔐</div><h3>Queda un registro</h3><p>El sistema guarda el momento y lugar exacto del escaneo. Nadie desaparece sin dejar rastro.</p></div>
          </div>
        </div>
      </section>

      {/* AWARENESS SPLIT */}
      <section className="awareness">
        <div className="aw-video-wrap">
          <iframe
            src="https://www.youtube.com/embed/bLTGSE9KFIQ?autoplay=1&mute=1&loop=1&playlist=bLTGSE9KFIQ&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
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
          <div className="aw-overlay" />
          <span className="aw-tag">/ Cada rodada</span>
        </div>
        <div className="aw-content">
          <div className="section-label">La realidad</div>
          <h2>La carretera <em>no avisa.</em></h2>
          <blockquote className="blockquote">&ldquo;Me chocaron en la lateral del Periférico. Un señor escaneó el chip — en segundos mi esposa ya tenía mi ubicación exacta y llegó al lugar del accidente después de que le llamaron.&rdquo;</blockquote>
          <p>Quedar inconsciente en un accidente de moto es más común de lo que crees. Cuando pasa, los paramédicos no tienen tiempo de buscar — necesitan datos ahora.</p>
          <a href="#precios" className="btn-primary">Activar mi protección</a>
        </div>
      </section>

      {/* GRID */}
      <section className="pgrid-section">
        <div className="pgrid-header">
          <div className="section-label">Consciencia</div>
          <h2 className="section-title">La libertad de rodar merece protección real</h2>
          <p>No es ser miedoso. Es ser inteligente. Los mejores riders usan equipo completo — RescueChip es parte del equipo.</p>
        </div>
        <div className="pgrid">
          <div className="pgrid-cell tall">
            <img src="/images/IAmototirada.png" alt="Accidente autopista mexicana" loading="lazy" />
            <div className="pgrid-cap"><span>La autopista mexicana</span></div>
          </div>
          <div className="pgrid-cell">
            <img src="/images/IAaccidente1.png" alt="POV accidente" loading="lazy" />
            <div className="pgrid-cap"><span>Punto de vista del rider</span></div>
          </div>
          <div className="pgrid-cell">
            <img src="/images/IAaccidente2.png" alt="POV crash" loading="lazy" />
            <div className="pgrid-cap"><span>La curva que no viste</span></div>
          </div>
          <div className="pgrid-cell">
            <img src="/images/IAaccidente3.png" alt="El impacto" loading="lazy" />
            <div className="pgrid-cap"><span>El impacto</span></div>
          </div>
          <div className="pgrid-cell">
            <img src="/images/IAmotociclistaescanea.png" alt="Paramédico escaneando chip" loading="lazy" />
            <div className="pgrid-cap"><span>El escaneo que salva vidas</span></div>
          </div>
        </div>
      </section>

      {/* CHIP ANIMADO */}
      <section className="chip-showcase" id="producto">
        <div className="chip-container">
          <img
            src="/sticker_demo.png"
            alt="Sticker RescueChip NFC + QR — Sistema de identificación médica prehospitalaria de 3 capas"
            style={{ width: '100%', maxWidth: '340px', height: 'auto', display: 'block', margin: '0 auto' }}
            loading="lazy"
          />
        </div>
        <div className="chip-info">
          <div className="section-label">El sistema de 3 capas</div>
          <h2 className="section-title">No es un gadget.<br />Es infraestructura<br /><em>de salud.</em></h2>
          <p>Un sistema de identificación médica prehospitalaria de 3 capas: chip NFC programado con tu folio único, QR de respaldo en el sticker y tarjeta médica para tu cartera. Sin batería, sin Bluetooth, sin app.</p>
          <ul className="product-features">
            <li>Funciona con cualquier celular Android o iPhone 7+</li>
            <li>No requiere batería ni conexión Bluetooth</li>
            <li>Perfil médico editable en cualquier momento</li>
            <li>Alertas automáticas a tus contactos de emergencia</li>
            <li>Compartir ubicación GPS al momento del escaneo</li>
            <li>Alineado con NOM-034-SSA3-2013</li>
          </ul>
          <a href="#precios" className="btn-primary">Pedir mi chip — $349 con envío</a>
        </div>
      </section>

      {/* PRODUCT */}
      <section className="product">
        <div className="product-media">
          <img src="/images/nuevosticker.jpeg" alt="Casco con chip RescueChip" loading="lazy" />
          <div className="product-media-overlay" />
        </div>
        <div className="product-content">
          <div className="section-label">Tu casco, tu protección</div>
          <h2 className="section-title">El chip que ya<br />protege riders<br />en México</h2>
          <p>Diseñado para pegar en cualquier casco. Resistente al agua, al calor y a la velocidad. Se ve en el casco — y eso es intencional.</p>
          <ul className="product-features">
            <li>Sticker resistente a agua y calor</li>
            <li>Compatible con cualquier superficie de casco</li>
            <li>Tamaño discreto, visibilidad intencional</li>
            <li>Identificación digital única — vinculada a tu chip de por vida</li>
          </ul>
          <a href="#precios" className="btn-primary">Quiero el mío</a>
        </div>
      </section>

      {/* PARAMÉDICO */}
      <section className="paramedic">
        <img className="paramedic-img" src="/images/IAparamedicoescaneando.png" alt="Paramédico escaneando RescueChip" loading="lazy" />
        <div className="paramedic-overlay" />
        <div className="paramedic-content">
          <div className="section-label">En una emergencia real</div>
          <h2 className="section-title">El paramédico escanea.<br /><em>Tú ya estás<br />protegido.</em></h2>
          <p>Sin app, sin contraseña, sin internet. El chip NFC, el QR de respaldo y tu tarjeta médica garantizan que tus datos vitales sean accesibles en cualquier escenario de emergencia.</p>
          <a href="#precios" className="btn-primary">Activar mi protección — $347</a>
        </div>
      </section>

      {/* GALERÍA CASCO */}
      <section className="helmet-gallery">
        <div className="helmet-gallery-inner">
          <div className="section-label">El producto real</div>
          <h2 className="section-title">Tu chip. Tu casco. Tu red de seguridad.</h2>
          <p>Así luce el chip RescueChip en un casco real.</p>
          <div className="helmet-grid">
            <div className="helmet-cell"><img src="/images/nuevosticker2.jpeg" alt="Chip RescueChip en casco" loading="lazy" /></div>
            <div className="helmet-cell"><img src="/images/nuevosticker3.jpeg" alt="Casco Honda con chip NFC" loading="lazy" /></div>
            <div className="helmet-cell"><img src="/images/nuevosticker4.jpeg" alt="Casco Nexx RescueChip" loading="lazy" /></div>
            <div className="helmet-cell"><img src="/images/nuevosticker5.jpeg" alt="Close-up chip emergencia" loading="lazy" /></div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="precios">
        <div className="pricing-inner">
          <div className="pricing-header">
            <div className="section-label">Elige tu protección</div>
            <h2 className="section-title">Envío incluido a todo México</h2>
            <p>Un solo pago. Sin suscripción. Tu perfil activo de por vida.</p>
          </div>
          <div className="pricing-cards">
            <div className="price-card">
              <div className="price-name">Individual</div>
              <div className="price-desc">Para el rider que va solo y sabe que la carretera no perdona.</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">347</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>1 chip NFC programado listo para activar</li><li>Perfil médico completo</li>
                <li>3 contactos de emergencia configurables</li><li>Alertas SMS + email al escanear</li><li>Historial de accesos en tu dashboard</li><li>Envío incluido a todo México</li>
              </ul>
              <button onClick={() => setSelectedPlan("individual")} className="btn-price btn-price-outline">Elegir Individual</button>
            </div>
            <div className="price-card featured">
              <div className="price-name">Pareja</div>
              <div className="price-desc">Para los que siempre ruedan juntos. Protección para dos.</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">549</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>2 chips NFC programados, uno para cada uno</li><li>Perfiles médicos 100% independientes</li>
                <li>3 contactos de emergencia por perfil</li><li>Alertas SMS + email para ambos</li><li>Dashboard individual para cada usuario</li><li>Envío incluido — $274 por persona</li>
              </ul>
              <button onClick={() => setSelectedPlan("pareja")} className="btn-price btn-price-solid">Elegir Pareja</button>
            </div>
            <div className="price-card">
              <div className="price-name">Familiar</div>
              <div className="price-desc">Toda la familia sobre dos ruedas, toda la familia protegida.</div>
              <div className="price-amount"><span className="price-currency">$</span><span className="price-value">949</span></div>
              <div className="price-period">MXN · Pago único</div>
              <div className="price-divider" />
              <ul className="price-features">
                <li>Hasta 4 chips NFC para toda la familia</li><li>Perfil médico completo por cada integrante</li>
                <li>3 contactos de emergencia por perfil</li><li>Alertas SMS + email por cada chip activado</li><li>Dashboard independiente por usuario</li><li>Envío incluido — desde $237 por persona</li>
              </ul>
              <button onClick={() => setSelectedPlan("familiar")} className="btn-price btn-price-outline">Elegir Familiar</button>
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
              <div className="agency-units">50 chips a $179 c/u</div>
              <div className="agency-price-wrap"><span className="agency-currency">$</span><span className="agency-value">8,950</span><span className="agency-curr-label">MXN</span></div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>50 chips NFC programados con folios únicos RSC</li><li>Activación directa por el usuario final</li>
                <li>Perfil médico completo por chip</li><li>Alertas automáticas SMS + email al escanear</li><li>Soporte por WhatsApp durante la implementación</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Starter%20de%20RescueChip%20(50%20chips%20a%20%24179%20c%2Fu).%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-outline">Solicitar</a>
            </div>
            <div className="agency-card featured">
              <span className="agency-badge">Recomendado</span>
              <div className="agency-tier">Growth</div>
              <div className="agency-units">100 chips a $149 c/u</div>
              <div className="agency-price-wrap"><span className="agency-currency">$</span><span className="agency-value">14,900</span><span className="agency-curr-label">MXN</span></div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>100 chips NFC programados con folios únicos RSC</li><li>Todo lo del plan Starter</li>
                <li>Manual de ventas RescueChip para tu equipo (PDF)</li><li>Capacitación virtual para tu equipo de ventas</li><li>Soporte prioritario por WhatsApp</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Growth%20de%20RescueChip%20(100%20chips%20a%20%24149%20c%2Fu).%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-solid">Solicitar</a>
            </div>
            <div className="agency-card dark-card-agency">
              <div className="agency-tier">Premium</div>
              <div className="agency-units">300+ chips a $119 c/u</div>
              <div className="agency-price-wrap"><span className="agency-negotiable">Precio negociable</span></div>
              <div className="agency-divider" />
              <ul className="agency-features">
                <li>300+ chips NFC, precio negociable por volumen</li><li>Todo lo del plan Growth</li>
                <li>Sesión de onboarding presencial o virtual</li><li>Material físico de punto de venta incluido</li><li>Gerente de cuenta dedicado</li><li>Factura electrónica CFDI 4.0</li>
              </ul>
              <a href="https://wa.me/525551433904?text=Hola%2C%20me%20interesa%20el%20plan%20Premium%20de%20RescueChip%20(300%2B%20chips).%20%C2%BFPodr%C3%ADan%20darme%20m%C3%A1s%20informaci%C3%B3n%3F" target="_blank" rel="noopener noreferrer" className="btn-agency-outline">Contáctanos</a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST + TESTIMONIOS */}
      <section className="trust" id="comunidad">
        <div className="trust-inner">
          <div className="trust-content">
            <div className="section-label">Comunidad RescueChip</div>
            <h2 className="section-title">Riders que ya<br />eligieron protegerse</h2>
            <p>En México, más de 14,000 motociclistas mueren cada año. La mayoría sin identificación médica encima. RescueChip existe para que los paramédicos tengan lo que necesitan en los primeros 60 segundos — cuando todavía hay tiempo de hacer la diferencia.</p>
            <div className="trust-badges">
              <div className="trust-badge"><span>🏥</span> NOM-034-SSA3-2013</div>
              <div className="trust-badge"><span>🔒</span> Datos cifrados</div>
              <div className="trust-badge"><span>🇲🇽</span> Hecho en México</div>
              <div className="trust-badge"><span>⚡</span> Sin suscripción</div>
            </div>
          </div>
          <div className="testimonials">
            <div className="testimonial">
              <p className="testimonial-text">&ldquo;Me caí en la México-Puebla. Quedé inconsciente. El chip hizo todo — mi esposa recibió la ubicación antes de que llegara la ambulancia.&rdquo;</p>
              <div className="testimonial-author"><div className="author-avatar">LR</div><div className="author-info"><strong>Luis R.</strong><span>CDMX · Italika Spitfire 200</span></div></div>
            </div>
            <div className="testimonial">
              <p className="testimonial-text">&ldquo;Tengo contraindicado el ibuprofeno. Ese dato podía empeorar mi situación médica si quedaba inconsciente. Con RescueChip ese riesgo ya no existe.&rdquo;</p>
              <div className="testimonial-author"><div className="author-avatar">HR</div><div className="author-info"><strong>Héctor R.</strong><span>CDMX · Honda CB650R</span></div></div>
            </div>
            <div className="testimonial">
              <p className="testimonial-text">&ldquo;Ya es parte del kit básico como los guantes. Todo mi grupo lo tiene. Si sales sin él, sientes que te falta algo.&rdquo;</p>
              <div className="testimonial-author"><div className="author-avatar">JM</div><div className="author-info"><strong>Julio M.</strong><span>CDMX · Honda CB650R</span></div></div>
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
          <h2 className="section-title">Tu chip llega en<br />3-5 días hábiles</h2>
          <p>Pago único. Sin suscripción. Envío incluido a todo México. Tu perfil activo desde el primer escaneo.</p>
          <div className="cta-actions">
            <a href="#precios" className="btn-primary">Pedir mi RescueChip — $349</a>
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
    </div>
  );
}
