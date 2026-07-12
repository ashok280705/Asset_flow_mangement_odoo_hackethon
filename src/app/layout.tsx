import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AssetFlow - Enterprise Asset Management',
  description: 'Enterprise Asset & Resource Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        {children}
      </body>
    </html>
  )
}
