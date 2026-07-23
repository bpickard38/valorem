import { SOCIAL } from "@/lib/site";

/* Instagram / Facebook / TikTok icon row, shared by the site footer and the
 * /contact page. */
export default function SocialLinks() {
  return (
    <div className="flex items-center gap-6 text-charcoal/60">
      <a
        href={SOCIAL.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="transition-colors hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <a
        href={SOCIAL.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
        className="transition-colors hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13.5 21.9v-7.8h2.62l.5-3.25H13.5V8.74c0-.89.44-1.76 1.83-1.76h1.42V4.21s-1.29-.22-2.52-.22c-2.57 0-4.25 1.56-4.25 4.38v2.48H7.11v3.25h2.87v7.8a11.6 11.6 0 0 0 3.52 0z" />
        </svg>
      </a>
      <a
        href={SOCIAL.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
        className="transition-colors hover:text-gold"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      </a>
    </div>
  );
}
