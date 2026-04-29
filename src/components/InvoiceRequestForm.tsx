"use client";
import { useState } from "react";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";

interface InvoiceRequestFormProps {
  sessionId: string;
}

export default function InvoiceRequestForm({ sessionId }: InvoiceRequestFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    rfc: "",
    nombre_fiscal: "",
    regimen_fiscal: "",
    uso_cfdi: "G03 - Gastos en general",
    codigo_postal_fiscal: "",
    email_factura: "",
    whatsapp_factura: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/factura-postpago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          ...invoiceData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar datos fiscales");
      setSuccess(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      alert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#0A0A08",
    color: "#F4F0EB",
    padding: "0 12px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "#9E9A95",
    marginBottom: "4px",
    display: "block",
  };

  if (success) {
    return (
      <div style={{
        backgroundColor: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.2)",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        textAlign: "left",
      }}>
        <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#F4F0EB", marginBottom: "4px" }}>
            Datos fiscales recibidos
          </p>
          <p style={{ fontSize: "12px", color: "#9E9A95", lineHeight: 1.5 }}>
            Recibirás tu CFDI y XML en un máximo de 72 horas hábiles en el correo y WhatsApp que proporcionaste.
          </p>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          width: "100%",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: "rgba(232,35,26,0.08)",
          color: "#E8231A",
          borderRadius: "14px",
          fontSize: "14px",
          fontWeight: 700,
          border: "1px solid rgba(232,35,26,0.2)",
          cursor: "pointer",
        }}
      >
        <FileText size={18} />
        ¿Requieres factura?
      </button>
    );
  }

  return (
    <div style={{
      backgroundColor: "rgba(232,35,26,0.04)",
      border: "1px solid rgba(232,35,26,0.2)",
      borderRadius: "14px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      textAlign: "left",
    }}>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "#E8231A", display: "flex", alignItems: "center", gap: "8px" }}>
        <FileText size={16} /> Datos Fiscales
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={labelStyle}>RFC *</label>
          <input type="text" name="rfc" value={invoiceData.rfc} onChange={handleChange} required placeholder="ABCD123456XYZ" minLength={12} maxLength={13} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>CP Fiscal *</label>
          <input type="text" name="codigo_postal_fiscal" value={invoiceData.codigo_postal_fiscal} onChange={handleChange} required placeholder="Ej. 11000" minLength={5} maxLength={5} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Razón Social / Nombre Fiscal *</label>
        <input type="text" name="nombre_fiscal" value={invoiceData.nombre_fiscal} onChange={handleChange} required placeholder="Nombre completo o Empresa SA de CV" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Régimen Fiscal *</label>
        <select name="regimen_fiscal" value={invoiceData.regimen_fiscal} onChange={handleChange} required style={{ ...inputStyle, height: "44px" }}>
          <option value="">Selecciona tu régimen fiscal</option>
          <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
          <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios</option>
          <option value="606 - Arrendamiento">606 - Arrendamiento</option>
          <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales</option>
          <option value="616 - Sin obligaciones fiscales">616 - Sin obligaciones fiscales</option>
          <option value="621 - Incorporación Fiscal">621 - Incorporación Fiscal</option>
          <option value="625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas">625 - Plataformas Tecnológicas</option>
          <option value="626 - Régimen Simplificado de Confianza">626 - RESICO</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Uso de CFDI *</label>
        <select name="uso_cfdi" value={invoiceData.uso_cfdi} onChange={handleChange} required style={{ ...inputStyle, height: "44px" }}>
          <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
          <option value="G03 - Gastos en general">G03 - Gastos en general</option>
          <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={labelStyle}>Email para factura *</label>
          <input type="email" name="email_factura" value={invoiceData.email_factura} onChange={handleChange} required placeholder="tu@correo.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>WhatsApp *</label>
          <input type="tel" name="whatsapp_factura" value={invoiceData.whatsapp_factura} onChange={handleChange} required placeholder="5500000000" style={inputStyle} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !invoiceData.rfc || !invoiceData.nombre_fiscal || !invoiceData.regimen_fiscal || !invoiceData.codigo_postal_fiscal || !invoiceData.email_factura || !invoiceData.whatsapp_factura}
        style={{
          width: "100%",
          height: "48px",
          backgroundColor: loading ? "#9B1510" : "#E8231A",
          color: "#FFF",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          borderRadius: "12px",
          fontWeight: 800,
          fontSize: "14px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: "4px",
        }}
      >
        {loading ? <><Loader2 size={16} /> Enviando...</> : "Enviar datos fiscales"}
      </button>

      <p style={{ fontSize: "11px", color: "#9E9A95", textAlign: "center", lineHeight: 1.4 }}>
        Recibirás tu CFDI y XML en un máximo de 72 horas hábiles.
      </p>
    </div>
  );
}
