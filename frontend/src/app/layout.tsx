import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Coffreo - Click & Collect',
  description: 'Commandez votre café en ligne et venez le récupérer rapidement',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <nav className="bg-amber-900 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="font-bold text-xl flex items-center gap-2">
              <span>☕</span>
              Coffreo
            </Link>
            <div className="space-x-6">
              <Link href="/" className="hover:text-amber-200 transition-colors">
                Accueil
              </Link>
              <Link href="/click-collect" className="hover:text-amber-200 transition-colors">
                Commander
              </Link>
              <Link href="/a-propos" className="hover:text-amber-200 transition-colors">
                À propos
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}