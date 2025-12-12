import type { Metadata } from 'next';
import './globals.css';
import LayoutWrapper from '../components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Retail Brain - Customer Intelligence Platform',
  description: 'Omnichannel identity and customer intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
