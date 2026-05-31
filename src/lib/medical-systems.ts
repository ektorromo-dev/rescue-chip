import type { CountryCode } from 'libphonenumber-js';

export interface PublicSystem {
  value: string;
  label: string;
  showNSS?: boolean;
  showAfiliacion?: boolean;
  showClinica?: boolean;
  showCURP?: boolean;
  nssLabel?: string;
  afiliacionLabel?: string;
  clinicaLabel?: string;
  curpLabel?: string;
  emergencyPhone?: string;
  emergencyLabel?: string;
}

export interface InsuranceConfig {
  publicSystems: PublicSystem[];
  privateInsurers: string[];
  privateSystemLabel: string;
  privateGeneric: boolean; // true = mostrar input libre en lugar de dropdown
  noneWarning: string;
  emergencyNumber: string; // número de emergencias del país
}

export const MEDICAL_SYSTEMS: Record<string, InsuranceConfig> = {
  MX: {
    publicSystems: [
      {
        value: 'IMSS', label: 'IMSS',
        showNSS: true, showClinica: true, showCURP: true,
        nssLabel: 'NSS — Número de Seguridad Social',
        clinicaLabel: 'UMF / Clínica asignada',
        curpLabel: 'CURP',
        emergencyPhone: '8002222668', emergencyLabel: 'Llamar IMSS'
      },
      {
        value: 'ISSSTE', label: 'ISSSTE',
        showAfiliacion: true, showClinica: true, showCURP: true,
        afiliacionLabel: 'Número de afiliación ISSSTE',
        clinicaLabel: 'Clínica asignada',
        curpLabel: 'CURP',
        emergencyPhone: '8000190900', emergencyLabel: 'Llamar ISSSTE'
      },
      {
        value: 'IMSS-BIENESTAR', label: 'IMSS-BIENESTAR',
        showClinica: true, showCURP: true,
        clinicaLabel: 'Centro de salud asignado',
        curpLabel: 'CURP'
      },
      {
        value: 'PEMEX', label: 'PEMEX',
        showAfiliacion: true, showClinica: true,
        afiliacionLabel: 'Número de afiliación',
        clinicaLabel: 'Unidad médica asignada',
        emergencyPhone: '5519442500', emergencyLabel: 'Urgencias PEMEX'
      },
      {
        value: 'SEDENA / SEMAR', label: 'SEDENA / SEMAR',
        showAfiliacion: true, showClinica: true,
        afiliacionLabel: 'Número de afiliación',
        clinicaLabel: 'Unidad médica asignada'
      },
    ],
    privateInsurers: ['AXA', 'GNP', 'Seguros Monterrey (SMNYL)', 'Allianz', 'MetLife', 'Zurich', 'BUPA', 'Mapfre', 'Seguros Atlas'],
    privateSystemLabel: 'Seguro Privado (Gastos Médicos Mayores)',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el hospital público más cercano. Te recomendamos considerar un seguro de gastos médicos mayores.',
    emergencyNumber: '911'
  },

  CR: {
    publicSystems: [
      {
        value: 'CCSS', label: 'CCSS — Caja Costarricense del Seguro Social',
        showNSS: true, showClinica: true, showCURP: true,
        nssLabel: 'Número de afiliado CCSS',
        clinicaLabel: 'EBAIS / Área de Salud asignada',
        curpLabel: 'Número de cédula',
        emergencyPhone: '1128', emergencyLabel: 'Llamar CCSS'
      },
      {
        value: 'INS', label: 'INS — Instituto Nacional de Seguros',
        showAfiliacion: true,
        afiliacionLabel: 'Número de póliza INS / SOA',
        emergencyPhone: '8000467267', emergencyLabel: 'Llamar INS'
      },
    ],
    privateInsurers: ['AXA', 'Mapfre', 'SURA', 'Pan American Life', 'Qualitas'],
    privateSystemLabel: 'Seguro Privado',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el hospital de la CCSS más cercano.',
    emergencyNumber: '911'
  },

  DO: {
    publicSystems: [
      {
        value: 'SeNaSa Contributivo', label: 'SeNaSa — Régimen Contributivo',
        showNSS: true, showCURP: true,
        nssLabel: 'Número de afiliado SeNaSa',
        curpLabel: 'Número de cédula dominicana'
      },
      {
        value: 'SeNaSa Subsidiado', label: 'SeNaSa — Régimen Subsidiado',
        showNSS: true, showCURP: true,
        nssLabel: 'Número de afiliado',
        curpLabel: 'Número de cédula dominicana'
      },
    ],
    privateInsurers: ['ARS Humano', 'ARS Palic', 'ARS Universal', 'ARS Mapfre BHD', 'ARS CMD', 'ARS Meta Salud'],
    privateSystemLabel: 'ARS — Administradora de Riesgos de Salud',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el hospital público más cercano.',
    emergencyNumber: '911'
  },

  CO: {
    publicSystems: [
      {
        value: 'EPS Contributivo', label: 'EPS — Régimen Contributivo',
        showNSS: true, showClinica: true, showCURP: true,
        nssLabel: 'Número de afiliado EPS',
        clinicaLabel: 'IPS / Centro médico asignado',
        curpLabel: 'Número de cédula colombiana'
      },
      {
        value: 'EPS Subsidiado', label: 'EPS — Régimen Subsidiado (SISBEN)',
        showNSS: true, showCURP: true,
        nssLabel: 'Número de afiliado',
        curpLabel: 'Número de cédula colombiana'
      },
    ],
    privateInsurers: ['Sura', 'Colmena', 'Bolívar', 'Mapfre', 'Allianz', 'AXA Colpatria'],
    privateSystemLabel: 'Medicina Prepagada / Seguro Privado',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el hospital público más cercano.',
    emergencyNumber: '123'
  },

  CL: {
    publicSystems: [
      {
        value: 'FONASA', label: 'FONASA — Fondo Nacional de Salud',
        showNSS: true, showCURP: true,
        nssLabel: 'Número de beneficiario FONASA',
        curpLabel: 'RUT (número de cédula)'
      },
    ],
    privateInsurers: ['Isapre Banmédica', 'Isapre Cruz Blanca', 'Isapre Consalud', 'Isapre Colmena', 'Isapre Vida Tres'],
    privateSystemLabel: 'ISAPRE — Instituto de Salud Previsional',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el hospital público más cercano.',
    emergencyNumber: '131'
  },

  ES: {
    publicSystems: [
      {
        value: 'Seguridad Social', label: 'Seguridad Social (Sistema Nacional de Salud)',
        showNSS: true, showClinica: true, showCURP: true,
        nssLabel: 'Número de Seguridad Social (NSS)',
        clinicaLabel: 'Centro de salud asignado',
        curpLabel: 'DNI / NIE'
      },
      {
        value: 'Mutua laboral', label: 'Mutua laboral',
        showAfiliacion: true,
        afiliacionLabel: 'Nombre de la mutua y número de afiliado'
      },
    ],
    privateInsurers: ['Sanitas', 'Adeslas (SegurCaixa)', 'Asisa', 'DKV', 'Mapfre', 'AXA', 'Generali'],
    privateSystemLabel: 'Seguro Privado de Salud',
    privateGeneric: false,
    noneWarning: 'En caso de emergencia serás atendido en el centro sanitario público más cercano.',
    emergencyNumber: '112'
  },

  US: {
    publicSystems: [
      {
        value: 'Medicare', label: 'Medicare',
        showNSS: true,
        nssLabel: 'Medicare Beneficiary ID (MBI)'
      },
      {
        value: 'Medicaid', label: 'Medicaid',
        showNSS: true,
        nssLabel: 'Medicaid ID Number'
      },
    ],
    privateInsurers: ['Blue Cross Blue Shield', 'Aetna', 'UnitedHealth', 'Cigna', 'Humana', 'Kaiser Permanente'],
    privateSystemLabel: 'Private Health Insurance',
    privateGeneric: false,
    noneWarning: 'In case of emergency you will be treated at the nearest hospital.',
    emergencyNumber: '911'
  },

  CA: {
    publicSystems: [
      {
        value: 'Provincial Health', label: 'Provincial Health Insurance',
        showNSS: true, showClinica: true,
        nssLabel: 'Health Card Number',
        clinicaLabel: 'Province of coverage'
      },
    ],
    privateInsurers: ['Manulife', 'Sun Life', 'Great-West Life', 'Blue Cross', 'Green Shield'],
    privateSystemLabel: 'Private Health Insurance',
    privateGeneric: false,
    noneWarning: 'In case of emergency you will be treated at the nearest hospital.',
    emergencyNumber: '911'
  },
};

