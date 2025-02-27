export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <h2 className="text-2xl font-semibold mt-2">Forbidden</h2>
      <p className="mt-4 text-gray-600">
        You don&apos;t have permission to access this page.
      </p>
      <a
        href="/admin/teams"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Go Home
      </a>
    </div>
  );
}
