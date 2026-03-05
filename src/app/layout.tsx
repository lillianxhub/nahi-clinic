import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
    weight: ["100", "200", "300", "400", "500", "600", "700"],
    subsets: ["latin", "thai"],
    variable: "--font-ibm-plex-sans-thai",
    display: "swap",
});

export const metadata: Metadata = {
    title: "NAHI Clinic",
    description: "NAHI Clinic",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    console.log("RootLayout rendering...");
    return (
        <html lang="th">
            <body
                className={`${ibmPlexSansThai.variable} font-sans antialiased`}
            >
                <SessionProviderWrapper>{children}</SessionProviderWrapper>
            </body>
        </html>
    );
}
