import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "../styles/globals.css";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-fredoka" });

export const metadata: Metadata = {
    title: "My Learning Adventure",
    description: "A fun educational game for kids",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={clsx(inter.variable, fredoka.variable, "font-sans antialiased overflow-hidden bg-sky-100")}>
                <div className="fixed inset-0 pointer-events-none z-[-1]">
                    {/* Placeholder for HD Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-green-200 opacity-80" />
                </div>
                <main className="h-screen w-screen relative">
                    {children}
                </main>
            </body>
        </html>
    );
}
