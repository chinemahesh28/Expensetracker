"use client";

import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, Bot } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const Header = () => {
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 flex items-center space-x-2">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="FinanceBudy Logo"
              width={200}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <span>FinanceBudy</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            <Link href="/chatbot">
              <Button variant="outline" className="text-teal-600 border-teal-600 hover:bg-teal-50">
                <Bot size={18} />
                <span className="hidden md:inline">Chatbot</span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button>
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </Link>
          </SignedIn>

          <SignedOut>
            <SignInButton forceRedirectUrl="/">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: { avatarBox: "w-10 h-10" },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
