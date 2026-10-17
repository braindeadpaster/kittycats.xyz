"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal, { modalPrimaryBtn } from "@/components/dashboard/modal";

const iconSvg = {
  pencil:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m10 21l4-4h8v4H10Zm8.3-12.075l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L18.3 8.925ZM16.85 10.4L6.25 21H2v-4.25l10.6-10.6l4.25 4.25Z"></path></svg>',
  message:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M2 8.76c0-2.715 0-4.073.879-4.916C3.757 3 5.172 3 8 3h8c2.828 0 4.243 0 5.121.844c.879.843.879 2.2.879 4.916v.96c0 2.715 0 4.073-.879 4.916c-.878.844-2.293.844-5.121.844h-3.25v2.36l5.487 1.757a.714.714 0 0 1 .475.91a.758.758 0 0 1-.95.456L12 19.119l-5.763 1.844a.757.757 0 0 1-.949-.456a.714.714 0 0 1 .475-.91l5.487-1.756V15.48H8c-2.828 0-4.243 0-5.121-.844C2 13.793 2 12.436 2 9.72z"></path></svg>',
  mail:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M3 21q-.825 0-1.412-.587T1 19V6.5h2V19h16.5v2zm4-4q-.825 0-1.412-.587T5 15V5q0-.825.588-1.412T7 3h14q.825 0 1.413.588T23 5v10q0 .825-.587 1.413T21 17zm7-4.7l7-4.875V5l-7 4.85L7 5v2.425z"></path></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M11.83 9L15 12.16V12a3 3 0 0 0-3-3zm-4.3.8l1.55 1.55c-.05.21-.08.42-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2M2 4.27l2.28 2.28l.45.45C3.08 8.3 1.78 10 1 12c1.73 4.39 6 7.5 11 7.5c1.55 0 3.03-.3 4.38-.84l.43.42L19.73 22L21 20.73L3.27 3M12 7a5 5 0 0 1 5 5c0 .64-.13 1.26-.36 1.82l2.93 2.93c1.5-1.25 2.7-2.89 3.43-4.75c-1.73-4.39-6-7.5-11-7.5c-1.4 0-2.74.25-4 .7l2.17 2.15C10.74 7.13 11.35 7 12 7"></path></svg>',
  info:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256" tabindex="0"><path fill="#ffffff" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 168a12 12 0 1 1 12-12a12 12 0 0 1-12 12m8-48.72v.72a8 8 0 0 1-16 0v-8a8 8 0 0 1 8-8c13.23 0 24-9 24-20s-10.77-20-24-20s-24 9-24 20v4a8 8 0 0 1-16 0v-4c0-19.85 17.94-36 40-36s40 16.15 40 36c0 17.38-13.76 31.93-32 35.28"></path></svg>',
  alias:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 36 36"><path fill="currentColor" d="M30.61 24.52a17.16 17.16 0 0 0-25.22 0a1.51 1.51 0 0 0-.39 1v6A1.5 1.5 0 0 0 6.5 33h23a1.5 1.5 0 0 0 1.5-1.5v-6a1.51 1.51 0 0 0-.39-.98"></path><path fill="currentColor" d="M18 17a7 7 0 0 0 6.85-5.56a7.4 7.4 0 0 1-2.24-6.69A7 7 0 1 0 18 17"></path><circle cx="30" cy="6" r="5" fill="currentColor"></circle><path fill="none" d="M0 0h36v36H0z"></path></svg>',
  monitor:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M4 6q0-.825.588-1.412T6 4h12q.825 0 1.413.588T20 6v8q0 .825-.587 1.413T18 16H6q-.825 0-1.412-.587T4 14zm2 0v8h12V6zm1 14q-.425 0-.712-.288T6 19t.288-.712T7 18h10q.425 0 .713.288T18 19t-.288.713T17 20zm4-7.5l4.5-3L11 6.5z"></path></svg>',
  discord:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"></path></svg>',
  gift: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512"><path fill="none" d="M346 110a34 34 0 0 0-68 0v34h34a34 34 0 0 0 34-34m-112 0a34 34 0 1 0-34 34h34Z"></path><path fill="currentColor" d="M234 144h44v112h164a22 22 0 0 0 22-22v-68a22 22 0 0 0-22-22h-59.82A77.95 77.95 0 0 0 256 55.79A78 78 0 0 0 129.81 144H70a22 22 0 0 0-22 22v68a22 22 0 0 0 22 22h164Zm44-34a34 34 0 1 1 34 34h-34Zm-112 0a34 34 0 1 1 68 0v34h-34a34 34 0 0 1-34-34m112 370h132a22 22 0 0 0 22-22V288H278ZM80 458a22 22 0 0 0 22 22h132V288H80Z"></path></svg>',
  logout:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"></path></svg>',
  trash:
    '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5q0-.425.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5q0 .425-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8q-.425 0-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8q-.425 0-.712.288T13 9v7q0 .425.288.713T14 17"></path></svg>',
};

