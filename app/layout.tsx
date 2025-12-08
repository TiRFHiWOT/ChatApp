import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/hooks/useTheme";
import GoogleScript from "@/components/GoogleScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat App - Real-time Messaging",
  description:
    "Connect and chat in real-time with friends and colleagues. Secure, fast, and easy-to-use messaging application.",
  keywords: ["chat", "messaging", "real-time", "communication", "chat app"],
  authors: [{ name: "Chat App" }],
  openGraph: {
    title: "Chat App - Real-time Messaging",
    description:
      "Connect and chat in real-time with friends and colleagues. Secure, fast, and easy-to-use messaging application.",
    url: "https://chat-app-rho-wheat.vercel.app",
    siteName: "Chat App",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Chat App - Real-time Messaging",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat App - Real-time Messaging",
    description:
      "Connect and chat in real-time with friends and colleagues. Secure, fast, and easy-to-use messaging application.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://chat-app-rho-wheat.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  const root = document.documentElement;
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <GoogleScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
