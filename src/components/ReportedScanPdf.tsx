import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer } from "@react-pdf/renderer";

const pdfStyles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        color: '#1A1A18',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#E8231A',
        paddingBottom: 16,
        marginBottom: 20,
    },
    logo: {
        width: 52,
        height: 52,
        borderRadius: 8,
    },
    brandInfo: {
        alignItems: 'flex-end',
    },
    brandName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A18',
        letterSpacing: 1,
    },
    brandTag: {
        fontSize: 9,
        color: '#8C7F72',
        marginTop: 2,
    },
    alertBadge: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#E8231A',
        borderRadius: 8,
        padding: 14,
        marginBottom: 20,
    },
    alertTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B91C1C',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    alertSubtitle: {
        fontSize: 10,
        color: '#991B1B',
        lineHeight: 1.4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#5C4F42',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        borderBottomWidth: 1,
        borderBottomColor: '#EDE8DE',
        paddingBottom: 6,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F5F0E8',
    },
    label: {
        width: '38%',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#5C4F42',
    },
    value: {
        width: '62%',
        fontSize: 10,
        color: '#1A100A',
    },
    noticeBox: {
        backgroundColor: '#FBF9F5',
        borderWidth: 1,
        borderColor: '#EDE8DE',
        borderRadius: 6,
        padding: 12,
        marginTop: 10,
    },
    noticeText: {
        fontSize: 9,
        color: '#6B6762',
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#EDE8DE',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#8C7F72',
        lineHeight: 1.4,
    },
});

export interface ScanReportPdfProps {
    folio: string;
    fechaStr: string;
    ipAddress: string;
    userAgent: string;
    ownerEmail: string | null;
    logoBase64: string | null;
}

export const ScanReportPdf: React.FC<ScanReportPdfProps> = ({
    folio,
    fechaStr,
    ipAddress,
    userAgent,
    ownerEmail,
    logoBase64,
}) => {
    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                {/* Encabezado */}
                <View style={pdfStyles.header}>
                    {logoBase64 ? (
                        <Image src={logoBase64} style={pdfStyles.logo} />
                    ) : (
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#E8231A' }}>RESCUECHIP</Text>
                    )}
                    <View style={pdfStyles.brandInfo}>
                        <Text style={pdfStyles.brandName}>RESCUECHIP SECURITY</Text>
                        <Text style={pdfStyles.brandTag}>Certificado de Registro de Incidencia</Text>
                    </View>
                </View>

                {/* Badge Alerta */}
                <View style={pdfStyles.alertBadge}>
                    <Text style={pdfStyles.alertTitle}>Reporte de Escaneo — Dispositivo Reportado</Text>
                    <Text style={pdfStyles.alertSubtitle}>
                        Este documento certifica el intento de escaneo físico o digital de un dispositivo RescueChip previamente dado de baja y marcado como robado o extraviado por su titular.
                    </Text>
                </View>

                {/* Sección de Datos Técnicos */}
                <View style={pdfStyles.section}>
                    <Text style={pdfStyles.sectionTitle}>Detalles del Escaneo</Text>
                    
                    <View style={pdfStyles.row}>
                        <Text style={pdfStyles.label}>Folio del Dispositivo:</Text>
                        <Text style={[pdfStyles.value, { fontWeight: 'bold', color: '#E8231A' }]}>{folio}</Text>
                    </View>

                    <View style={pdfStyles.row}>
                        <Text style={pdfStyles.label}>Estatus del Chip:</Text>
                        <Text style={pdfStyles.value}>Reportado (Extraviado / Robado)</Text>
                    </View>

                    <View style={pdfStyles.row}>
                        <Text style={pdfStyles.label}>Fecha y Hora (CDMX):</Text>
                        <Text style={pdfStyles.value}>{fechaStr}</Text>
                    </View>

                    <View style={pdfStyles.row}>
                        <Text style={pdfStyles.label}>Dirección IP del Escáner:</Text>
                        <Text style={pdfStyles.value}>{ipAddress}</Text>
                    </View>

                    <View style={pdfStyles.row}>
                        <Text style={pdfStyles.label}>Dispositivo / Navegador:</Text>
                        <Text style={pdfStyles.value}>{userAgent}</Text>
                    </View>

                    {ownerEmail && (
                        <View style={pdfStyles.row}>
                            <Text style={pdfStyles.label}>Cuenta del Propietario:</Text>
                            <Text style={pdfStyles.value}>{ownerEmail}</Text>
                        </View>
                    )}
                </View>

                {/* Medidas de Protección */}
                <View style={pdfStyles.section}>
                    <Text style={pdfStyles.sectionTitle}>Acciones de Protección Ejecutadas</Text>
                    <View style={pdfStyles.noticeBox}>
                        <Text style={pdfStyles.noticeText}>
                            1. Bloqueo Inmediato: No se expuso ninguna información médica ni datos personales confidenciales del titular.{"\n"}
                            2. Notificación en Pantalla: Se presentó una advertencia indicando que el chip está reportado como robado, ofreciendo un enlace directo de devolución.{"\n"}
                            3. Registro Forense: La dirección IP y huella digital del dispositivo que realizó el escaneo quedaron registradas en los sistemas de auditoría.
                        </Text>
                    </View>
                </View>

                {/* Pie de página */}
                <View style={pdfStyles.footer}>
                    <Text style={pdfStyles.footerText}>
                        RescueChip Sistema de Identificación Médica · soporte: contacto@rescue-chip.com · rescue-chip.com{"\n"}
                        Documento generado automáticamente como evidencia técnica de trazabilidad.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export async function generateScanReportPdfBuffer(props: ScanReportPdfProps): Promise<Buffer> {
    return await renderToBuffer(<ScanReportPdf {...props} />);
}
