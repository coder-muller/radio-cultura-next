import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radio Cultura",
  description: "App de gestão da Radio Cultura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className}`} >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange >
          <div className="flex min-h-screen flex-col w-screen">
            <Header />
            <main className="flex-1">
              <div className="px-8 w-full">{children}</div>
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
