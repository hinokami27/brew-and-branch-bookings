import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage, type TimeSlot } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoffeeChat & Code Review with Dragan" },
      { name: "description", content: "Book a coffee chat or code review session with Dragan — dev mentorship, one slot at a time." },
      { property: "og:title", content: "CoffeeChat & Code Review with Dragan" },
      { property: "og:description", content: "Book a dev mentorship session: coffee chats and code reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "guest" | "host";

function Index() {
  const [tab, setTab] = useState<Tab>("guest");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center">
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-xs tracking-widest text-neon">
          {"// dev mentorship, brewed fresh ☕"}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
          CoffeeChat <span className="text-muted-foreground">&</span> <span className="text-gradient">Code Review</span>
        </motion.h1>
        <p className="mt-3 text-muted-foreground">with Dragan · <span className="font-mono">git checkout -b better-code</span></p>
      </header>

      <div className="glass mx-auto mb-8 flex w-fit gap-1 rounded-full p-1">
        {(["guest", "host"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative rounded-full px-5 py-2 font-mono text-sm">
            {tab === t && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-gradient-neon glow" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
            <span className={`relative ${tab === t ? "text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
              {t === "guest" ? "book.a.slot()" : "host.dashboard()"}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
          {tab === "guest" ? <GuestView /> : <HostView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function useSlots() {
  return useQuery({ queryKey: ["slots"], queryFn: api.getSlots, retry: 1 });
}

function formatDate(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function sortSlots(s: TimeSlot[]) {
  return [...s].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

/* ---------------- HOST ---------------- */
function HostView() {
  const qc = useQueryClient();
  const slots = useSlots();
  const [form, setForm] = useState({ date: "", startTime: "", duration: 30 });
  const create = useMutation({
    mutationFn: api.createSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slots"] });
      setForm((f) => ({ ...f, startTime: "" }));
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate({ ...form, duration: Number(form.duration) }); }}
        className="glass h-fit space-y-4 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold">New slot <span className="font-mono text-xs text-neon">POST /slots</span></h2>
        <Field label="date">
          <input required type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="startTime">
          <input required type="time" className="field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </Field>
        <Field label="duration (min)">
          <input required type="number" min={5} step={5} className="field" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
        </Field>
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((d) => (
            <button type="button" key={d} onClick={() => setForm({ ...form, duration: d })}
              className={`flex-1 rounded-lg border py-1 font-mono text-xs transition ${form.duration === d ? "border-neon text-neon glow" : "text-muted-foreground hover:text-foreground"}`}>
              {d}m
            </button>
          ))}
        </div>
        {create.isError && <p className="text-sm text-destructive">{errorMessage(create.error)}</p>}
        <NeonButton type="submit" disabled={create.isPending} className="w-full">
          {create.isPending ? "Brewing…" : "+ Create slot"}
        </NeonButton>
      </form>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">All slots</h2>
          {slots.data && (
            <span className="font-mono text-xs text-muted-foreground">
              {slots.data.filter((s) => s.isBooked).length}/{slots.data.length} booked
            </span>
          )}
        </div>
        <SlotsState q={slots} emptyText="No slots yet. Create your first one to open the coffee bar.">
          {(data) => (
            <ul className="space-y-3">
              {sortSlots(data).map((s, i) => (
                <HostSlotRow key={s.id} s={s} i={i} />
              ))}
            </ul>
          )}
        </SlotsState>
      </section>
    </div>
  );
}

function HostSlotRow({ s, i }: { s: TimeSlot; i: number }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({ date: s.date, startTime: s.startTime, duration: s.duration });
  const refresh = () => qc.invalidateQueries({ queryKey: ["slots"] });
  const update = useMutation({
    mutationFn: () => api.updateSlot(s.id, { ...form, duration: Number(form.duration) }),
    onSuccess: () => { setEditing(false); refresh(); },
  });
  const del = useMutation({ mutationFn: () => api.deleteSlot(s.id), onSuccess: refresh });
  const err = update.error ?? del.error;

  return (
    <motion.li layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
      className="glass rounded-xl p-4">
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); update.mutate(); }} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <input required type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <input required type="time" className="field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <input required type="number" min={5} step={5} className="field" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing(false); setForm({ date: s.date, startTime: s.startTime, duration: s.duration }); }}
              className="rounded-lg border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">cancel</button>
            <NeonButton type="submit" disabled={update.isPending} className="!px-3 !py-1.5 text-xs">{update.isPending ? "Saving…" : "Save"}</NeonButton>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{formatDate(s.date)} · <span className="font-mono">{s.startTime}</span></p>
            <p className="font-mono text-xs text-muted-foreground">
              {s.duration} min{s.isBooked && s.guestName ? ` · ${s.guestName} <${s.guestEmail}>` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-full border px-3 py-1 font-mono text-xs ${s.isBooked ? "border-accent text-accent glow-2" : "border-neon text-neon glow"}`}>
              {s.isBooked ? "booked" : "available"}
            </span>
            {confirmDel ? (
              <>
                <button onClick={() => del.mutate()} disabled={del.isPending}
                  className="rounded-lg border border-destructive px-2.5 py-1 font-mono text-xs text-destructive hover:bg-destructive/10">
                  {del.isPending ? "…" : "delete?"}
                </button>
                <button onClick={() => setConfirmDel(false)} className="font-mono text-xs text-muted-foreground hover:text-foreground">no</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} aria-label="Edit slot" className="rounded-lg border px-2.5 py-1 font-mono text-xs text-muted-foreground hover:border-neon hover:text-neon">edit</button>
                <button onClick={() => setConfirmDel(true)} aria-label="Delete slot" className="rounded-lg border px-2.5 py-1 font-mono text-xs text-muted-foreground hover:border-destructive hover:text-destructive">del</button>
              </>
            )}
          </div>
        </div>
      )}
      {confirmDel && s.isBooked && !editing && <p className="mt-2 text-xs text-destructive">This slot is booked by {s.guestName ?? "a guest"}.</p>}
      {err && <p className="mt-2 text-sm text-destructive">{errorMessage(err)}</p>}
    </motion.li>
  );
}

/* ---------------- GUEST ---------------- */
function GuestView() {
  const slots = useSlots();
  const [selected, setSelected] = useState<TimeSlot | null>(null);
  return (
    <>
      <SlotsState q={slots} filter={(s) => !s.isBooked} emptyText="All slots are taken — the coffee pot is empty. Check back soon!">
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortSlots(data).map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }} className="glass group rounded-2xl p-5 transition hover:border-neon">
                <p className="font-mono text-xs text-neon">{formatDate(s.date)}</p>
                <p className="mt-1 font-mono text-3xl font-bold">{s.startTime}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.duration} min session</p>
                <NeonButton className="mt-5 w-full" onClick={() => setSelected(s)}>Book Slot</NeonButton>
              </motion.div>
            ))}
          </div>
        )}
      </SlotsState>
      <AnimatePresence>{selected && <BookingModal slot={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </>
  );
}

