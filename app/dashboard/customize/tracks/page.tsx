import DashboardShell from "@/components/dashboard/shell";
import CustomizeNav from "@/components/dashboard/customize-nav";
import { Card, CardContent } from "@/components/dashboard/ui";

export const metadata = {
  title: "Tracks — egirls.lol",
};

export default function CustomizeTracksPage() {
  return (
    <DashboardShell
      title="Tracks"
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
          <circle cx="8" cy="18" r="4" />
          <path d="M12 18V2l7 4" />
        </svg>
      }
      subnav={<CustomizeNav />}
      maxWidth="max-w-4xl"
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="border-foreground/5 bg-input/30 grid size-14 place-items-center rounded-lg border">
            <svg
              className="text-muted-foreground size-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="18" r="4" />
              <path d="M12 18V2l7 4" />
            </svg>
          </div>
          <div className="max-w-sm">
            <p className="text-foreground text-base font-medium">No Tracks Found</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Tracks let you pin music to your profile page.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
