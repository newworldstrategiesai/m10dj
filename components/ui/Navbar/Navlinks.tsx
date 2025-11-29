'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import Logo from '@/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ThemeSwitcher from '@/components/theme-switcher';
import s from './Navbar.module.css';

interface NavlinksProps {
  user?: any;
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Pricing' },
    ...(user ? [
      { href: '/account', label: 'Account' },
      { href: '/admin/contacts', label: 'Contacts' },
      { href: '/admin/contracts', label: 'Contracts' },
      { href: '/admin/chat', label: 'Chat' },
      { href: '/admin/email-client', label: 'Email Client' },
    ] : []),
  ];

  const handleSignOut = (e: React.FormEvent<HTMLFormElement>) => {
    handleRequest(e, SignOut, router);
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative flex flex-row justify-between items-center py-4 md:py-6">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="M10 DJ Company Home">
          <Logo />
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex ml-6 space-x-2" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${s.link} ${pathname === link.href ? 'text-zinc-100 font-semibold' : ''}`}
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center justify-end space-x-4">
        <ThemeSwitcher />
        {user ? (
          <form onSubmit={handleSignOut}>
            <input type="hidden" name="pathName" value={pathname || '/'} />
            <button type="submit" className={s.link} aria-label="Sign out">
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/signin" className={s.link} aria-label="Sign in">
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="flex lg:hidden items-center space-x-2">
        <ThemeSwitcher />
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={`${s.link} p-2`}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-black border-zinc-800">
            <SheetHeader>
              <SheetTitle className="text-zinc-100">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 mt-8" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${s.link} text-lg py-2 ${
                    pathname === link.href ? 'text-zinc-100 font-semibold border-l-2 border-brand pl-4' : ''
                  }`}
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-zinc-800">
                {user ? (
                  <form onSubmit={handleSignOut}>
                    <input type="hidden" name="pathName" value={pathname || '/'} />
                    <button
                      type="submit"
                      className={`${s.link} text-lg py-2 w-full text-left`}
                      aria-label="Sign out"
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${s.link} text-lg py-2 block`}
                    aria-label="Sign in"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
