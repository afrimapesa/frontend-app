export const BRAND = "AFRIMAPESA";

// Official social accounts (public profile URLs, without share-tracking parameters).
// NEXT_PUBLIC_*_URL can override them; `||` so an empty build arg falls back to the default.
export const SOCIAL_LINKS = [
  {
    network: "TikTok",
    url:
      process.env.NEXT_PUBLIC_TIKTOK_URL ||
      "https://www.tiktok.com/@afrimapesa2",
  },
  {
    network: "Instagram",
    url:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
      "https://www.instagram.com/afrimapesa",
  },
  {
    network: "Facebook",
    url:
      process.env.NEXT_PUBLIC_FACEBOOK_URL ||
      "https://www.facebook.com/profile.php?id=61570738943438",
  },
] as const;
