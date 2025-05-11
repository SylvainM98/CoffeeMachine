import Link from 'next/link';

export default function About() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-6">À propos</h1>
            <p className="text-xl mb-4">Cette page vous présente notre application.</p>
            <Link href="/" className="text-blue-500 underline">
                Retour à l&apos;accueil
            </Link>
        </div>
    );
}