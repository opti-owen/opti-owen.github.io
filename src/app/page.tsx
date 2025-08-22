"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from "next/image";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Function to toggle the mobile menu state
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    // The main container with fixed positioning, glassy effect, and shadow
    <header className="fixed top-0 left-0 w-full z-50 p-4 sm:p-6 backdrop-blur-md bg-white/10 dark:bg-gray-800/10 transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo or Brand Name */}
        <div className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="optimove logo"
            width={180}
            height={38}
            style={{
              filter: "invert(50%)"
            }}
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex space-x-6 lg:space-x-8">
          <a href="https://optimove.bamboohr.com/login.php?r=%2Fhome" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium">
            HR Platform
          </a>
          <a href="https://servicedesk.optimove.com/login?redirectTo=%2F" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium">
            IT Services
          </a>
          <a href="https://www.notion.so/Optimove-26f2f6dd1232425a8922156b0459a1ba" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium">
            Documentation
          </a>
          <a href="https://github.com/graphyteai" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium">
            Github
          </a>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-gray-900 dark:text-white focus:outline-none">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden mt-4 transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="flex flex-col items-center space-y-4">
          <a href="https://optimove.bamboohr.com/login.php?r=%2Fhome" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium w-full text-center py-2 rounded-lg">
            HR Platform
          </a>
          <a href="https://servicedesk.optimove.com/login?redirectTo=%2F" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium w-full text-center py-2 rounded-lg">
            IT Services
          </a>
          <a href="https://www.notion.so/Optimove-26f2f6dd1232425a8922156b0459a1ba" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium w-full text-center py-2 rounded-lg">
            Documentation
          </a>
          <a href="https://github.com/graphyteai" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 font-medium w-full text-center py-2 rounded-lg">
            Github
          </a>
        </nav>
      </div>
    </header>
  );
};

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header />
      <nav className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex gap-2 items-center flex-col sm:flex-row">
        </div>
      </nav>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
