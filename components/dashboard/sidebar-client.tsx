"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchOverlay from "./search-overlay";
import QuickMenu from "./quick-menu";
import { V3Icon } from "./v3-icons";
import { showToast } from "@/components/ui/toast-stack";

interface SidebarClientProps {
  username: string;
  uid: number | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

const accountLinks = [
  { label: "Overview", href: "/dashboard/overview" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Badges", href: "/dashboard/badges" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function SidebarClient({
  username,
  uid,
  avatarUrl = null,
  isAdmin = false,
}: SidebarClientProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const userCardRef = useRef<HTMLDivElement>(null);
  const [accountOpen, setAccountOpen] = useState(() =>
    /^\/dashboard\/(overview|analytics|badges|settings)/.test(pathname)
  );

  const profileHref = username ? `/${encodeURIComponent(username)}` : "/dashboard/overview";

  const topItemCls =
    "flex w-full cursor-pointer items-center gap-[7px] rounded-md px-[15px] py-[10px] text-[17.4px] font-normal no-underline transition-colors duration-200";
  const topItemState = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")
      ? "bg-pink-600/20 text-white"
      : "text-[#b5b5b5] hover:bg-white/[0.07] hover:text-[#fafafa]";
  const topIconCls = "size-[23px] shrink-0";

  function shareProfile() {
    const url = `${window.location.origin}${profileHref}`;
    navigator.clipboard?.writeText(url).then(
      () => showToast("Profile link copied to clipboard"),
      () => showToast("Could not copy link")
    );
  }

  return (
    <>
      <aside
        className="fixed left-0 top-0 z-50 hidden h-full w-[300px] flex-col justify-between overflow-y-auto rounded-r-lg border-r border-[#1a1a1a] bg-[#0e0e0e] px-[25px] py-[25px] md:flex"
        aria-label="Dashboard navigation"
      >
        <div>
          <a href="/" className="no-underline" aria-label="egirls.lol home">
            <div className="mt-[5px] flex items-center pb-[15px]">
              <span className="grid h-[34px] w-[34px] place-content-center rounded-md bg-gradient-to-br from-[#ec4899] to-[#9d174d] text-lg font-black text-white">
                E
              </span>
              <h1 className="m-0 ml-[10px] text-2xl font-normal text-[#fafafa]">
                egirls<span className="text-pink-500">.</span>lol
              </h1>
            </div>
          </a>
          <div className="flex items-center border-b border-[#181818] pb-[20px]">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="-ml-[10px] mt-[8px] flex min-h-[46px] w-[calc(100%+10px)] cursor-pointer items-center gap-[10px] rounded-md border-2 border-[#161616] bg-[#121212] px-3 py-[10px] font-[inherit] text-[#a5a4a4] transition-all hover:border-[#242424] hover:bg-[#181818] hover:text-[#fafafa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500"
            >
              <V3Icon name="search" className="size-[21px] shrink-0 text-[#fafafa]" />
              <span className="min-w-0 flex-1 truncate text-left text-[15px] font-normal">
                Search features...
              </span>
              <kbd className="rounded-lg border-2 border-[#222222] bg-[#181818] px-[6px] py-[3px] font-[inherit] text-[11px] leading-none whitespace-nowrap text-[#898989]">
                Ctrl K
              </kbd>
            </button>
          </div>
          <nav className="mt-[20px] flex flex-col gap-[6.5px]">
            <div className="flex w-full flex-col">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-[15px] py-[10px] transition-colors duration-200 hover:bg-white/[0.07] ${
                  accountOpen ? "bg-pink-600/20" : ""
                }`}
              >
                <h1 className="m-0 flex items-center gap-[8px] text-[17.3px] font-normal text-[#eee]">
                  <V3Icon name="user" className="size-[25px] text-[#eee]" />
                  Account
                </h1>
                <V3Icon
                  name="chevron-down"
                  className={`size-[26px] text-[#eee] transition-transform duration-300 ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`flex flex-col gap-[5px] overflow-hidden transition-[max-height,opacity] duration-300 ${
                  accountOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
                style={{ marginTop: 5 }}
              >
                {accountLinks.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex w-full py-0 pr-0 pl-[45px] text-[15px] no-underline transition-colors duration-300 last:mb-[5px] ${
                        active
                          ? "font-normal text-[#cccccc]"
                          : "font-normal text-[#949494] hover:text-[#cccccc]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <Link href="/dashboard/customize" className={`${topItemCls} ${topItemState("/dashboard/customize")}`}>
              <V3Icon name="pencil" className={topIconCls} />
              Customize
            </Link>
            <Link href="/dashboard/links" className={`${topItemCls} ${topItemState("/dashboard/links")}`}>
              <V3Icon name="link" className={topIconCls} />
              Links
            </Link>
            <Link href="/dashboard/premium" className={`${topItemCls} ${topItemState("/dashboard/premium")}`}>
              <V3Icon name="diamond" className={topIconCls} />
              Premium
            </Link>
            <Link href="/dashboard/templates" className={`${topItemCls} ${topItemState("/dashboard/templates")}`}>
              <V3Icon name="plus-square" className={topIconCls} />
              Templates
            </Link>
            {isAdmin ? (
              <Link href="/dashboard/admin" className={`${topItemCls} ${topItemState("/dashboard/admin")}`}>
                <V3Icon name="shield" className={topIconCls} />
                Admin Panel
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="-ml-[2px] mt-[20px] flex flex-col gap-[17px]">

          <div
            ref={userCardRef}
            className="flex w-full items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#141414] p-[10px]"
          >
            <div className="flex min-w-0 items-center gap-[7.5px] overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="ml-[1px] size-[49px] shrink-0 rounded-full border-2 border-[#222222] object-cover"
                />
              ) : (
                <V3Icon
                  name="user"
                  className="size-[49px] shrink-0 rounded-full bg-gradient-to-br from-[#2f2d30] to-[#140f14] p-[12px] text-[#575555]"
                />
              )}
              <div className="flex min-w-0 flex-col gap-[2px]">
                <a
                  href={profileHref}
                  target="_blank"
                  rel="noopener nofollow"
                  className="truncate text-[21px] font-normal text-[#fafafa] no-underline"
                >
                  {username || "—"}
                </a>
                <h3 className="m-0 text-[13.5px] font-normal text-[#797979]">
                  {uid != null ? `UID ${uid.toLocaleString()}` : ""}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open quick menu"
              className="relative inline-flex cursor-pointer items-center justify-center p-1 text-[#797979] outline-none transition-colors hover:text-[#b6b6b6]"
            >
              <V3Icon name="dots" className="size-[45px]" />
            </button>
          </div>
        </div>
      </aside>
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} username={username} />
      <QuickMenu anchorRef={userCardRef} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