// Fallback genérico para países no configurados
const GENERIC_CONFIG: InsuranceConfig = {
  publicSystems: [],
  privateInsurers: [],
  privateSystemLabel: 'Seguro / Plan de salud',
  privateGeneric: true,
  noneWarning: 'En caso de emergencia, serás atendido en el centro médico más cercano.',
  emergencyNumber: '911'
};

export function getMedicalConfig(countryCode: string): InsuranceConfig {
  return MEDICAL_SYSTEMS[countryCode] || GENERIC_CONFIG;
}

// Lista de países disponibles para el selector "País de uso/residencia"
// Separados en: mercados activos, mercados en expansión, otros
export const PROFILE_COUNTRIES: {
  code: string;
  name: string;
  flag: string;
  group: 'activo' | 'expansion' | 'otro';
}[] = [
  // Mercados activos
  { code: 'MX', name: 'México', flag: '🇲🇽', group: 'activo' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', group: 'activo' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴', group: 'activo' },
  // Expansión
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', group: 'expansion' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', group: 'expansion' },
  { code: 'ES', name: 'España', flag: '🇪🇸', group: 'expansion' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', group: 'expansion' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦', group: 'expansion' },
  // Otros
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', group: 'otro' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', group: 'otro' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', group: 'otro' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', group: 'otro' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦', group: 'otro' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', group: 'otro' },
  { code: 'OTHER', name: 'Otro país', flag: '🌍', group: 'otro' },
];

// Mapeo país → código de teléfono compatible con SUPPORTED_COUNTRIES
// Para cuando el país de perfil no tiene entrada directa en SUPPORTED_COUNTRIES
export function getPhoneCountryFromProfileCountry(profileCountry: string): string {
  const directMap: Record<string, string> = {
    MX: 'MX', CR: 'CR', DO: 'DO', CO: 'CO',
    CL: 'CL', ES: 'ES', US: 'US', CA: 'CA',
  };
  return directMap[profileCountry] || 'MX';
}
