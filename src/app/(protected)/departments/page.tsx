export default function DepartmentsPage() {
  return (
    <div className="flex flex-col md:flex-row w-full">
      {/* Main content area, sidebar is handled in layout */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg text-gray-600">Welcome to your dashboard! 🚀</p>
      </div>
    </div>
  );
}
