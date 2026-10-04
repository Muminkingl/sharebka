import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShareBka",
  description: "Instantly share files and text peer-to-peer. No setup, no signup.",
  icons: {
    icon: "/trx.svg",
    apple: "/trx.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/trx.svg" />
      </head>
      <body translate="no">{children}</body>
    </html>
  );
}
