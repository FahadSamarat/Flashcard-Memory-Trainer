
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className=" text-white sha  dow-lg flex items-center h-16">
        <h1 className="text-xl font-bold mr-16 pl-4 h-full pt-4">Flashcard Trainer</h1>
        <ul className="flex space-x-6 text-lg">
          <li><a href="#" className="hover:text-gray-500 transition-colors">Home</a></li>
          <li><a href="#" className="hover:text-gray-500 transition-colors">About</a></li>
          <li><a href="#" className="hover:text-gray-500 transition-colors">Contact</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
          {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">&copy; 2024 Flashcard Memory Trainer. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm hover:text-gray-500 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm hover:text-gray-500 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm hover:text-gray-500 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};