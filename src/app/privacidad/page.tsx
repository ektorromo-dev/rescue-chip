import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | RescueChip",
  description: "Aviso de privacidad de RescueChip conforme a la LFPDPPP",
};

export default function PrivacidadPage() {
  return (
    <div style={{ backgroundColor: "#0A0A08", minHeight: "100vh", color: "#F4F0EB", fontFamily: "'Barlow', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "20px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(244,240,235,0.08)" }}>
        <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "3px", color: "#F4F0EB", textDecoration: "none" }}>
          RESCUE<span style={{ color: "#E8231A" }}>CHIP</span>
        </Link>
        <Link href="/" style={{ color: "#C8C0B4", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          &larr; Volver
        </Link>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 16px" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "48px", color: "#F4F0EB", textAlign: "center", margin: "0 0 16px 0", letterSpacing: "1px" }}>
          AVISO DE PRIVACIDAD INTEGRAL
        </h1>
        <p style={{ fontSize: "14px", color: "#9E9A95", fontStyle: "italic", textAlign: "center", marginBottom: "48px" }}>
          Última actualización: Marzo 2026
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            I. IDENTIDAD DEL RESPONSABLE
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span>, con domicilio en la Ciudad de México, México, y correo electrónico <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none", fontWeight: 500 }}>contacto@rescue-chip.com</a>, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            II. DATOS PERSONALES QUE SE RECABAN
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Para las finalidades señaladas en este aviso, recabamos las siguientes categorías de datos:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de identificación:</span> Nombre completo, sexo, fecha de nacimiento.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de contacto:</span> Número telefónico, dirección de correo electrónico.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de salud (SENSIBLES):</span> Tipo de sangre, alergias, enfermedades crónicas, medicamentos en uso, condiciones médicas relevantes.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de contactos de emergencia:</span> Nombre, teléfono y relación de las personas designadas por el titular.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos técnicos de acceso:</span> Dirección IP, geolocalización al momento del escaneo del chip, user agent del dispositivo, fecha y hora de acceso.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            III. FINALIDADES DEL TRATAMIENTO
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>Finalidades primarias (necesarias para el servicio):</span>
          </p>
          <ol style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Almacenar y mostrar el perfil médico de emergencia del titular al ser escaneado el chip NFC o código QR.</li>
            <li>Enviar notificaciones de emergencia (SMS y correo electrónico) a los contactos de emergencia designados por el titular al detectarse un escaneo en modo emergencia.</li>
            <li>Registrar accesos al perfil con fines de seguridad y auditoría.</li>
            <li>Gestionar la activación, desactivación y administración del chip NFC vinculado al titular.</li>
            <li>Procesar pagos y emitir comprobantes fiscales.</li>
          </ol>

          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px", marginTop: "24px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>Finalidades secundarias (no necesarias, pero legítimas):</span>
          </p>
          <ol style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Enviar comunicaciones sobre actualizaciones del servicio, nuevas funcionalidades o alertas de seguridad.</li>
            <li>Generar estadísticas agregadas y anonimizadas sobre el uso del servicio.</li>
            <li>Mejorar la plataforma y la experiencia del usuario.</li>
          </ol>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Si no desea que sus datos sean tratados para las finalidades secundarias, puede enviar solicitud a <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none", fontWeight: 500 }}>contacto@rescue-chip.com</a>.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            IV. DATOS PERSONALES SENSIBLES
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> recaba y trata datos personales sensibles relativos al estado de salud del titular (tipo de sangre, alergias, enfermedades, medicamentos). Estos datos son estrictamente necesarios para el funcionamiento del servicio de identificación médica prehospitalaria.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Al activar su chip y aceptar el consentimiento informado en rescue-chip.com/activar, usted otorga su <span style={{ color: "#F4F0EB", fontWeight: 600 }}>CONSENTIMIENTO EXPRESO</span> para el tratamiento de estos datos sensibles conforme a las finalidades descritas en este aviso.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            V. NATURALEZA PÚBLICA DEL PERFIL DE EMERGENCIA
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El titular reconoce y acepta que el perfil médico de emergencia será accesible <span style={{ color: "#F4F0EB", fontWeight: 600 }}>PÚBLICAMENTE</span> al escanear el chip NFC o código QR, sin necesidad de autenticación por parte del tercero que realice el escaneo. Esta accesibilidad es una condición esencial del servicio, diseñada para funcionar en emergencias donde el titular puede estar inconsciente o incapacitado.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El perfil muestra únicamente: nombre corto (primer nombre y primer apellido), sexo, tipo de sangre, alergias, enfermedades crónicas, medicamentos, y nombre y teléfono de contactos de emergencia.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VI. TRANSFERENCIAS DE DATOS
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Sus datos personales pueden ser transferidos a:
          </p>
          <ol style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Proveedores de infraestructura tecnológica (Supabase, Inc.; Vercel, Inc.; Twilio, Inc.) para el almacenamiento y procesamiento necesarios para prestar el servicio. Estos proveedores actúan como encargados del tratamiento y cuentan con políticas de privacidad y acuerdos de tratamiento de datos.</li>
            <li>Proveedores de servicios de pago (Stripe, Inc.) para el procesamiento de transacciones. Stripe no tiene acceso a datos de salud.</li>
            <li>Autoridades competentes cuando sea requerido por ley o mandato judicial.</li>
          </ol>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            No se realizan transferencias de datos personales a terceros con fines de marketing, publicidad o comercialización.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VII. DERECHOS ARCO
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Usted tiene derecho a:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", listStyleType: "disc" }}>
            <li>Acceder a sus datos personales en nuestro poder.</li>
            <li>Rectificar sus datos cuando sean inexactos o incompletos.</li>
            <li>Cancelar el tratamiento de sus datos.</li>
            <li>Oponerse al tratamiento de sus datos para finalidades específicas.</li>
          </ul>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Para ejercer cualquiera de estos derechos, puede:
          </p>
          <ol style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Utilizar la funcionalidad de edición y eliminación de datos en su dashboard en rescue-chip.com.</li>
            <li>Enviar solicitud por escrito a <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none", fontWeight: 500 }}>contacto@rescue-chip.com</a>, incluyendo: nombre completo, folio RSC-XXXXX de su chip, descripción clara de lo que solicita, y documento de identidad para acreditar su titularidad.</li>
          </ol>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El plazo de respuesta es de 20 días hábiles conforme a la LFPDPPP.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VIII. MEDIDAS DE SEGURIDAD
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> implementa medidas de seguridad administrativas, técnicas y físicas para proteger sus datos personales, incluyendo:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", listStyleType: "disc" }}>
            <li>Cifrado en tránsito (HTTPS/TLS) y en reposo.</li>
            <li>Control de acceso basado en roles (Row Level Security en base de datos).</li>
            <li>Registro de accesos con dirección IP, fecha, hora y geolocalización.</li>
            <li>Limitación de velocidad (rate limiting) en endpoints sensibles.</li>
            <li>Expiración de sesiones y verificación de dispositivos.</li>
            <li>Auditorías periódicas de seguridad.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            IX. COOKIES Y TECNOLOGÍAS DE RASTREO
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El sitio rescue-chip.com utiliza cookies estrictamente necesarias para el funcionamiento del servicio (autenticación de sesión). No utilizamos cookies de publicidad ni de rastreo de terceros.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            X. MODIFICACIONES AL AVISO DE PRIVACIDAD
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> se reserva el derecho de modificar este aviso de privacidad. Cualquier cambio será publicado en rescue-chip.com/privacidad. La fecha de última actualización se indica al inicio de este documento.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            XI. AUTORIDAD
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Si considera que su derecho a la protección de datos personales ha sido vulnerado, puede acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI): www.inai.org.mx
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            XII. CONTACTO
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Para cualquier duda o solicitud relacionada con este aviso de privacidad:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", listStyleType: "none", marginLeft: "-20px" }}>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Correo:</span> <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none", fontWeight: 500 }}>contacto@rescue-chip.com</a></li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Sitio:</span> rescue-chip.com</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "40px 60px", borderTop: "1px solid rgba(244,240,235,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginTop: "40px" }}>
        <div style={{ color: "#C8C0B4", fontSize: "13px" }}>
          rescue-chip.com | <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none" }}>contacto@rescue-chip.com</a>
        </div>
        <div style={{ color: "#9E9A95", fontSize: "13px" }}>
          &copy; 2026 RescueChip
        </div>
      </footer>
    </div>
  );
}
