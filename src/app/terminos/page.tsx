import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | RescueChip",
  description: "Términos y condiciones de uso del sistema RescueChip",
};

export default function TerminosPage() {
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
          TÉRMINOS Y CONDICIONES DE USO
        </h1>
        <p style={{ fontSize: "14px", color: "#9E9A95", fontStyle: "italic", textAlign: "center", marginBottom: "48px" }}>
          Última actualización: Marzo 2026
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            I. INFORMACIÓN GENERAL
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Los presentes Términos y Condiciones de Uso (en adelante, los &quot;Términos&quot;) regulan el acceso y uso de la plataforma digital, productos físicos y servicios ofrecidos por <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> (en adelante, el &quot;Proveedor&quot;), con domicilio en la Ciudad de México, México, a través del sitio web rescue-chip.com (en adelante, el &quot;Sitio&quot;) y los dispositivos NFC asociados (en adelante, los &quot;Chips&quot; o &quot;Dispositivos&quot;).
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Al adquirir, activar o utilizar cualquier producto o servicio de <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span>, el usuario (en adelante, el &quot;Usuario&quot;) acepta íntegramente estos Términos. Si no está de acuerdo con alguna de las disposiciones aquí establecidas, deberá abstenerse de utilizar los servicios.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Estos Términos se rigen por la legislación mexicana aplicable, incluyendo pero no limitado a: el Código de Comercio, el Código Civil Federal, la Ley Federal de Protección al Consumidor (LFPC), la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y demás normativa aplicable.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            II. NATURALEZA DEL SERVICIO
          </h2>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            2.1 Definición del producto
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> es un sistema de identificación médica prehospitalaria de 3 capas compuesto por:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Un chip NFC (Near Field Communication) programado con un folio único RSC-XXXXX, diseñado para adherirse al exterior del casco del motociclista.</li>
            <li>Un código QR de respaldo impreso en sticker adhesivo, vinculado al mismo folio.</li>
            <li>Una tarjeta médica de cartera con información básica de emergencia y acceso al perfil digital.</li>
            <li>Una plataforma digital accesible en rescue-chip.com que almacena el perfil médico del Usuario.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            2.2 Alcance y limitaciones fundamentales
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP ES UN SISTEMA DE IDENTIFICACIÓN, NO UN SERVICIO MÉDICO NI DE EMERGENCIA.</span> El sistema tiene como único propósito facilitar la identificación del Usuario y el acceso a sus datos médicos previamente registrados por parte de terceros (paramédicos, testigos, personal de emergencia) en caso de un accidente o situación de emergencia.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario reconoce y acepta expresamente que:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", listStyleType: "lower-alpha" }}>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> no es un dispositivo médico regulado por COFEPRIS. No diagnostica, trata, monitorea ni cura enfermedades o condiciones médicas.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> no sustituye al Sistema de Atención Médica de Urgencias (SAMU), al número de emergencias 911, ni a ningún servicio de emergencia público o privado.</li>
            <li>La efectividad del sistema depende de factores fuera del control del Proveedor, incluyendo: la acción de terceros (paramédicos, testigos), la disponibilidad de red celular e internet en el lugar del incidente, el estado físico del Chip y del sticker QR después de un impacto, y la compatibilidad del dispositivo móvil del tercero con tecnología NFC.</li>
            <li>El Proveedor no garantiza que el sistema será utilizado en una emergencia real, ni que su uso producirá un resultado médico favorable.</li>
            <li>La exactitud de la información médica contenida en el perfil es responsabilidad exclusiva del Usuario, quien se obliga a mantenerla actualizada.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            2.3 Alineación normativa
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> está diseñado para facilitar el cumplimiento del espíritu de la NOM-034-SSA3-2013 en lo relativo a la identificación del paciente en contextos prehospitalarios. Sin embargo, <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span> no es un instrumento certificado bajo dicha norma ni bajo ninguna otra Norma Oficial Mexicana.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            III. PRODUCTOS Y PRECIOS
          </h2>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            3.1 Productos disponibles
          </h3>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Individual (1 chip):</span> $347 MXN, envío incluido</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Pareja (2 chips):</span> $549 MXN, envío incluido</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Familiar (pack):</span> $949 MXN, envío incluido</li>
          </ul>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Los precios incluyen IVA y envío dentro de la República Mexicana. El Proveedor se reserva el derecho de modificar los precios, notificando previamente a través del Sitio.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            3.2 Proceso de compra
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Las compras se realizan exclusivamente a través del Sitio, procesadas mediante la plataforma de pagos Stripe, Inc. El Proveedor no almacena datos de tarjeta de crédito o débito del Usuario.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            IV. ACTIVACIÓN Y USO DEL CHIP
          </h2>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            4.1 Proceso de activación
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Una vez recibido el producto, el Usuario deberá activar su chip ingresando a rescue-chip.com/activar e introduciendo el folio RSC-XXXXX impreso en su tarjeta de activación. Durante este proceso, el Usuario proporcionará sus datos médicos y de contacto de emergencia.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            4.2 Consentimiento informado en activación
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Al activar el Chip, el Usuario otorga su consentimiento expreso e informado para que la información médica registrada sea accesible de forma <span style={{ color: "#F4F0EB", fontWeight: 600 }}>PÚBLICA</span> a través del escaneo NFC o QR, sin necesidad de autenticación previa por parte del tercero que escanee. Esta accesibilidad es una característica esencial del servicio.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario podrá revocar este consentimiento en cualquier momento eliminando sus datos médicos desde el panel de control (dashboard) en rescue-chip.com. La eliminación de datos es permanente e irreversible.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            4.3 Responsabilidad del Usuario
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario se compromete a:
          </p>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Proporcionar información médica veraz, completa y actualizada.</li>
            <li>Mantener actualizados sus datos médicos y contactos de emergencia.</li>
            <li>Colocar correctamente el Chip y el sticker QR en el exterior de su casco, en una ubicación visible.</li>
            <li>Verificar periódicamente que el Chip y el QR son legibles.</li>
            <li>No utilizar el sistema para fines ilícitos, fraudulentos o contrarios a estos Términos.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px", borderLeft: "3px solid #E8231A", paddingLeft: "20px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            V. LIMITACIÓN DE RESPONSABILIDAD
          </h2>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            5.1 Exclusión de garantía de resultado
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            <span style={{ color: "#F4F0EB", fontWeight: 600 }}>EL PROVEEDOR NO GARANTIZA QUE EL SISTEMA RESCUECHIP PRODUCIRÁ UN RESULTADO MÉDICO FAVORABLE, SALVARÁ VIDAS O EVITARÁ DAÑOS PERSONALES.</span> El sistema es una herramienta de identificación cuya efectividad depende de la intervención de terceros y de condiciones fuera del control del Proveedor.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            5.2 Causas de exclusión de responsabilidad
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Proveedor queda expresamente exento de responsabilidad en los siguientes supuestos:
          </p>
          <ol style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            <li>Daño físico al Chip o al sticker QR derivado de un accidente, impacto, exposición a condiciones extremas o uso indebido.</li>
            <li>Falta de disponibilidad de red celular o internet en el lugar del incidente.</li>
            <li>Incompatibilidad del dispositivo móvil del tercero con tecnología NFC.</li>
            <li>Omisión, negligencia o error del tercero al escanear, interpretar o actuar sobre la información del perfil.</li>
            <li>Información médica incorrecta, incompleta o desactualizada proporcionada por el Usuario.</li>
            <li>Interrupciones temporales del servicio digital por mantenimiento, actualizaciones o fallas de los proveedores de infraestructura.</li>
            <li>Eventos de fuerza mayor o caso fortuito conforme al artículo 2111 del Código Civil Federal.</li>
            <li>Uso del sistema para finalidades distintas a la identificación médica prehospitalaria.</li>
          </ol>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            5.3 Límite máximo de responsabilidad
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            La responsabilidad total acumulada del Proveedor frente al Usuario no excederá del monto efectivamente pagado por el Usuario por el producto adquirido.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            5.4 Indemnización
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario acepta indemnizar y mantener indemne al Proveedor de cualquier reclamación derivada del uso indebido del sistema o del incumplimiento de estos Términos.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VI. PROTECCIÓN DE DATOS PERSONALES
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El tratamiento de datos personales se rige por el Aviso de Privacidad disponible en rescue-chip.com/privacidad, elaborado conforme a la LFPDPPP y su Reglamento.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            6.1 Datos que se recaban
          </h3>
          <ul style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", listStyleType: "disc" }}>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de identificación:</span> nombre, sexo, fecha de nacimiento.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de contacto:</span> teléfono, correo electrónico.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de salud (sensibles):</span> tipo de sangre, alergias, enfermedades crónicas, medicamentos.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de contactos de emergencia:</span> nombre, teléfono, relación.</li>
            <li><span style={{ color: "#F4F0EB", fontWeight: 600 }}>Datos de acceso:</span> dirección IP, geolocalización al momento del escaneo, user agent.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            6.2 Naturaleza pública del perfil de emergencia
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario acepta expresamente que su perfil médico será accesible <span style={{ color: "#F4F0EB", fontWeight: 600 }}>SIN AUTENTICACIÓN</span> al ser escaneado el chip NFC o el código QR. Esta accesibilidad pública es una condición esencial del servicio, diseñada para funcionar en situaciones donde el Usuario puede estar inconsciente o incapacitado.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            6.3 Derechos ARCO
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario podrá ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) conforme a la LFPDPPP, enviando solicitud a contacto@rescue-chip.com o mediante el dashboard en rescue-chip.com.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VII. PROPIEDAD INTELECTUAL
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            La marca <span style={{ color: "#F4F0EB", fontWeight: 600 }}>RESCUECHIP</span>, el logotipo, el diseño del Sitio, el código fuente, la arquitectura del sistema y la base de datos son propiedad exclusiva del Proveedor, protegidos por la LFPPI y la LFDA. El registro de marca ante el IMPI se encuentra en trámite bajo la Clase 42.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            VIII. GARANTÍA Y POLÍTICA DE DEVOLUCIONES
          </h2>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            8.1 Garantía
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Chip NFC cuenta con una garantía de 90 días naturales a partir de la fecha de entrega, cubriendo exclusivamente defectos de fabricación.
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#C8C0B4", marginTop: "24px", marginBottom: "12px" }}>
            8.2 Devoluciones
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Usuario podrá solicitar la devolución del producto dentro de los 5 días hábiles siguientes a la recepción, siempre que el chip no haya sido activado. Una vez activado, no procederá devolución.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            IX. VIGENCIA Y TERMINACIÓN
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El servicio digital se presta por tiempo indefinido a partir de la activación del chip. El Usuario podrá dar de baja su perfil en cualquier momento eliminando sus datos desde el dashboard.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            X. MODIFICACIONES
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en el Sitio.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            XI. LEGISLACIÓN APLICABLE Y JURISDICCIÓN
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Los presentes Términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para la resolución de controversias, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#F4F0EB", marginTop: "40px", marginBottom: "16px", letterSpacing: "1px" }}>
            XII. DISPOSICIONES FINALES
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px" }}>
            Si cualquier disposición de estos Términos fuera declarada inválida, las disposiciones restantes conservarán plena vigencia. La omisión del Proveedor en exigir el cumplimiento de cualquier disposición no constituirá renuncia.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.75, color: "#C8C0B4", marginBottom: "16px", marginTop: "24px" }}>
            Para dudas: <a href="mailto:contacto@rescue-chip.com" style={{ color: "#E8231A", textDecoration: "none", fontWeight: 500 }}>contacto@rescue-chip.com</a>
          </p>
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
