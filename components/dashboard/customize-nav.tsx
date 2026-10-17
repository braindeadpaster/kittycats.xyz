"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Profile", href: "/dashboard/customize/profile" },
  { label: "Appearance", href: "/dashboard/customize/appearance" },
  { label: "Links", href: "/dashboard/links" },
  { label: "Badges", href: "/dashboard/badges" },
  { label: "Widgets", href: "/dashboard/customize/widgets" },
  { label: "Tracks", href: "/dashboard/customize/tracks" },
];

export default function CustomizeNav() {
  const pathname = usePathname();

  return (
    <nav className="px-4 pt-1.5 lg:border-b lg:pt-3">
      <ul className="flex flex-row flex-wrap items-center gap-2 lg:min-w-max lg:flex-nowrap lg:overflow-x-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="relative pb-1.5 lg:pb-2">
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md border-b border-b-transparent px-3 py-1.5 text-sm font-semibold duration-300 ${
                  isActive
                    ? "lg:hover:bg-foreground/5 hover:text-foreground lg:bg-foreground/5 text-foreground"
                    : "text-muted-foreground lg:hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
              {isActive ? (
                <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-pink-500" />
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
