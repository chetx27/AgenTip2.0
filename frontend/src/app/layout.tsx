import './globals.css';

export const metadata = {
  title: 'AgenTip',
  description: 'x402 tipping layer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
