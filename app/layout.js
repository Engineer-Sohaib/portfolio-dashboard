import './globals.css';

export const metadata = {
  title: 'Portfolio Admin',
  icons: {
    icon: [
      { url: '/images/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/images/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/images/favicon.ico',
    apple: '/images/apple-touch-icon.png',
  },
  manifest: '/images/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
