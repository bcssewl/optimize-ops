export default function DepartmentsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Departments</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        Here you can manage your company departments. Add, edit, or remove
        departments as needed.
      </p>
      {/* Department management UI will go here */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">No departments yet</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start by adding a new department.
        </p>
      </div>
    </div>
  );
}
