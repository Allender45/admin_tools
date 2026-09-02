import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Admin Tools",
    description: "Сервис системного администрирования",
}

const themeScript = `
  (() => {
    const stored = (() => { try { return localStorage.getItem('lte-theme') } catch { return null } })();
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body>{children}</body>
        </html>
    )
}