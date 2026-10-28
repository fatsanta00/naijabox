'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-naija-border/80 bg-naija-ink/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Typographic Wordmark (ADR-018) */}
        <Link href="/" className="flex items-center space-x-1.5 focus:outline-none">
          <span className="text-2xl font-black tracking-tight text-white select-none">
            Naija<span className="text-brand-500">Box</span>
          </span>
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
          <Link href="/#boxes" className="hover:text-white transition-colors">
            Explore
          </Link>
          <Link href="/boxes/guess-the-price" className="hover:text-white transition-colors">
            Games
          </Link>
          <Link href="/boxes/how-nigerian" className="hover:text-white transition-colors">
            Quizzes
          </Link>
          <Link href="/boxes/decision-maker" className="hover:text-white transition-colors">
            Tools
          </Link>
          <Link href="/boxes/pricecheck" className="hover:text-white transition-colors">
            PriceCheck
          </Link>
          <Link href="/slang" className="hover:text-white transition-colors">
            Slang
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </nav>

        {/* Mobile Menu Hamburger (44px min tap target) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-naija-card text-gray-300 hover:text-white border border-naija-border focus:outline-none"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`} />
          <span className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-naija-border bg-naija-surface px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/#boxes"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            Explore All Boxes
          </Link>
          <Link
            href="/boxes/guess-the-price"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            Games
          </Link>
          <Link
            href="/boxes/how-nigerian"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            Quizzes
          </Link>
          <Link
            href="/boxes/decision-maker"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            Tools
          </Link>
          <Link
            href="/boxes/pricecheck"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            PriceCheck
          </Link>
          <Link
            href="/slang"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            Slang Dictionary
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-200 hover:bg-naija-card"
          >
            About NaijaBox
          </Link>
        </div>
      )}
    </header>
  );
}
