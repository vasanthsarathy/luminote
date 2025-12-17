export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
            Luminote
          </h1>
          <p className="mt-2 text-gray-400">Turn music into light</p>
        </div>

        {/* Status */}
        <div className="bg-surface rounded-lg p-6 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">
              Layout: Your roof layout (100 models)
            </span>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-surface rounded-lg p-12 border border-gray-800 text-center">
          <p className="text-xl text-gray-400">
            AI-powered light sequence generation coming soon...
          </p>
        </div>
      </div>
    </main>
  );
}
