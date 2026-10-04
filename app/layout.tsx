import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PairDrop | Transfer Files Cross-Platform",
  description: "Instantly share files and text peer-to-peer. No setup, no signup.",
  icons: {
    icon: "/images/favicon-96x96.png",
    apple: "/images/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/images/favicon-96x96.png" />
      </head>
      <body translate="no">{children}</body>
    </html>
  );
}