const actionBase =
  "block w-full cursor-pointer rounded-lg border-2 border-[#202020] bg-[#191919] px-[10px] py-[10px] text-center text-[#fafafa] no-underline transition-all duration-250 hover:border-[#323232] active:translate-y-[4px]";

interface AliasRow {
  id: string;
  alias: string;
  createdAt: string;
}

export default function SettingsClient({
  username,
  displayName,
  email,
}: {
  username: string;
  displayName: string;
  email: string;
}) {
  const router = useRouter();
  const [showEmail, setShowEmail] = useState(false);

  const [usernameOpen, setUsernameOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(username);
  const [displayDraft, setDisplayDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [slots, setSlots] = useState(1);
  const [isPremium, setIsPremium] = useState(false);
  const [aliasDraft, setAliasDraft] = useState("");
  const [aliasBusy, setAliasBusy] = useState(false);
  const [aliasesLoading, setAliasesLoading] = useState(false);

  useEffect(() => {
    if (!aliasOpen) return;
    setAliasesLoading(true);
    fetch("/api/aliases")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setAliases(d.aliases ?? []);
          setSlots(d.slots ?? 1);
          setIsPremium(!!d.isPremium);
        }
      })
      .catch(() => {})
      .finally(() => setAliasesLoading(false));
  }, [aliasOpen]);

  async function saveAccount(fields: Record<string, string>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not save.");
      setUsernameOpen(false);
      setDisplayOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function createAlias() {
    if (!aliasDraft.trim()) return;
    setAliasBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: aliasDraft.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not create alias.");
      setAliases((a) => [...a, data.alias]);
      setAliasDraft("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create alias.");
    } finally {
      setAliasBusy(false);
    }
  }

  async function deleteAlias(id: string) {
    setAliasBusy(true);
    try {
      await fetch(`/api/aliases?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setAliases((a) => a.filter((x) => x.id !== id));
      router.refresh();
    } finally {
      setAliasBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 text-center md:px-0">
      <h1 className="m-0 font-[500] text-[#fafafa]">Account Settings</h1>

      <div className="mt-[50px] flex flex-col gap-[40px]">
        {/* General Information */}
        <section>
          <h1 className="m-0 text-left text-[20px] font-[450] text-[#e6e6e6]">
            General Information
          </h1>
          <div className="mt-[20px] flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[13px] rounded-lg bg-[#151515] p-[15px] text-left">
              <div className="w-full">
                <h1 className="m-0 mb-[5.5px] ml-[3px] text-[16px] font-[500] text-[#dddddd]">
                  Username
                </h1>
                <div className="relative flex items-center rounded-lg">
                  <span className="absolute left-[8px] z-10 flex items-center text-[25px] text-[#666666]">
                    <span
                      className="inline-flex [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: iconSvg.pencil }}
                    />
                  </span>
                  <input
                    autoCorrect="off"
                    readOnly
                    type="text"
                    value={username}
                    onClick={() => {
                      setUsernameDraft(username);
                      setError(null);
                      setUsernameOpen(true);
                    }}
                    className="w-full cursor-pointer rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none transition-[0.3s] select-text hover:border-[#2a2a2a] focus:border-pink-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameDraft(username);
                    setError(null);
                    setUsernameOpen(true);
                  }}
                  className="mt-2 w-full cursor-pointer rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[14px] font-medium text-[#fafafa] transition hover:border-[#3a3a3a] hover:bg-[#202020]"
                >
                  Change Username
                </button>
                <p className="m-0 mt-1.5 ml-1 text-[13px] text-[#8a8a8a]">You can change your username now</p>
              </div>
              <div className="w-full">
                <h1 className="m-0 mb-[5.5px] ml-[3px] text-[16px] font-[500] text-[#dddddd]">
                  Display Name
                </h1>
                <div className="relative flex items-center rounded-lg">
                  <span className="absolute left-[8px] z-10 flex items-center text-[25px] text-[#666666]">
                    <span
                      className="inline-flex [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: iconSvg.message }}
                    />
                  </span>
                  <input
                    autoCorrect="off"
                    readOnly
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onClick={() => {
                      setDisplayDraft(displayName);
                      setError(null);
                      setDisplayOpen(true);
                    }}
                    className="w-full cursor-pointer rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none transition-[0.3s] select-text hover:border-[#2a2a2a] focus:border-pink-500/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayDraft(displayName);
                    setError(null);
                    setDisplayOpen(true);
                  }}
                  className="mt-2 w-full cursor-pointer rounded-md border-2 border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[14px] font-medium text-[#fafafa] transition hover:border-[#3a3a3a] hover:bg-[#202020]"
                >
                  Change Display Name
                </button>
              </div>
              <div>
                <div className="mb-[5.5px] ml-[3px]">
                  <h1 className="m-0 flex items-center gap-[4px] text-[16px] font-[500] text-[#dddddd]">
                    Alias
                    <span
                      className="relative inline-flex cursor-help items-center justify-center text-[18px] text-[#bdbdbd]"
                      title="Use alias credits to create extra usernames that redirect to your main profile."
                    >
                      <span
                        className="inline-flex [&>svg]:block"
                        dangerouslySetInnerHTML={{ __html: iconSvg.info }}
                      />
                    </span>
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAliasOpen(true);
                  }}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-lg border-2 border-[#191919] bg-[#131313] p-[9px_14px] text-[14px] font-[500] text-[#f2f2f2] transition-[0.25s] select-none hover:border-[#1d1d1d] hover:bg-[#181818] active:translate-y-[4px]"
                >
                  <span className="inline-flex text-[19px] [&>svg]:block">
                    <span dangerouslySetInnerHTML={{ __html: iconSvg.alias }} />
                  </span>
                  Open Alias Manager
                </button>
              </div>
              <div className="w-full">
                <h1 className="m-0 mb-[5.5px] ml-[3px] text-[16px] font-[500] text-[#dddddd]">
                  Email
                </h1>
                <div className="relative flex items-center rounded-lg">
                  <span className="absolute left-[8px] z-10 flex items-center text-[25px] text-[#666666]">
                    <span
                      className="inline-flex [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: iconSvg.mail }}
                    />
                  </span>
                  <p
                    className="absolute right-[15px] z-10 m-0 flex cursor-pointer rounded-md p-[5px] text-[20px] text-[#bbbbbb] transition-[0.3s] hover:bg-[#fafafa23] active:translate-y-[3px]"
                    onClick={() => setShowEmail((v) => !v)}
                  >
                    <span
                      className="inline-flex [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: iconSvg.eye }}
                    />
                  </p>
                  <input
                    autoCorrect="off"
                    readOnly
                    maxLength={72}
                    type={showEmail ? "text" : "password"}
                    value={email}
                    className="w-full rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_47px_10px_40px] text-[15px] text-[#eee] outline-none transition-[0.3s] select-text hover:border-[#191919] focus:border-pink-500/60"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section>
          <h1 className="m-0 text-left text-[20px] font-[450] text-[#e6e6e6]">
            Security Settings
          </h1>
          <div className="mt-[20px] flex flex-col gap-[20px]">
            <div className="flex flex-col items-stretch gap-[13px] rounded-lg bg-[#151515] p-[15px] text-left">
              <div>
                <h1 className="m-0 text-[20px] font-[500] text-[#fafafa]">
                  Active sessions
                </h1>
                <h3 className="m-0 mt-[5px] text-[15px] font-[450] text-[#979797]">
                  Review every device currently signed in to your account and
                  invalidate sessions you do not recognize.
                </h3>
              </div>
              <button
                type="button"
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-md border-2 border-[#202020] bg-[#1a1a1a] p-[9px_13px] text-[14px] font-[600] whitespace-nowrap text-[#f0f0f0] transition-[0.25s] hover:border-[#333333] hover:bg-[#1f1f1f] active:translate-y-[2px]"
              >
                <span className="inline-flex text-[18px] [&>svg]:block">
                  <span dangerouslySetInnerHTML={{ __html: iconSvg.monitor }} />
                </span>
                Session Management
              </button>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h1 className="m-0 text-left text-[20px] font-[450] text-[#e6e6e6]">
            Account Actions
          </h1>
          <div className="mt-[20px]">
            <div className="flex flex-col gap-[13px] rounded-lg bg-[#151515] p-[15px] text-left">
              <div className="flex flex-col gap-[13px]">
                <span className={actionBase}>Change Email</span>
                <div>
                  <h1 className="m-0 mb-[8px] ml-[3px] text-[16px] font-[500] text-[#989898]">
                    By changing your password, you will be logged out of every
                    device.
                  </h1>
                  <span className={actionBase}>Change Password</span>
                </div>
                <a
                  href="/logout"
                  className={`${actionBase} flex items-center justify-center gap-[4px] border-[#ff000033] bg-[#ff000044] leading-[1] hover:border-[#ff000055]`}
                >
                  <span className="inline-flex text-[22px] [&>svg]:block">
                    <span dangerouslySetInnerHTML={{ __html: iconSvg.logout }} />
                  </span>
                  Logout
                </a>
                <div>
                  <span
                    className={`${actionBase} flex items-center justify-center gap-[4px] border-[#ff000033] bg-[#ff000044] leading-[1] hover:border-[#ff000055]`}
                  >
                    <span className="inline-flex text-[22px] [&>svg]:block">
                      <span
                        dangerouslySetInnerHTML={{ __html: iconSvg.trash }}
                      />
                    </span>
                    Delete Account
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={usernameOpen}
        onClose={() => setUsernameOpen(false)}
        title="Change Username"
        subtitle="You can change your username now"
      >
              <h1 className="m-0 mb-2 ml-1 text-[15px] font-medium text-[#ddd]">Username</h1>
              <div className="relative flex items-center">
                <span className="absolute left-[8px] text-[22px] text-[#666]">
                  <span className="inline-flex [&>svg]:block" dangerouslySetInnerHTML={{ __html: iconSvg.pencil }} />
                </span>
                <input
                  autoCorrect="off"
                  placeholder="Username"
                  maxLength={16}
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  className="w-full rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none focus:border-pink-500/60"
                />
              </div>
              {error ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p> : null}
              <p className="m-0 mt-2 text-[13px] text-[#8a8a8a]">You can change your username now</p>
              <button
                type="button"
                disabled={saving || !usernameDraft.trim()}
                onClick={() => saveAccount({ username: usernameDraft.trim() })}
                className={`${modalPrimaryBtn} mt-3 w-full`}
              >
                {saving ? "Saving…" : "Change Username"}
              </button>
      </Modal>

      <Modal
        open={displayOpen}
        onClose={() => setDisplayOpen(false)}
        title="Change Display Name"
        subtitle="Shown on your profile instead of your username."
      >
              <h1 className="m-0 mb-2 ml-1 text-[15px] font-medium text-[#ddd]">Display Name</h1>
              <div className="relative flex items-center">
                <span className="absolute left-[8px] text-[22px] text-[#666]">
                  <span className="inline-flex [&>svg]:block" dangerouslySetInnerHTML={{ __html: iconSvg.message }} />
                </span>
                <input
                  autoCorrect="off"
                  placeholder="Display Name"
                  maxLength={40}
                  value={displayDraft}
                  onChange={(e) => setDisplayDraft(e.target.value)}
                  className="w-full rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none focus:border-pink-500/60"
                />
              </div>
              {error ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p> : null}
              <button
                type="button"
                disabled={saving}
                onClick={() => saveAccount({ displayName: displayDraft })}
                className={`${modalPrimaryBtn} mt-3 w-full`}
              >
                {saving ? "Saving…" : "Change Display Name"}
              </button>
      </Modal>

      <Modal
        open={aliasOpen}
        onClose={() => setAliasOpen(false)}
        title="Manage Aliases"
        subtitle="Extra usernames that redirect to your main profile."
        maxWidth="max-w-[36rem]"
      >
              {aliasesLoading ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-[30px] w-[150px] animate-pulse rounded-full bg-[#1c1c1c]" />
                    <div className="h-[30px] w-[150px] animate-pulse rounded-full bg-[#1c1c1c]" />
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-[58px] w-full animate-pulse rounded-md bg-[#1c1c1c]" />
                    ))}
                  </div>
                </>
              ) : (
                <>
              <h1 className="m-0 text-[18px] font-semibold">Alias Manager</h1>
              <h3 className="m-0 mt-1 text-[14px] font-normal text-[#a1a1a1]">
                Use alias credits to create extra usernames that redirect to your main profile.
              </h3>
              <a href="/dashboard/premium" className="mt-3 block rounded-lg border-2 border-pink-500/60 bg-pink-600 p-3 text-center text-[14px] font-medium text-white no-underline">
                Upgrade to Premium for {5} Alias slots
              </a>
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[#d7a2e6]">
                  {Math.max(0, slots - aliases.length)} Credits Available
                </span>
                <span className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-[#c9c9c9]">
                  {aliases.length}/{slots} Alias Slots Used
                </span>
                {isPremium ? (
                  <span className="rounded-full border border-pink-500/60 bg-pink-600 px-3 py-1 text-white">Premium</span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {aliases.length === 0 ? (
                  <div className="rounded-md border border-[#1e1e1e] bg-[#0e0e0e] p-4 text-center text-[14px] text-[#8a8a8a]">
                    No aliases yet. Create your first alias below.
                  </div>
                ) : (
                  aliases.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-[#1e1e1e] bg-[#0e0e0e] p-3">
                      <a
                        href={`/${encodeURIComponent(a.alias)}`}
                        target="_blank"
                        rel="noopener nofollow"
                        className="m-0 min-w-0 flex-1 truncate text-[15px] font-semibold text-white no-underline transition hover:text-[#d7a2e6]"
                      >
                        {typeof window !== "undefined" ? window.location.host : "egirls.lol"}/{a.alias}
                      </a>
                      <button
                        type="button"
                        disabled={aliasBusy}
                        onClick={() => deleteAlias(a.id)}
                        className="shrink-0 cursor-pointer rounded-md border-2 border-[#3a1d1d] bg-[#2a1515] px-4 py-1.5 text-[13px] font-semibold text-[#f87171] transition hover:bg-[#3a1d1d] disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <h1 className="m-0 mb-2 ml-1 text-[15px] font-medium text-[#ddd]">Create a new alias</h1>
                <div className="relative flex items-center">
                  <span className="absolute left-[8px] text-[22px] text-[#666]">
                    <span className="inline-flex [&>svg]:block" dangerouslySetInnerHTML={{ __html: iconSvg.alias }} />
                  </span>
                  <input
                    autoCorrect="off"
                    placeholder="Alias"
                    maxLength={16}
                    value={aliasDraft}
                    onChange={(e) => setAliasDraft(e.target.value)}
                    className="w-full rounded-lg border-2 border-transparent bg-[#0c0c0c] p-[10px_12px_10px_40px] text-[15px] text-[#eee] outline-none focus:border-pink-500/60"
                  />
                </div>
                {error ? <p className="m-0 mt-2 text-[13px] text-[#f87171]">{error}</p> : null}
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={aliasBusy || !aliasDraft.trim() || aliases.length >= slots}
                    onClick={createAlias}
                    className={`${modalPrimaryBtn} w-full`}
                  >
                    {aliasBusy ? "Saving…" : "Create Alias"}
                  </button>
                </div>
              </div>
              </>
              )}
      </Modal>
    </div>
  );
}
