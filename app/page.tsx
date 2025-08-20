import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      {/* Logo */}
      <Image
        src="/next.svg"
        alt="Next.js Logo"
        width={120}
        height={30}
        className="mb-6 dark:invert"
        priority
      />

      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to Clean JS Shipping Damo
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        A minimal clean UI built with Next.js & Tailwind CSS.
      </p>
      
    </div>
  );
}
