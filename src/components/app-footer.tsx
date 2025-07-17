export function AppFooter() {
  return (
    <footer className="w-full border-t bg-white dark:bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-4">
        <div>
          &copy; {new Date().getFullYear()} OptimizeOps. All rights reserved.
        </div>
        <div className="flex gap-4">
          <a href="/privacy" className="hover:underline">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:underline">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
