import type { Metadata } from 'next'
import { Oswald } from 'next/font/google'
import './globals.css'

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Family Feud',
  description: 'Play Family Feud with your friends!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} antialiased bg-[#0a1628] min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
