export const BRAND = "AFRIMAPESA";

// Official social accounts. Set the URLs in .env.local; an icon without a URL shows as
// "coming soon" instead of linking somewhere wrong.
export const SOCIAL_LINKS = [
  { network: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "" },
  { network: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "" },
  { network: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "" },
] as const;
