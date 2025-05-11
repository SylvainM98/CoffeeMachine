import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4 text-amber-900">
          Bienvenue chez Coffreo
        </h1>
        <p className="text-xl text-amber-800 mb-8">
          Votre café préféré, prêt en quelques clics
        </p>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">☕</div>
          <h2 className="text-2xl font-semibold text-amber-900 mb-4">
            Prêt à commander ?
          </h2>
          <p className="text-amber-700 mb-6">
            Commandez votre café en ligne et venez le récupérer rapidement grâce à notre système Click & Collect
          </p>
          <Link
            href="/click-collect"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            Commander mon café
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/a-propos" className="text-amber-600 hover:text-amber-800 underline">
            En savoir plus sur Coffreo
          </Link>
        </div>
      </div>
    </main>
  );
}