import Header from '@/components/header';
import Footer from '@/components/footer';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* Add flex-grow here to make sure it expands and pushes footer to the bottom */}
      <main className="flex-grow pb-24">{children}</main>
      <Footer />
    </>
  );
}
