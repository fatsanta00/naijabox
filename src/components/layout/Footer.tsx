import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-naija-border/80 bg-naija-surface/60 py-10 px-4 mt-16 text-center text-xs text-naija-muted">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-center space-x-6">
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/#boxes" className="hover:text-white transition-colors">
            All Boxes
          </Link>
        </div>
        <p className="text-gray-400">
          NaijaBox — A box full of things to do. Built for the culture, internet humor, and curious minds.
        </p>
        <p className="text-[11px] text-gray-400">
          No sign up needed. Made in Nigeria 🇳🇬
        </p>
      </div>
    </footer>
  );
}