function BookingModal({ slot, onClose }: { slot: TimeSlot; onClose: () => void }) {
  const qc = useQueryClient();
  const [guestName, setName] = useState("");
  const [guestEmail, setEmail] = useState("");
  const book = useMutation({
    mutationFn: () => api.bookSlot(slot.id, { guestName, guestEmail }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
  });

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: "spring", bounce: 0.3 }}
        className="glass relative w-full max-w-md rounded-2xl bg-popover/80 p-6">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-3 text-xl text-muted-foreground hover:text-foreground">×</button>
        <AnimatePresence mode="wait">
          {book.isSuccess ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-neon text-3xl glow">☕</motion.div>
              <h3 className="text-2xl font-bold text-gradient">You're booked!</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{formatDate(slot.date)} · {slot.startTime} · {slot.duration} min</p>
              <div className="mt-5 rounded-xl border border-neon/40 bg-background/50 p-4 text-left">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neon">✨ AI message</p>
                <p className="whitespace-pre-line text-sm leading-relaxed">{book.data.aiConfirmationMessage}</p>
              </div>
              <NeonButton className="mt-6 w-full" onClick={onClose}>Done</NeonButton>
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0 }} onSubmit={(e) => { e.preventDefault(); book.mutate(); }} className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Grab this slot</h3>
                <p className="font-mono text-xs text-neon">{formatDate(slot.date)} · {slot.startTime} · {slot.duration} min</p>
              </div>
              <Field label="guestName"><input required className="field" value={guestName} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" /></Field>
              <Field label="guestEmail"><input required type="email" className="field" value={guestEmail} onChange={(e) => setEmail(e.target.value)} placeholder="ada@example.dev" /></Field>
              {book.isError && <p className="text-sm text-destructive">{errorMessage(book.error)}</p>}
              <NeonButton type="submit" disabled={book.isPending} className="w-full">
                {book.isPending ? "Generating your confirmation…" : "Confirm booking"}
              </NeonButton>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- shared ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NeonButton({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className={`rounded-xl bg-gradient-neon px-4 py-2.5 font-semibold text-primary-foreground transition hover:brightness-110 hover:glow active:scale-[0.98] disabled:opacity-60 ${className}`} />
  );
}

function SlotsState({ q, children, emptyText, filter }: {
  q: ReturnType<typeof useSlots>;
  children: (d: TimeSlot[]) => React.ReactNode;
  emptyText: string;
  filter?: (s: TimeSlot) => boolean;
}) {
  if (q.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass animate-pulse space-y-3 rounded-2xl p-5">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-28 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-10 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="glass rounded-2xl border-destructive/40 p-8 text-center">
        <p className="font-mono text-4xl">{"{ 503 }"}</p>
        <p className="mt-3 font-semibold">Backend is taking a coffee break</p>
        <NeonButton className="mt-5" onClick={() => q.refetch()}>Retry</NeonButton>
      </div>
    );
  }
  const data = filter ? q.data.filter(filter) : q.data;
  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-5xl">☕</motion.div>
        <p className="mt-4 font-mono text-sm text-neon">[ ]</p>
        <p className="mt-2 text-muted-foreground">{emptyText}</p>
      </div>
    );
  }
  return <>{children(data)}</>;
}
