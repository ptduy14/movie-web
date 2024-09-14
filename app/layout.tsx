import type { Metadata } from 'next';
import './globals.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white relative min-h-screen flex flex-col">
        <Header />
        {/* Add flex-grow here to make sure it expands and pushes footer to the bottom */}
        <main className="flex-grow pb-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
