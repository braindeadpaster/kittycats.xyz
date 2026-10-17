"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BadgeIcon from "@/components/badge-icon";
import Tooltip from "@/components/ui/tooltip";
import { PickerBody } from "@/components/dashboard/appearance/colors-tab";
import Modal, { modalPrimaryBtn } from "@/components/dashboard/modal";
import {
  btnNeutral,
  cardClass,
  ToggleCard,
} from "@/components/dashboard/ui";

interface Badge {
  id: string;
  name: string;
  iconPrefix: string;
  iconName: string;
  iconUrl: string | null;
  color: string;
  position?: number;
  hidden?: boolean;
  glow?: boolean;
}

const badgeCardClass = cardClass.replace("rounded-3xl", "rounded-md");

/* ---------------- sortable badge row ---------------- */

function SortableBadgeRow({
  badge,
  onEdit,
  onToggleHidden,
  dragEnabled,
}: {
  badge: Badge;
  onEdit: () => void;
  onToggleHidden: () => void;
  dragEnabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: badge.id, disabled: !dragEnabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="bg-foreground/10 flex shrink-0 items-center rounded-md p-1"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={dragEnabled ? `Drag ${badge.name}` : "Reordering requires premium"}
        disabled={!dragEnabled}
        className={`grid h-full shrink-0 px-2 py-2 duration-200 ${
          dragEnabled
            ? "text-muted-foreground hover:text-foreground cursor-grab touch-none place-content-center"
            : "cursor-not-allowed place-content-center text-muted-foreground/40"
        }`}
      >
        {dragEnabled ? (
        <svg
          className="size-[18px]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="9" cy="6" r="1.4" />
          <circle cx="15" cy="6" r="1.4" />
          <circle cx="9" cy="12" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="9" cy="18" r="1.4" />
          <circle cx="15" cy="18" r="1.4" />
        </svg>
        ) : (
        <Tooltip label="Reordering requires premium">
        <svg
          className="size-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        </Tooltip>
        )}
      </button>

      <div className={`${badgeCardClass} w-full ${isDragging ? "opacity-60" : ""}`}>
        <div
          data-hidden={!!badge.hidden}
          className="data-[hidden=true]:opacity-50 flex flex-row justify-between gap-4 rounded-md p-2.5 sm:items-center"
        >
          <div className="border-foreground/2.5 bg-foreground/5 text-foreground grid shrink-0 place-content-center rounded-lg border p-1 duration-300">
            <Tooltip label={badge.name}>
              <BadgeIcon
                prefix={badge.iconPrefix}
                name={badge.iconName}
                url={badge.iconUrl ?? undefined}
                style={{
                  color: badge.color,
                  width: 18,
                  height: 18,
                  filter:
                    badge.glow === false
                      ? "none"
                      : `drop-shadow(0 0 3px ${badge.color})`,
                }}
              />
            </Tooltip>
          </div>
          <div className="flex w-full items-center justify-between gap-2 pr-1">
            <div className="text-foreground font-semibold">{badge.name}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${badge.name}`}
                title="Change color"
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-neutral-700 bg-neutral-800 text-foreground transition-colors hover:border-neutral-600 hover:bg-neutral-700"
              >
                <svg
                  className="size-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onToggleHidden}
                aria-label={badge.hidden ? `Show ${badge.name}` : `Hide ${badge.name}`}
                title={badge.hidden ? "Show badge" : "Hide badge"}
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-neutral-700 bg-neutral-800 text-foreground transition-colors hover:border-neutral-600 hover:bg-neutral-700"
              >
                {badge.hidden ? (
                  <svg
                    className="size-[18px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                    <path d="m2 2 20 20" />
                  </svg>
                ) : (
                  <svg
                    className="size-[18px]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function BadgesClient({ isPremium = false }: { isPremium?: boolean }) {
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [others, setOthers] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"owned" | "other">("owned");
  const [saving, setSaving] = useState(false);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeDraft, setCustomizeDraft] = useState<{
    color: string;
    glow: boolean;
  } | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    badge: Badge;
    color: string;
    glow: boolean;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/badges", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setBadges(data.badges ?? []);
      setOthers(data.others ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(async (updates: Array<Record<string, unknown>>) => {
    const res = await fetch("/api/profile/badges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    return res.ok;
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!isPremium) return;
      const { active, over } = event;
      if (!over || active.id === over.id || !badges) return;
      const oldIndex = badges.findIndex((b) => b.id === active.id);
      const newIndex = badges.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(badges, oldIndex, newIndex);
      setBadges(next);
      patch(next.map((b, i) => ({ badgeId: b.id, position: i })));
    },
    [badges, patch, isPremium]
  );

  const toggleHidden = useCallback(
    (badge: Badge) => {
      const next = !badge.hidden;
      setBadges(
        (bs) =>
          bs
            ? bs.map((b) => (b.id === badge.id ? { ...b, hidden: next } : b))
            : bs
      );
      patch([{ badgeId: badge.id, hidden: next }]);
    },
    [patch]
  );

  const openCustomize = () => {
    if (!badges || badges.length === 0) return;
    setCustomizeDraft({
      color: badges[0].color,
      glow: isPremium ? badges.every((b) => b.glow !== false) : true,
    });
    setCustomizeOpen(true);
  };

  const openEdit = (badge: Badge) => {
    setEditDraft({
      badge,
      color: badge.color,
      glow: isPremium ? badge.glow !== false : true,
    });
    setEditOpen(true);
  };

  const saveCustomize = async () => {
    if (!customizeDraft || !badges) return;
    setSaving(true);
    try {
      await patch(
        badges.map((b) => ({
          badgeId: b.id,
          color: customizeDraft.color,
          glow: isPremium ? customizeDraft.glow : true,
        }))
      );
      await load();
    } finally {
      setSaving(false);
      setCustomizeOpen(false);
    }
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    setSaving(true);
    try {
      await patch([
        {
          badgeId: editDraft.badge.id,
          color: editDraft.color,
          glow: isPremium ? editDraft.glow : true,
        },
      ]);
      await load();
    } finally {
      setSaving(false);
      setEditOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-md p-1">
          <button
            type="button"
            onClick={() => setTab("owned")}
            className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              tab === "owned"
                ? "bg-accent text-foreground"
                : "hover:text-foreground"
            }`}
          >
            Owned
          </button>
          <button
            type="button"
            onClick={() => setTab("other")}
            className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              tab === "other"
                ? "bg-accent text-foreground"
                : "hover:text-foreground"
            }`}
          >
            Other
          </button>
        </div>

        <button
          type="button"
          onClick={openCustomize}
          disabled={!badges || badges.length === 0}
          className={`${btnNeutral} h-10 px-4 w-fit`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          Unify color
        </button>
      </div>

      {tab === "owned" ? (
        loading || badges === null ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-foreground/10 h-16 animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <div className={`${badgeCardClass} rounded-md px-6 py-14 text-center`}>
            <p className="text-foreground text-base font-semibold">
              No Badges Found
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              You don&apos;t own any badges yet.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={badges.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {badges.map((badge) => (
                  <SortableBadgeRow
                    key={badge.id}
                    badge={badge}
                    onEdit={() => openEdit(badge)}
                    onToggleHidden={() => toggleHidden(badge)}
                    dragEnabled={isPremium}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-foreground/10 h-16 animate-pulse rounded-md"
            />
          ))}
        </div>
      ) : others.length === 0 ? (
        <div className={`${badgeCardClass} rounded-md px-6 py-14 text-center`}>
          <p className="text-foreground text-base font-semibold">
            No Other Badges
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            There are no other badges right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {others.map((badge) => (
            <div
              key={badge.id}
              className="bg-foreground/10 flex items-center rounded-md p-1 opacity-60 select-none"
            >
              <div className={`${badgeCardClass} w-full`}>
                <div className="flex flex-row justify-between gap-4 rounded-md p-2.5 sm:items-center">
                  <div className="border-foreground/2.5 bg-foreground/5 text-foreground grid shrink-0 place-content-center rounded-lg border p-1 duration-300">
                    <Tooltip label={badge.name}>
                      <BadgeIcon
                        prefix={badge.iconPrefix}
                        name={badge.iconName}
                        url={badge.iconUrl ?? undefined}
                        style={{ color: badge.color, width: 18, height: 18 }}
                      />
                    </Tooltip>
                  </div>
                  <div className="flex w-full items-center justify-between gap-2 pr-1">
                    <div className="text-foreground font-semibold">
                      {badge.name}
                    </div>
                    <svg
                      className="text-muted-foreground h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customize popup — one color + glow for every badge */}
      <Modal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title="One color for all badges"
        subtitle="Pick a color — it applies to every badge at once."
        maxWidth="max-w-sm"
      >
        {customizeDraft && (
          <div>
            <PickerBody
              label="Badge Color"
              description="Applies to all of your badges."
              value={customizeDraft.color}
              onChange={(v) =>
                setCustomizeDraft((d) => (d ? { ...d, color: v } : d))
              }
              onClose={() => setCustomizeOpen(false)}
              showHeader={false}
              showDone={false}
            />

            <div className="mt-5">
              {isPremium ? (
                <ToggleCard
                  label="Glow badges"
                  checked={customizeDraft.glow}
                  onCheckedChange={(v) =>
                    setCustomizeDraft((d) => (d ? { ...d, glow: v } : d))
                  }
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={saveCustomize}
              disabled={saving}
              className={`${modalPrimaryBtn} mt-3 w-full`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </Modal>

      {/* Per-badge popup — that badge's color + its own glow */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editDraft?.badge.name ?? "Edit Badge"}
        subtitle="Change this badge's color and glow."
        maxWidth="max-w-sm"
      >
        {editDraft && (
          <div>
            <PickerBody
              label="Badge Color"
              description="Only this badge changes."
              value={editDraft.color}
              onChange={(v) =>
                setEditDraft((d) => (d ? { ...d, color: v } : d))
              }
              onClose={() => setEditOpen(false)}
              showHeader={false}
              showDone={false}
            />

            <div className="mt-5">
              {isPremium ? (
                <ToggleCard
                  label="Glow badge"
                  checked={editDraft.glow}
                  onCheckedChange={(v) =>
                    setEditDraft((d) => (d ? { ...d, glow: v } : d))
                  }
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className={`${modalPrimaryBtn} mt-3 w-full`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
