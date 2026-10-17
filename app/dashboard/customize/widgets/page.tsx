import DashboardShell from "@/components/dashboard/shell";
import CustomizeNav from "@/components/dashboard/customize-nav";
import WidgetsClient from "./client";
import { getSession } from "@/lib/auth";
import { getWidgets } from "@/lib/widgets";

export const metadata = {
  title: "Widgets — egirls.lol",
};

export default async function CustomizeWidgetsPage() {
  const session = await getSession();
  if (!session) return null;

  let widgets: Awaited<ReturnType<typeof getWidgets>> = [];
  try {
    widgets = await getWidgets(session.id);
  } catch {
    widgets = [];
  }

  return (
    <DashboardShell
      title="Widgets"
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11.576 1.424a.6.6 0 0 1 .848 0l10.152 10.152a.6.6 0 0 1 0 .848L12.424 22.576a.6.6 0 0 1-.848 0L1.424 12.424a.6.6 0 0 1 0-.848z" />
          <path d="M12 8h.01" />
          <path d="M12 12v4" />
        </svg>
      }
      subnav={<CustomizeNav />}
      maxWidth="max-w-7xl"
    >
      <WidgetsClient widgets={widgets} />
    </DashboardShell>
  );
}
