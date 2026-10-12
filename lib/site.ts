export const siteConfig = {
  name: "Emerald Height Academy",
  shortName: "EHA",
  tagline: "Excellence in every lesson.",
  description:
    "Emerald Height Academy — JAMB/WAEC/NECO preparation and primary enrichment in Ikeja, Lagos. Physical, online and hybrid batches.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  phone: "+234 803 000 0001",
  whatsapp: "+2348030000001",
  email: "hello@emeraldheightacademy.com",
  address: "12 Education Avenue, Ikeja, Lagos",
  city: "Lagos, Nigeria",
  locale: "en-NG",
} as const;

export type SiteConfig = typeof siteConfig;
