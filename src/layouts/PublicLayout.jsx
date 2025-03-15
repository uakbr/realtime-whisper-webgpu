import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { toggleDarkMode } from '../store/slices/uiSlice';

const PublicLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check if user is authenticated, if yes redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/">
                  <img
                    className="block h-8 w-auto"
                    src="/logo.png"
                    alt="SpeechSync"
                  />
                </Link>
                <Link
                  to="/"
                  className="ml-2 text-xl font-bold text-blue-600 dark:text-blue-400"
                >
                  SpeechSync
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/pricing"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  About
                </Link>
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              >
                {darkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle dark mode</span>
              </button>
              
              <Link
                to="/login"
                className="border border-transparent text-gray-500 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="border border-gray-300 dark:border-gray-600 bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex justify-between">
              <div>
                <Link to="/" className="flex items-center">
                  <img
                    className="h-8 w-auto"
                    src="/logo.png"
                    alt="SpeechSync"
                  />
                  <span className="ml-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                    SpeechSync
                  </span>
                </Link>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Accurate, real-time speech recognition<br/>
                  powered by AI, right in your browser.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </h3>
                  <div className="mt-4 space-y-4">
                    <Link
                      to="/pricing"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block"
                    >
                      Pricing
                    </Link>
                    <Link
                      to="/about"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block"
                    >
                      About
                    </Link>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Legal
                  </h3>
                  <div className="mt-4 space-y-4">
                    <Link
                      to="/privacy"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block"
                    >
                      Privacy
                    </Link>
                    <Link
                      to="/terms"
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white block"
                    >
                      Terms
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 flex justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} SpeechSync. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a
                  href="#"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">GitHub</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
