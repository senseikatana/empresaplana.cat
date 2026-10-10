// Datos de contacto reales de Empresa Plana (extraidos del sitio original).
import contactData from "./contact.json";

export const contact = {
	whatsapp: contactData.whatsapp,
	generalPhone: contactData.generalPhone,
	phones: contactData.phones,
	social: contactData.social,
	conventionBureaus: contactData.conventionBureaus,
} as const;
