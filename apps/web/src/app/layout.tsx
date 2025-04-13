import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import {VT323} from "next/font/google";

const vt = VT323({
  subsets: ['latin'],
  weight: "400",
  style: "normal",
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Clerk Next.js Quickstart',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased grid grid-rows-[20px_1fr_20px] items-center justify-items-between min-h-screen p-8 pb-20 gap-12 sm:p-12 font-[family-name:var(--font-geist-sans)] `}>
          {/* <header className="flex justify-between items-center p-4 gap-4 h-16">
            <h1 className={`${vt.className} text-6xl bg-gradient-to-r from-pink-500 via-red-500 via-orange-400 via-yellow-400 via-green-400 via-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent animate-gradient `}>VOXEL</h1>
            <SignedIn>
              <UserButton  />
            </SignedIn>
          </header> */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
