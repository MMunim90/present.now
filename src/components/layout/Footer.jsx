import React from "react";

export default function Footer() {
  return (
    <footer className="flex shrink-0 items-center justify-center border-t border-gray-200 bg-white px-4 py-2.5 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} MMunim. All rights reserved.
      </p>
    </footer>
  );
}
