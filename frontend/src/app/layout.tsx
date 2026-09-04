import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: 'Oficina Automóvel - TDW 25/26',
  description: 'Gestão de serviços automóveis',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
