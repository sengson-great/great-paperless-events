"use client";

import { useState, useRef, useEffect } from "react";
import Logo from "@/public/logo.png";
import Hero from "@/public/hero.jpg";
import Tree from "@/public/tree.jpeg";

export default function Navbar() {
     // Desktop Dropdown states
  const [isDesktopDropdown1Open, setIsDesktopDropdown1Open] = useState(false);
  const [isDesktopDropdown2Open, setIsDesktopDropdown2Open] = useState(false);
  const [isDesktopDropdown3Open, setIsDesktopDropdown3Open] = useState(false);
  const [isDesktopDropdown4Open, setIsDesktopDropdown4Open] = useState(false);
  const [isDesktopDropdown5Open, setIsDesktopDropdown5Open] = useState(false);
  const [isDesktopDropdown6Open, setIsDesktopDropdown6Open] = useState(false);

  // Mobile Dropdown states
  const [isMobileDropdown1Open, setIsMobileDropdown1Open] = useState(false);
  const [isMobileDropdown2Open, setIsMobileDropdown2Open] = useState(false);
  const [isMobileDropdown3Open, setIsMobileDropdown3Open] = useState(false);
  const [isMobileDropdown4Open, setIsMobileDropdown4Open] = useState(false);
  const [isMobileDropdown5Open, setIsMobileDropdown5Open] = useState(false);
  const [isMobileDropdown6Open, setIsMobileDropdown6Open] = useState(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const desktopDropdownRef1 = useRef<HTMLLIElement | null>(null);
  const desktopDropdownRef2 = useRef<HTMLLIElement | null>(null);
  const desktopDropdownRef3 = useRef<HTMLLIElement | null>(null);
  const desktopDropdownRef4 = useRef<HTMLLIElement | null>(null);
  const desktopDropdownRef5 = useRef<HTMLLIElement | null>(null);
  const desktopDropdownRef6 = useRef<HTMLLIElement | null>(null);

  const mobileDropdownRef1 = useRef<HTMLLIElement | null>(null);
  const mobileDropdownRef2 = useRef<HTMLLIElement | null>(null);
  const mobileDropdownRef3 = useRef<HTMLLIElement | null>(null);
  const mobileDropdownRef4 = useRef<HTMLLIElement | null>(null);
  const mobileDropdownRef5 = useRef<HTMLLIElement | null>(null);
  const mobileDropdownRef6 = useRef<HTMLLIElement | null>(null);

  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedElement = event.target;

      // Check mobile menu
      if (
        mobileMenuRef.current &&
        clickedElement instanceof Node &&
        !mobileMenuRef.current.contains(clickedElement)
      ) {
        setIsMobileMenuOpen(false);
      }

      // Check desktop dropdowns
      if (
        desktopDropdownRef1.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef1.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown1Open(false);
      }
      if (
        desktopDropdownRef2.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef2.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown2Open(false);
      }
      if (
        desktopDropdownRef3.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef3.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown3Open(false);
      }
      if (
        desktopDropdownRef4.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef4.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown4Open(false);
      }
      if (
        desktopDropdownRef5.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef5.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown5Open(false);
      }
      if (
        desktopDropdownRef6.current &&
        clickedElement instanceof Node &&
        !desktopDropdownRef6.current.contains(clickedElement)
      ) {
        setIsDesktopDropdown6Open(false);
      }

      // Check mobile dropdowns
      if (
        mobileDropdownRef1.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef1.current.contains(clickedElement)
      ) {
        setIsMobileDropdown1Open(false);
      }
      if (
        mobileDropdownRef2.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef2.current.contains(clickedElement)
      ) {
        setIsMobileDropdown2Open(false);
      }
      if (
        mobileDropdownRef3.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef3.current.contains(clickedElement)
      ) {
        setIsMobileDropdown3Open(false);
      }
      if (
        mobileDropdownRef4.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef4.current.contains(clickedElement)
      ) {
        setIsMobileDropdown4Open(false);
      }
      if (
        mobileDropdownRef5.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef5.current.contains(clickedElement)
      ) {
        setIsMobileDropdown5Open(false);
      }
      if (
        mobileDropdownRef6.current &&
        clickedElement instanceof Node &&
        !mobileDropdownRef6.current.contains(clickedElement)
      ) {
        setIsMobileDropdown6Open(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
    const closeAllMobileDropdowns = () => {
    setIsMobileDropdown1Open(false);
    setIsMobileDropdown2Open(false);
    setIsMobileDropdown3Open(false);
    setIsMobileDropdown4Open(false);
    setIsMobileDropdown5Open(false);
    setIsMobileDropdown6Open(false);
    };
    return (
        <nav className="bg-neutral-primary fixed w-full top-0 start-0 bg-white ">
        <div className="flex justify-between px-4 pt-3">
          <a
            href="#"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <img src={Logo.src} className="h-7" alt="Logo" />
          </a>

          <div className="flex gap-3">
            <form className="max-w-md mx-auto hidden lg:block">
              <div className="relative bg-white">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-body"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  id="search"
                  className="block w-full py-2 ps-12 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body"
                  placeholder="Search"
                />
              </div>
            </form>

            <button className="border border-blue-300! text-blue-500 rounded-lg! px-3 py-2">
              Login
            </button>
            <button className="border text-white bg-blue-500 rounded-lg! px-3 py-2">
              Sign Up
            </button>
          </div>
        </div>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden lg:block">
          <div className={`w-full bg-white`}>
            <ul className="flex font-medium p-4 space-x-8">
              {/* Personal/Family Event Dropdown - DESKTOP */}
              <li className="relative" ref={desktopDropdownRef1}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown1Open(!isDesktopDropdown1Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  Personal/Family Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown1Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown1Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                    <li>
                      <a
                        href="#"
                        className="flex flex-col items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline!"
                      >
                        <p className=" -ms-5 text-black">Marriage Invitation</p>
                        <p className=" text-gray-400">Create an elegant digital marriage invitations easily</p>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="flex flex-col items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline!"
                      >
                        <p className=" -ms-1 text-black">Engagement Invation</p>
                        <p className=" text-gray-400">Send beautiful paperless engagement invitations instantly</p>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Infant Blessing Invitation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        New Home Ceremony Invitation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Birthday Invitation
                      </a>
                    </li>
                  </ul>
                </div>
              </li>

              {/* Add other desktop dropdowns similarly with desktop refs and states */}
              <li className="relative" ref={desktopDropdownRef2}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown2Open(!isDesktopDropdown2Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown2Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown2Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                                     <li>
                      <a
                        href="#"
                        className="flex flex-col items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline!"
                      >
                        <p className=" -ms-10 text-black">Kathen Festival</p>
                        <p className=" text-gray-400">Create elegant digital Kathen invitations easily</p>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Fundraising Celebration
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Four Requisite Celebration
                      </a>
                    </li>
                  </ul>
                </div>
              </li>

              <li className="relative" ref={desktopDropdownRef3}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown3Open(!isDesktopDropdown3Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  Individual Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown3Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown3Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                                            <li>
                      <a
                        href="#"
                        className="flex flex-col items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline!"
                      >
                        <p className=" -ms-14 text-black">Praise Letter</p>
                        <p className=" text-gray-400">Create elegant digital Praise letter easily</p>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Gratitude Letter
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Greeting Letter
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Blessing Letter
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="relative" ref={desktopDropdownRef4}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown4Open(!isDesktopDropdown4Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  Invitation Paper
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown4Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown4Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                                                       <li>
                      <a
                        href="#"
                        className="flex flex-col items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline!"
                      >
                        <p className=" -ms-8 text-black">Transcript Report</p>
                        <p className=" text-gray-400">Create elegant digital Praise letter easily</p>
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Bookfair
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200 no-underline! text-black"
                      >
                        Training
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="relative" ref={desktopDropdownRef5}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown5Open(!isDesktopDropdown5Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  Custom Letter
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown5Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown5Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Birthday
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Wedding
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Anniversary
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="relative" ref={desktopDropdownRef6}>
                <button
                  onClick={() =>
                    setIsDesktopDropdown6Open(!isDesktopDropdown6Open)
                  }
                  className="flex items-center justify-between py-2 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary hover:text-fg-brand"
                >
                  School Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isDesktopDropdown6Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  className={`
                  absolute z-10 bg-white rounded-base shadow-lg w-44 border border-gray-200
                  transition-all duration-300 ease-in-out
                  ${
                    isDesktopDropdown6Open
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible -translate-y-2"
                  }
                `}
                >
                  <ul className="p-2 text-sm text-body font-medium">
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Birthday
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Wedding
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded transition-colors duration-200"
                      >
                        Anniversary
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* MOBILE SEARCH AND HAMBURGER */}
        <div className="lg:hidden">
          <div className="p-2 flex justify-between items-center">
            <form className="max-w-md w-full mr-2">
              <div className="relative bg-white">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-body"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </div>
                <input
                  type="search"
                  id="search"
                  className="block w-full py-2 ps-12 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body"
                  placeholder="Search"
                />
              </div>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen((prev) => {
                  if (prev) {
                    // Only when we are CLOSING → close all dropdowns
                    closeAllMobileDropdowns();
                  }
                  return !prev;
                });
              }}
              className="inline-flex items-center p-2 w-10 h-10 justify-center z-50 bg-white text-sm text-body rounded-base hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M5 7h14M5 12h14M5 17h14"
                />
              </svg>
            </button>
          </div>

          {/* MOBILE MENU */}
          <div
            ref={mobileMenuRef}
            className={`w-full bg-white z-20 transition-all duration-300 ease-in-out overflow-hidden ${
              isMobileMenuOpen
                ? "max-h-screen opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <ul className="flex flex-col font-medium p-4">
              {/* Personal/Family Event Dropdown - MOBILE */}
              <li className="relative" ref={mobileDropdownRef1}>
                <button
                  onClick={() =>
                    setIsMobileDropdown1Open(!isMobileDropdown1Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Personal/Family Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown1Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown1Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Birthday
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Wedding
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Anniversary
                    </a>
                  </div>
                )}
              </li>

              {/* Add other mobile dropdowns similarly with mobile refs and states */}
              <li className="relative" ref={mobileDropdownRef2}>
                <button
                  onClick={() =>
                    setIsMobileDropdown2Open(!isMobileDropdown2Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown2Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown2Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Christmas
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Easter
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Other
                    </a>
                  </div>
                )}
              </li>

              <li className="relative" ref={mobileDropdownRef3}>
                <button
                  onClick={() =>
                    setIsMobileDropdown3Open(!isMobileDropdown3Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown3Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown3Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Christmas
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Easter
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Other
                    </a>
                  </div>
                )}
              </li>

              <li className="relative" ref={mobileDropdownRef4}>
                <button
                  onClick={() =>
                    setIsMobileDropdown4Open(!isMobileDropdown4Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown4Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown4Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Christmas
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Easter
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Other
                    </a>
                  </div>
                )}
              </li>

              <li className="relative" ref={mobileDropdownRef5}>
                <button
                  onClick={() =>
                    setIsMobileDropdown5Open(!isMobileDropdown5Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown5Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown5Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Christmas
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Easter
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Other
                    </a>
                  </div>
                )}
              </li>

              <li className="relative" ref={mobileDropdownRef6}>
                <button
                  onClick={() =>
                    setIsMobileDropdown6Open(!isMobileDropdown6Open)
                  }
                  className="flex items-center justify-between w-full py-3 px-3 rounded font-medium text-heading hover:bg-neutral-tertiary"
                >
                  Religious Event
                  <svg
                    className={`w-4 h-4 ms-1.5 transition-transform duration-300 ${
                      isMobileDropdown6Open ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 9-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMobileDropdown6Open && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Christmas
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Easter
                    </a>
                    <a
                      href="#"
                      className="block py-2 px-3 text-body hover:bg-neutral-tertiary-medium rounded transition-colors"
                    >
                      Other
                    </a>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </nav>
    )
}