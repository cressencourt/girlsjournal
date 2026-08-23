import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Home, Calendar, Palette, Star, Smile, Apple, BookOpen, Lightbulb,
  ClipboardList, Plus, X, Check, Sun, Cloud, Heart, Sparkles, Menu,
  ChevronLeft, ChevronRight, Clock, MapPin, Trash2, Pencil, Moon,
  CloudRain, Meh, Frown, PartyPopper, Flower2, CircleDot, WifiOff
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

// The whole journal is stored as one JSON document in a single Supabase
// row (table `journal_data`, row id = 1). Simple, robust, and realtime-
// friendly — see supabase/schema.sql if you'd rather split it into the
// fully relational tables (users, girls, activities, ...).
const TABLE = "journal_data";
const ROW_ID = 1;
const uid = () => Math.random().toString(36).slice(2, 10);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ACTIVITY_CATEGORIES = [
  { key: "Creative", emoji: "🎨" },
  { key: "Outdoor", emoji: "🌳" },
  { key: "Educational", emoji: "📚" },
  { key: "Cooking", emoji: "🍪" },
  { key: "Sports", emoji: "⚽" },
  { key: "Music", emoji: "🎵" },
  { key: "Culture", emoji: "🎭" },
  { key: "At home", emoji: "🏠" },
  { key: "Other", emoji: "🌈" },
];

const MOODS = [
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "calm", emoji: "😐", label: "Calm" },
  { key: "sleepy", emoji: "😴", label: "Sleepy" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "excited", emoji: "🤩", label: "Excited" },
];

const FOOD_RATINGS = [
  { key: "love", emoji: "❤️", label: "Love it" },
  { key: "like", emoji: "🙂", label: "Like it" },
  { key: "okay", emoji: "😐", label: "It's okay" },
  { key: "dislike", emoji: "🙅", label: "Don't like it" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function prettyDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
function shortDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function weekDayName(iso) {
  const d = new Date(iso + "T00:00:00");
  return DAYS[(d.getDay() + 6) % 7];
}

/* ------------------------------------------------------------------ */
/*  Default sample data                                                */
/* ------------------------------------------------------------------ */

function defaultData() {
  const today = new Date();
  const iso = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  return {
    girls: [
      {
        id: "girl1",
        name: "Girl 1",
        age: 6,
        avatar: "🌷",
        color: "rose",
        personality: "Curious, chatty, loves to lead the way. Gets shy the first five minutes then never stops talking.",
        likes: "Drawing, unicorns, jumping in puddles, being the big sister",
        dislikes: "Loud noises, having her hair brushed, losing at games",
      },
      {
        id: "girl2",
        name: "Girl 2",
        age: 4,
        avatar: "🌻",
        color: "amber",
        personality: "Sweet, dreamy, very affectionate. Needs a bit more time to warm up to new activities.",
        likes: "Stuffed animals, music, helping in the kitchen, bubbles",
        dislikes: "Being rushed, spicy food, the vacuum cleaner",
      },
    ],

    routines: {
      girl1: {
        morning: "Wake up 7:15, breakfast, get dressed, brush teeth. Likes to pick her own outfit.",
        afterSchool: "Snack + free play for 30 min before homework.",
        homework: "16:30–17:00, needs a quiet room, likes to be timed.",
        playTime: "Outside if possible, otherwise drawing or Lego.",
        dinner: "18:30, eats better with her sister at the table.",
        bath: "19:15, prefers a bath to a shower.",
        bedtime: "Story + night light, lights out 20:00.",
      },
      girl2: {
        morning: "Wake up 7:15, slower to get going, needs reminders.",
        afterSchool: "Naps sometimes if very tired — okay until 30 min.",
        homework: "No homework yet, quiet drawing time instead.",
        playTime: "Loves pretend play, kitchen set, dress-up.",
        dinner: "18:30, small portions, ask before seconds.",
        bath: "19:15, shared bath with sister, needs help washing hair.",
        bedtime: "Lullaby + two books, lights out 20:00.",
      },
    },

    important: {
      allergies: "Girl 2 is allergic to peanuts — no peanut butter, satay sauce, or products with 'may contain nuts'.",
      restrictions: "No fizzy drinks during the week.",
      shouldntDo: "No screens before homework is finished. No unsupervised trampoline.",
      permission: "Ask a parent before any playdates outside the usual friends, and before swimming.",
      screenTime: "Max 30 minutes/day, after homework, no screens after dinner.",
      bedtimeRules: "Lights out at 20:00 sharp on school nights, 20:30 on weekends.",
      reminders: "Spare inhaler for Girl 1 is in the yellow bag by the front door.",
    },

    schedule: {
      [weekDayName(iso(0))]: [
        { id: uid(), time: "15:30", activity: "Pick up from school", location: "School gate", girl: "Both", notes: "" },
        { id: uid(), time: "16:00", activity: "Snack", location: "Kitchen", girl: "Both", notes: "Fruit, not biscuits" },
        { id: uid(), time: "16:30", activity: "Park", location: "Green Park", girl: "Both", notes: "Bring scooters" },
        { id: uid(), time: "18:00", activity: "Dinner", location: "Home", girl: "Both", notes: "" },
      ],
    },

    activities: [
      {
        id: uid(),
        date: iso(-1),
        title: "Painting rainbows",
        girls: ["girl1", "girl2"],
        category: "Creative",
        location: "Kitchen table",
        duration: "45 min",
        description: "Watercolour rainbows and clouds after school.",
        learned: "Mixing blue and red to make purple",
        loved: "Using the big paintbrushes",
        rating: 5,
        photo: "",
      },
      {
        id: uid(),
        date: iso(-2),
        title: "Baking banana muffins",
        girls: ["girl2"],
        category: "Cooking",
        location: "Home",
        duration: "1 hour",
        description: "Made muffins together, she mashed the bananas herself.",
        learned: "Cracking an egg without shell bits",
        loved: "Licking the spoon",
        rating: 5,
        photo: "",
      },
    ],

    journal: [
      {
        id: uid(),
        date: iso(-1),
        mood: "happy",
        energy: 4,
        whatWeDid: "School run, painting rainbows, park for an hour.",
        bestPart: "Splashing in puddles on the way to the park",
        difficult: "A little tantrum about leaving the park",
        learned: "How to mix purple from red and blue",
        notesForParents: "Girl 1's shoes are soaked, left them to dry by the radiator.",
        dayRating: 5,
      },
    ],

    progress: [
      { id: uid(), girlId: "girl1", date: iso(-3), type: "learned", text: "Can write her name without help" },
      { id: uid(), girlId: "girl2", date: iso(-1), type: "improved", text: "Getting much better at using a fork" },
      { id: uid(), girlId: "girl1", date: iso(0), type: "proud", text: "Shared her crayons with her sister with no fuss" },
    ],

    food: [
      { id: uid(), name: "Pasta with tomato sauce", girlId: "girl1", category: "meal", rating: "love" },
      { id: uid(), name: "Broccoli", girlId: "girl1", category: "meal", rating: "dislike" },
      { id: uid(), name: "Apple slices", girlId: "girl2", category: "snack", rating: "love" },
      { id: uid(), name: "Mushrooms", girlId: "girl2", category: "meal", rating: "dislike" },
      { id: uid(), name: "Hummus with veggies", girlId: "girl2", category: "newFood", rating: "like" },
    ],

    ideas: [
      {
        id: uid(),
        title: "Make homemade cookies",
        category: "Cooking",
        age: "3-8",
        location: "Indoor",
        duration: "45 min",
        cost: "£",
        materials: "Flour, butter, sugar, chocolate chips",
        description: "Classic baking afternoon, good for both girls together.",
        favourite: true,
        done: true,
      },
      {
        id: uid(),
        title: "Nature scavenger hunt",
        category: "Outdoor",
        age: "3-8",
        location: "Outdoor",
        duration: "30 min",
        cost: "Free",
        materials: "Printed checklist, a small basket",
        description: "Find a leaf, a stone, something yellow, something round…",
        favourite: false,
        done: false,
      },
    ],

    weeklyRecap: {
      ourWeek: "",
      favouriteActivity: "",
      biggestWin: "",
      funny: "",
      nextWeekFocus: "",
      questions: "",
    },

    parentsNotes: [
      { id: uid(), author: "Sophie", date: iso(-2), text: "Please remember Girl 2 has a dentist appointment Thursday at 16:00." },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                                */
/* ------------------------------------------------------------------ */

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-stone-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold text-stone-700 flex items-center gap-2">
        {Icon && <Icon className="w-6 h-6 text-rose-400" strokeWidth={2} />}
        {children}
      </h2>
      {sub && <p className="text-stone-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

function Pill({ children, tone = "rose" }) {
  const tones = {
    rose: "bg-rose-100 text-rose-600",
    sky: "bg-sky-100 text-sky-600",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    stone: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Stars({ value, size = "w-4 h-4" }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= value ? "fill-amber-300 text-amber-300" : "text-stone-200"}`} />
      ))}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", className = "", type = "button" }) {
  const base = "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200";
  const variants = {
    primary: "bg-rose-300 text-white hover:bg-rose-400 shadow-sm hover:shadow",
    soft: "bg-stone-100 text-stone-600 hover:bg-stone-200",
    ghost: "text-stone-400 hover:text-stone-600 hover:bg-stone-50",
    danger: "text-rose-400 hover:bg-rose-50",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-medium text-stone-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/30 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white rounded-t-3xl">
          <h3 className="font-semibold text-stone-700 text-lg">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-stone-800 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-[fadeIn_0.2s_ease]">
      <Sparkles className="w-4 h-4 text-amber-200" /> {message}
    </div>
  );
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-10 text-stone-400">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Decoration({ className, children }) {
  return <span className={`select-none pointer-events-none opacity-70 ${className}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/*  Nav config                                                         */
/* ------------------------------------------------------------------ */

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
  { key: "schedule", label: "Schedule", icon: Calendar, emoji: "📅" },
  { key: "activities", label: "Activities", icon: Palette, emoji: "🎨" },
  { key: "progress", label: "Progress", icon: Star, emoji: "🌟" },
  { key: "journal", label: "Daily Journal", icon: Smile, emoji: "😊" },
  { key: "food", label: "Food & Favourites", icon: Apple, emoji: "🍎" },
  { key: "guide", label: "Family Guide", icon: BookOpen, emoji: "📖" },
  { key: "ideas", label: "Ideas", icon: Lightbulb, emoji: "💡" },
  { key: "recap", label: "Weekly Recap", icon: ClipboardList, emoji: "📝" },
];

/* ------------------------------------------------------------------ */
/*  Main App                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [role, setRole] = useState("parent"); // parent | aupair
  const [syncError, setSyncError] = useState(false);
  const toastTimer = useRef(null);
  const saveTimer = useRef(null);
  // Tracks the JSON string we last wrote ourselves, so we can ignore the
  // realtime echo of our own save and only react to *other* people's changes.
  const lastWrittenJson = useRef(null);

  // Load from Supabase on first mount, then subscribe to live changes so
  // that the parents and the au pair always see each other's edits.
  useEffect(() => {
    let channel;

    (async () => {
      try {
        const { data: row, error } = await supabase
          .from(TABLE)
          .select("data")
          .eq("id", ROW_ID)
          .maybeSingle();

        if (error) throw error;

        if (row && row.data) {
          setData(row.data);
          lastWrittenJson.current = JSON.stringify(row.data);
        } else {
          const seed = defaultData();
          const { error: insertError } = await supabase
            .from(TABLE)
            .insert({ id: ROW_ID, data: seed });
          if (insertError) throw insertError;
          setData(seed);
          lastWrittenJson.current = JSON.stringify(seed);
        }
      } catch (e) {
        console.error("Supabase load failed, using local sample data:", e);
        setData(defaultData());
        setSyncError(true);
      } finally {
        setLoaded(true);
      }
    })();

    // Realtime: reflect changes made by the parents / au pair on another device
    channel = supabase
      .channel("journal-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const incoming = payload.new?.data;
          if (!incoming) return;
          const incomingJson = JSON.stringify(incoming);
          if (incomingJson === lastWrittenJson.current) return; // our own write, ignore
          lastWrittenJson.current = incomingJson;
          setData(incoming);
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);

  // Persist whenever data changes (debounced so fast typing doesn't spam the DB)
  useEffect(() => {
    if (!loaded || !data) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const json = JSON.stringify(data);
      if (json === lastWrittenJson.current) return;
      lastWrittenJson.current = json;
      try {
        const { error } = await supabase.from(TABLE).update({ data }).eq("id", ROW_ID);
        if (error) throw error;
        setSyncError(false);
      } catch (e) {
        console.error("Supabase save failed:", e);
        setSyncError(true);
      }
    }, 500);
  }, [data, loaded]);

  const update = useCallback((fn, msg) => {
    setData((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      return next;
    });
    if (msg) showToast(msg);
  }, [showToast]);

  if (!loaded || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🌸</div>
          <p className="text-stone-400 text-sm">Loading the journal…</p>
        </div>
      </div>
    );
  }

  const pageProps = { data, update, showToast, role };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-700" style={{ fontFamily: "'Nunito', ui-rounded, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
        ::selection { background: #fecdd3; }
      `}</style>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex md:flex-col w-64 shrink-0 min-h-screen bg-white border-r border-stone-100 px-5 py-6">
          <Brand />
          <RoleSwitch role={role} setRole={setRole} />
          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((item) => (
              <NavItem key={item.key} item={item} active={page === item.key} onClick={() => setPage(item.key)} />
            ))}
          </nav>
          <Decoration className="text-2xl mt-4">🌈 ⭐️ 🦋</Decoration>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur border-b border-stone-100 px-4 py-3 flex items-center justify-between">
          <Brand compact />
          <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-full hover:bg-stone-50">
            <Menu className="w-6 h-6 text-stone-500" />
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-stone-900/30" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <Brand compact />
                <button onClick={() => setMobileNavOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
              </div>
              <RoleSwitch role={role} setRole={setRole} />
              <nav className="mt-4 space-y-1">
                {NAV.map((item) => (
                  <NavItem key={item.key} item={item} active={page === item.key} onClick={() => { setPage(item.key); setMobileNavOpen(false); }} />
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-100 flex justify-around py-1.5">
          {NAV.slice(0, 5).map((item) => (
            <button key={item.key} onClick={() => setPage(item.key)} className="flex flex-col items-center px-2 py-1.5 rounded-xl">
              <item.icon className={`w-5 h-5 ${page === item.key ? "text-rose-400" : "text-stone-300"}`} />
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-8 py-6 md:py-8 pt-20 md:pt-8 pb-24 md:pb-10 max-w-5xl mx-auto w-full">
          {page === "dashboard" && <Dashboard {...pageProps} setPage={setPage} />}
          {page === "schedule" && <SchedulePage {...pageProps} />}
          {page === "activities" && <ActivitiesPage {...pageProps} />}
          {page === "progress" && <ProgressPage {...pageProps} />}
          {page === "journal" && <JournalPage {...pageProps} />}
          {page === "food" && <FoodPage {...pageProps} />}
          {page === "guide" && <FamilyGuidePage {...pageProps} />}
          {page === "ideas" && <IdeasPage {...pageProps} />}
          {page === "recap" && <RecapPage {...pageProps} />}
        </main>
      </div>

      {syncError && (
        <div className="fixed top-16 md:top-4 right-4 z-50 bg-white border border-rose-200 text-rose-500 text-xs px-3 py-2 rounded-2xl shadow-sm flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" /> Not connected to Supabase — check your .env keys
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

function Brand({ compact }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌷</span>
        <div>
          <h1 className={`font-bold text-stone-700 leading-tight ${compact ? "text-base" : "text-lg"}`}>
            The Girls' Little Journal
          </h1>
          {!compact && <p className="text-[11px] text-stone-400 mt-0.5">Our weeks, activities &amp; little achievements</p>}
        </div>
      </div>
    </div>
  );
}

function RoleSwitch({ role, setRole }) {
  return (
    <div className="mt-5 flex bg-stone-50 rounded-full p-1 text-xs font-medium">
      <button
        onClick={() => setRole("parent")}
        className={`flex-1 py-1.5 rounded-full transition ${role === "parent" ? "bg-white shadow-sm text-rose-500" : "text-stone-400"}`}
      >
        👪 Parent
      </button>
      <button
        onClick={() => setRole("aupair")}
        className={`flex-1 py-1.5 rounded-full transition ${role === "aupair" ? "bg-white shadow-sm text-sky-500" : "text-stone-400"}`}
      >
        🧑‍🎓 Au pair
      </button>
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
        active ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-stone-50"
      }`}
    >
      <item.icon className={`w-4 h-4 ${active ? "text-rose-400" : "text-stone-400"}`} />
      {item.label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({ data, update, showToast, setPage }) {
  const [noteText, setNoteText] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");

  const today = todayISO();
  const todayName = weekDayName(today);
  const todayEvents = (data.schedule[todayName] || []).slice().sort((a, b) => a.time.localeCompare(b.time));

  const recentActivities = data.activities.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const recentWins = data.progress.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString().slice(0, 10);
  const weekActivities = data.activities.filter((a) => a.date >= weekAgoISO).length;
  const weekJournalAvg =
    data.journal.filter((j) => j.date >= weekAgoISO).reduce((s, j, _, arr) => s + j.dayRating / arr.length, 0) || 0;

  function addNote() {
    if (!noteText.trim() || !noteAuthor.trim()) return;
    update((d) => ({
      ...d,
      parentsNotes: [{ id: uid(), author: noteAuthor.trim(), date: todayISO(), text: noteText.trim() }, ...d.parentsNotes],
    }), "✨ Saved!");
    setNoteText("");
    setNoteAuthor("");
  }

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-stone-400 text-sm">{prettyDate(today)} · Week of {shortDate(weekAgoISO <= today ? today : today)}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-700 mt-1">
            Welcome back <span className="text-rose-400">✨</span>
          </h1>
          <p className="text-stone-400 text-sm mt-1">Here's a little look at the girls' week so far.</p>
        </div>
        <Decoration className="text-3xl hidden sm:block">☁️ 🌈</Decoration>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Activities this week" value={weekActivities} emoji="🎨" tone="rose" />
        <StatCard label="Little wins this week" value={data.progress.filter((p) => p.date >= weekAgoISO).length} emoji="🌟" tone="amber" />
        <StatCard label="Avg. day rating" value={weekJournalAvg ? weekJournalAvg.toFixed(1) : "—"} emoji="😊" tone="sky" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={Calendar}>📅 Today</SectionTitle>
              <Button variant="ghost" onClick={() => setPage("schedule")}>Open schedule <ChevronRight className="w-4 h-4" /></Button>
            </div>
            {todayEvents.length === 0 ? (
              <EmptyState emoji="🌤️" text="Nothing scheduled for today yet." />
            ) : (
              <ul className="space-y-2">
                {todayEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 bg-stone-50 rounded-2xl px-4 py-2.5">
                    <span className="text-xs font-semibold text-rose-400 w-12 shrink-0">{e.time}</span>
                    <span className="flex-1 text-sm text-stone-600">{e.activity}</span>
                    {e.girl && <Pill tone="sky">{e.girl}</Pill>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={Palette}>Latest activities</SectionTitle>
              <Button variant="ghost" onClick={() => setPage("activities")}>See all <ChevronRight className="w-4 h-4" /></Button>
            </div>
            {recentActivities.length === 0 ? (
              <EmptyState emoji="🎨" text="No activities logged yet." />
            ) : (
              <div className="space-y-2">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-stone-600">{a.title}</p>
                      <p className="text-xs text-stone-400">{shortDate(a.date)} · {categoryEmoji(a.category)} {a.category}</p>
                    </div>
                    <Stars value={a.rating} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon={ClipboardList}>💬 Parents' Notes</SectionTitle>
            <div className="space-y-2 mb-4">
              {data.parentsNotes.length === 0 && <EmptyState emoji="💌" text="No notes yet." />}
              {data.parentsNotes.slice(0, 4).map((n) => (
                <div key={n.id} className="bg-amber-50/70 rounded-2xl px-4 py-2.5">
                  <p className="text-xs font-semibold text-stone-500">{n.author} — {shortDate(n.date)}</p>
                  <p className="text-sm text-stone-600 mt-0.5">"{n.text}"</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
              <input className={inputCls} placeholder="Your name" value={noteAuthor} onChange={(e) => setNoteAuthor(e.target.value)} />
              <input className={inputCls} placeholder="Write a note…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button onClick={addNote}><Plus className="w-4 h-4" /> Add</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-gradient-to-br from-amber-50 to-rose-50">
            <SectionTitle icon={Sparkles}>✨ This week's little wins</SectionTitle>
            {recentWins.length === 0 ? (
              <EmptyState emoji="🌟" text="No wins logged yet this week." />
            ) : (
              <ul className="space-y-3">
                {recentWins.map((w) => (
                  <li key={w.id} className="flex gap-2 items-start">
                    <span className="text-lg">{girlById(data, w.girlId)?.avatar || "🌟"}</span>
                    <div>
                      <p className="text-sm text-stone-600">{w.text}</p>
                      <p className="text-xs text-stone-400">{girlById(data, w.girlId)?.name} · {shortDate(w.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionTitle icon={BookOpen}>⚠️ Good to know</SectionTitle>
            <ul className="text-sm text-stone-600 space-y-2">
              <li className="flex gap-2"><span>🥜</span><span>{data.important.allergies}</span></li>
              <li className="flex gap-2"><span>🛏️</span><span>{data.important.bedtimeRules}</span></li>
              <li className="flex gap-2"><span>📌</span><span>{data.important.reminders}</span></li>
            </ul>
            <Button variant="ghost" className="mt-3" onClick={() => setPage("guide")}>Open Family Guide <ChevronRight className="w-4 h-4" /></Button>
          </Card>

          <div className="flex flex-wrap gap-2">
            <QuickAddButtons setPage={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAddButtons({ setPage }) {
  const items = [
    { label: "+ Add Activity", page: "activities" },
    { label: "+ Add Journal Entry", page: "journal" },
    { label: "+ Add Progress", page: "progress" },
    { label: "+ Add Schedule", page: "schedule" },
  ];
  return items.map((it) => (
    <button
      key={it.page}
      onClick={() => setPage(it.page)}
      className="text-xs font-medium bg-white border border-stone-200 hover:border-rose-200 hover:text-rose-500 text-stone-500 px-3 py-2 rounded-full transition"
    >
      {it.label}
    </button>
  ));
}

function StatCard({ label, value, emoji, tone }) {
  const tones = {
    rose: "bg-rose-50",
    amber: "bg-amber-50",
    sky: "bg-sky-50",
  };
  return (
    <div className={`rounded-3xl p-4 ${tones[tone]} flex items-center gap-3`}>
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-xl font-bold text-stone-700">{value}</p>
        <p className="text-xs text-stone-400">{label}</p>
      </div>
    </div>
  );
}

function girlById(data, id) {
  return data.girls.find((g) => g.id === id);
}
function categoryEmoji(cat) {
  return ACTIVITY_CATEGORIES.find((c) => c.key === cat)?.emoji || "🌈";
}

/* ------------------------------------------------------------------ */
/*  FAMILY GUIDE                                                       */
/* ------------------------------------------------------------------ */

function FamilyGuidePage({ data, update, showToast }) {
  const [tab, setTab] = useState("girls");
  const canEdit = true;

  const tabs = [
    { key: "girls", label: "👧 Girls" },
    { key: "routine", label: "🎀 Routine" },
    { key: "important", label: "⚠️ Important" },
    { key: "food", label: "🍓 Food prefs" },
    { key: "favActivities", label: "💕 Favourites" },
  ];

  return (
    <div>
      <SectionTitle icon={BookOpen} sub="Everything the au pair and parents need to know, in one place.">📖 Family Guide</SectionTitle>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === t.key ? "bg-rose-300 text-white" : "bg-white text-stone-500 border border-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "girls" && <GirlsTab data={data} update={update} canEdit={canEdit} />}
      {tab === "routine" && <RoutineTab data={data} update={update} canEdit={canEdit} />}
      {tab === "important" && <ImportantTab data={data} update={update} canEdit={canEdit} />}
      {tab === "food" && <FoodPrefsTab data={data} />}
      {tab === "favActivities" && <FavActivitiesGuideTab data={data} />}
    </div>
  );
}

function EditableText({ value, onSave, canEdit, multiline, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => setVal(value), [value]);

  if (!canEdit) return <p className={`text-sm text-stone-600 ${className}`}>{value}</p>;

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <p className={`text-sm text-stone-600 flex-1 ${className}`}>{value}</p>
        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition text-stone-300 hover:text-rose-400">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {multiline ? (
        <textarea className={inputCls + " min-h-[70px]"} value={val} onChange={(e) => setVal(e.target.value)} />
      ) : (
        <input className={inputCls} value={val} onChange={(e) => setVal(e.target.value)} />
      )}
      <div className="flex gap-2 mt-1.5">
        <Button variant="primary" onClick={() => { onSave(val); setEditing(false); }}><Check className="w-3.5 h-3.5" /> Save</Button>
        <Button variant="ghost" onClick={() => { setVal(value); setEditing(false); }}>Cancel</Button>
      </div>
    </div>
  );
}

function GirlsTab({ data, update, canEdit }) {
  const set = (id, field, val) =>
    update((d) => ({ ...d, girls: d.girls.map((g) => (g.id === id ? { ...g, [field]: val } : g)) }), "✨ Saved!");

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {data.girls.map((g) => (
        <Card key={g.id}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-2xl">{g.avatar}</div>
            <div>
              <EditableText value={g.name} onSave={(v) => set(g.id, "name", v)} canEdit={canEdit} className="text-lg font-semibold text-stone-700" />
              <p className="text-xs text-stone-400">{g.age} years old</p>
            </div>
          </div>
          <Field label="Personality"><EditableText value={g.personality} onSave={(v) => set(g.id, "personality", v)} canEdit={canEdit} multiline /></Field>
          <Field label="Likes"><EditableText value={g.likes} onSave={(v) => set(g.id, "likes", v)} canEdit={canEdit} multiline /></Field>
          <Field label="Dislikes"><EditableText value={g.dislikes} onSave={(v) => set(g.id, "dislikes", v)} canEdit={canEdit} multiline /></Field>
        </Card>
      ))}
    </div>
  );
}

const ROUTINE_FIELDS = [
  ["morning", "🌅 Morning routine"],
  ["afterSchool", "🎒 After school"],
  ["homework", "📝 Homework"],
  ["playTime", "🧸 Play time"],
  ["dinner", "🍽️ Dinner"],
  ["bath", "🛁 Bath / shower"],
  ["bedtime", "🌙 Bedtime"],
];

function RoutineTab({ data, update, canEdit }) {
  const set = (girlId, field, val) =>
    update((d) => ({ ...d, routines: { ...d.routines, [girlId]: { ...d.routines[girlId], [field]: val } } }), "✨ Saved!");

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {data.girls.map((g) => (
        <Card key={g.id}>
          <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">{g.avatar} {g.name}</h3>
          <div className="space-y-3">
            {ROUTINE_FIELDS.map(([key, label]) => (
              <div key={key}>
                <p className="text-xs font-medium text-stone-400 mb-1">{label}</p>
                <EditableText value={data.routines[g.id]?.[key] || ""} onSave={(v) => set(g.id, key, v)} canEdit={canEdit} multiline />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

const IMPORTANT_FIELDS = [
  ["allergies", "🥜 Allergies"],
  ["restrictions", "🚫 Food restrictions"],
  ["shouldntDo", "🙅 Things they shouldn't do"],
  ["permission", "🙋 Activities requiring permission"],
  ["screenTime", "📱 Screen time rules"],
  ["bedtimeRules", "🛏️ Bedtime rules"],
  ["reminders", "📌 Important reminders"],
];

function ImportantTab({ data, update, canEdit }) {
  const set = (field, val) => update((d) => ({ ...d, important: { ...d.important, [field]: val } }), "✨ Saved!");
  return (
    <Card className="bg-amber-50/50 border-amber-100">
      <div className="grid sm:grid-cols-2 gap-4">
        {IMPORTANT_FIELDS.map(([key, label]) => (
          <div key={key}>
            <p className="text-xs font-medium text-stone-500 mb-1">{label}</p>
            <EditableText value={data.important[key] || ""} onSave={(v) => set(key, v)} canEdit={canEdit} multiline />
          </div>
        ))}
      </div>
    </Card>
  );
}

function FoodPrefsTab({ data }) {
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {data.girls.map((g) => {
        const items = data.food.filter((f) => f.girlId === g.id);
        return (
          <Card key={g.id}>
            <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">{g.avatar} {g.name}</h3>
            {items.length === 0 ? <EmptyState emoji="🍓" text="No food preferences logged yet." /> : (
              <ul className="space-y-1.5">
                {items.map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{f.name}</span>
                    <span>{FOOD_RATINGS.find((r) => r.key === f.rating)?.emoji}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function FavActivitiesGuideTab({ data }) {
  const favs = data.ideas.filter((i) => i.favourite);
  return (
    <Card>
      <SectionTitle icon={Heart}>💕 Favourite Activities</SectionTitle>
      {favs.length === 0 ? <EmptyState emoji="💕" text="Mark an idea as favourite on the Ideas page." /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {favs.map((i) => (
            <div key={i.id} className="bg-rose-50/60 rounded-2xl p-4">
              <p className="font-medium text-stone-700 text-sm">{i.title}</p>
              <p className="text-xs text-stone-400 mt-1">{categoryEmoji(i.category)} {i.category} · {i.location} · {i.duration}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SCHEDULE                                                            */
/* ------------------------------------------------------------------ */

function SchedulePage({ data, update, showToast }) {
  const [view, setView] = useState("week");
  const [activeDay, setActiveDay] = useState(weekDayName(todayISO()));
  const [modalDay, setModalDay] = useState(null);
  const [editing, setEditing] = useState(null);

  function removeEvent(day, id) {
    update((d) => ({ ...d, schedule: { ...d.schedule, [day]: (d.schedule[day] || []).filter((e) => e.id !== id) } }), "Removed");
  }

  function saveEvent(day, ev) {
    update((d) => {
      const list = d.schedule[day] || [];
      const exists = list.some((e) => e.id === ev.id);
      const newList = exists ? list.map((e) => (e.id === ev.id ? ev : e)) : [...list, ev];
      newList.sort((a, b) => a.time.localeCompare(b.time));
      return { ...d, schedule: { ...d.schedule, [day]: newList } };
    }, "✨ Saved!");
    setModalDay(null);
    setEditing(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Calendar}>📅 Weekly Schedule</SectionTitle>
        <div className="flex bg-white border border-stone-200 rounded-full p-1 text-xs font-medium">
          <button onClick={() => setView("week")} className={`px-3 py-1.5 rounded-full ${view === "week" ? "bg-rose-300 text-white" : "text-stone-400"}`}>Week</button>
          <button onClick={() => setView("day")} className={`px-3 py-1.5 rounded-full ${view === "day" ? "bg-rose-300 text-white" : "text-stone-400"}`}>Day</button>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAYS.map((day) => (
            <DayCard
              key={day}
              day={day}
              isToday={day === weekDayName(todayISO())}
              events={data.schedule[day] || []}
              onAdd={() => { setEditing(null); setModalDay(day); }}
              onEdit={(ev) => { setEditing(ev); setModalDay(day); }}
              onRemove={(id) => removeEvent(day, id)}
            />
          ))}
        </div>
      ) : (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {DAYS.map((day) => (
              <button key={day} onClick={() => setActiveDay(day)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${activeDay === day ? "bg-rose-300 text-white" : "bg-white border border-stone-200 text-stone-500"}`}>
                {day}
              </button>
            ))}
          </div>
          <DayCard
            day={activeDay}
            isToday={activeDay === weekDayName(todayISO())}
            events={data.schedule[activeDay] || []}
            onAdd={() => { setEditing(null); setModalDay(activeDay); }}
            onEdit={(ev) => { setEditing(ev); setModalDay(activeDay); }}
            onRemove={(id) => removeEvent(activeDay, id)}
            expanded
          />
        </div>
      )}

      {modalDay && (
        <EventModal
          girls={data.girls}
          day={modalDay}
          event={editing}
          onClose={() => { setModalDay(null); setEditing(null); }}
          onSave={(ev) => saveEvent(modalDay, ev)}
        />
      )}
    </div>
  );
}

function DayCard({ day, isToday, events, onAdd, onEdit, onRemove, expanded }) {
  const sorted = events.slice().sort((a, b) => a.time.localeCompare(b.time));
  return (
    <Card className={isToday ? "ring-2 ring-rose-200" : ""}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-stone-700 flex items-center gap-2">
          {day} {isToday && <Pill tone="rose">Today</Pill>}
        </h3>
        <button onClick={onAdd} className="text-rose-400 hover:bg-rose-50 p-1.5 rounded-full"><Plus className="w-4 h-4" /></button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState emoji="🗓️" text="Nothing planned yet." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((e) => (
            <li key={e.id} className="group bg-stone-50 rounded-2xl px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-rose-400 w-11 shrink-0 pt-0.5">{e.time}</span>
                  <div>
                    <p className="text-sm text-stone-600">{e.activity}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {e.location && <Pill tone="stone"><MapPin className="w-3 h-3" />{e.location}</Pill>}
                      {e.girl && <Pill tone="sky">{e.girl}</Pill>}
                    </div>
                    {e.notes && expanded && <p className="text-xs text-stone-400 mt-1">{e.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => onEdit(e)} className="text-stone-300 hover:text-rose-400 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onRemove(e.id)} className="text-stone-300 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function EventModal({ girls, day, event, onClose, onSave }) {
  const [form, setForm] = useState(event || { id: uid(), time: "16:00", activity: "", location: "", girl: "Both", notes: "" });
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={`${event ? "Edit" : "Add"} · ${day}`} onClose={onClose}>
      <Field label="Time"><input type="time" className={inputCls} value={form.time} onChange={f("time")} /></Field>
      <Field label="Activity"><input className={inputCls} placeholder="e.g. Pick up from school" value={form.activity} onChange={f("activity")} /></Field>
      <Field label="Location"><input className={inputCls} placeholder="e.g. Park" value={form.location} onChange={f("location")} /></Field>
      <Field label="Girl(s) concerned">
        <select className={inputCls} value={form.girl} onChange={f("girl")}>
          <option>Both</option>
          {girls.map((g) => <option key={g.id}>{g.name}</option>)}
        </select>
      </Field>
      <Field label="Notes"><textarea className={inputCls} value={form.notes} onChange={f("notes")} /></Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => form.activity.trim() && onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  ACTIVITIES                                                         */
/* ------------------------------------------------------------------ */

function ActivitiesPage({ data, update }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterGirl, setFilterGirl] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const filtered = data.activities
    .filter((a) => (filterGirl === "all" ? true : a.girls.includes(filterGirl)))
    .filter((a) => (filterCat === "all" ? true : a.category === filterCat))
    .filter((a) => (filterDate ? a.date === filterDate : true))
    .sort((a, b) => b.date.localeCompare(a.date));

  function save(a) {
    update((d) => {
      const exists = d.activities.some((x) => x.id === a.id);
      return { ...d, activities: exists ? d.activities.map((x) => (x.id === a.id ? a : x)) : [a, ...d.activities] };
    }, "✨ Saved!");
    setModalOpen(false);
    setEditing(null);
  }
  function remove(id) {
    update((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== id) }), "Removed");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Palette} sub="Every little adventure, big or small.">🎨 Activities We Did</SectionTitle>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="w-4 h-4" /> Add Activity</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select className={inputCls + " w-auto"} value={filterGirl} onChange={(e) => setFilterGirl(e.target.value)}>
          <option value="all">All girls</option>
          {data.girls.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select className={inputCls + " w-auto"} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>)}
        </select>
        <input type="date" className={inputCls + " w-auto"} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {(filterGirl !== "all" || filterCat !== "all" || filterDate) && (
          <Button variant="ghost" onClick={() => { setFilterGirl("all"); setFilterCat("all"); setFilterDate(""); }}>Clear</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="🎨" text="No activities match yet — try adding one!" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <Card key={a.id} className="group relative">
              <div className="flex items-start justify-between">
                <Pill tone="green">{categoryEmoji(a.category)} {a.category}</Pill>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => { setEditing(a); setModalOpen(true); }} className="text-stone-300 hover:text-rose-400 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(a.id)} className="text-stone-300 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-stone-700 mt-2">{a.title}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{shortDate(a.date)} · {a.location} · {a.duration}</p>
              <p className="text-sm text-stone-600 mt-2">{a.description}</p>
              {a.learned && <p className="text-xs text-stone-500 mt-2"><span className="font-medium">Learned:</span> {a.learned}</p>}
              {a.loved && <p className="text-xs text-stone-500"><span className="font-medium">Loved:</span> {a.loved}</p>}
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1">
                  {a.girls.map((gid) => {
                    const g = girlById(data, gid);
                    return g ? <Pill key={gid} tone="rose">{g.avatar} {g.name}</Pill> : null;
                  })}
                </div>
                <Stars value={a.rating} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <ActivityModal girls={data.girls} activity={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={save} />
      )}
    </div>
  );
}

function ActivityModal({ girls, activity, onClose, onSave }) {
  const [form, setForm] = useState(
    activity || {
      id: uid(), date: todayISO(), title: "", girls: [], category: "Creative", location: "", duration: "",
      description: "", learned: "", loved: "", rating: 5, photo: "",
    }
  );
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleGirl = (id) => setForm({ ...form, girls: form.girls.includes(id) ? form.girls.filter((g) => g !== id) : [...form.girls, id] });

  return (
    <Modal title={activity ? "Edit activity" : "Add Activity"} onClose={onClose}>
      <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={f("date")} /></Field>
      <Field label="Activity name"><input className={inputCls} placeholder="e.g. Painting rainbows" value={form.title} onChange={f("title")} /></Field>
      <Field label="Girl(s) concerned">
        <div className="flex gap-2 flex-wrap">
          {girls.map((g) => (
            <button key={g.id} type="button" onClick={() => toggleGirl(g.id)} className={`px-3 py-1.5 rounded-full text-sm border transition ${form.girls.includes(g.id) ? "bg-rose-300 text-white border-rose-300" : "border-stone-200 text-stone-500"}`}>
              {g.avatar} {g.name}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Category">
        <select className={inputCls} value={form.category} onChange={f("category")}>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location"><input className={inputCls} value={form.location} onChange={f("location")} /></Field>
        <Field label="Duration"><input className={inputCls} placeholder="e.g. 45 min" value={form.duration} onChange={f("duration")} /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} value={form.description} onChange={f("description")} /></Field>
      <Field label="What they learned"><input className={inputCls} value={form.learned} onChange={f("learned")} /></Field>
      <Field label="What they loved"><input className={inputCls} value={form.loved} onChange={f("loved")} /></Field>
      <Field label="Fun level">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
              <Star className={`w-6 h-6 ${n <= form.rating ? "fill-amber-300 text-amber-300" : "text-stone-200"}`} />
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => form.title.trim() && onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  DAILY JOURNAL                                                      */
/* ------------------------------------------------------------------ */

function JournalPage({ data, update }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const sorted = data.journal.slice().sort((a, b) => b.date.localeCompare(a.date));

  function save(entry) {
    update((d) => {
      const exists = d.journal.some((x) => x.id === entry.id);
      return { ...d, journal: exists ? d.journal.map((x) => (x.id === entry.id ? entry : x)) : [entry, ...d.journal] };
    }, "✨ Saved!");
    setModalOpen(false);
    setEditing(null);
  }
  function remove(id) {
    update((d) => ({ ...d, journal: d.journal.filter((x) => x.id !== id) }), "Removed");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Smile} sub="A quick daily snapshot for the parents.">😊 Daily Journal</SectionTitle>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="w-4 h-4" /> Add Journal Entry</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState emoji="📔" text="No journal entries yet." />
      ) : (
        <div className="space-y-4">
          {sorted.map((j) => (
            <Card key={j.id} className="group">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-stone-700">{prettyDate(j.date)}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span>{MOODS.find((m) => m.key === j.mood)?.emoji} {MOODS.find((m) => m.key === j.mood)?.label}</span>
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-500">{Array(j.energy).fill("⚡").join("")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stars value={j.dayRating} />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditing(j); setModalOpen(true); }} className="text-stone-300 hover:text-rose-400 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(j.id)} className="text-stone-300 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                <JournalField label="What we did today" text={j.whatWeDid} />
                <JournalField label="Best part of the day" text={j.bestPart} />
                <JournalField label="Something difficult" text={j.difficult} />
                <JournalField label="Something they learned" text={j.learned} />
              </div>
              {j.notesForParents && (
                <div className="mt-3 bg-amber-50/70 rounded-2xl px-4 py-2.5">
                  <p className="text-xs font-medium text-stone-500">For the parents</p>
                  <p className="text-sm text-stone-600 mt-0.5">{j.notesForParents}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modalOpen && <JournalModal entry={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={save} />}
    </div>
  );
}

function JournalField({ label, text }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs font-medium text-stone-400">{label}</p>
      <p className="text-stone-600">{text}</p>
    </div>
  );
}

function JournalModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(
    entry || {
      id: uid(), date: todayISO(), mood: "happy", energy: 3, whatWeDid: "", bestPart: "",
      difficult: "", learned: "", notesForParents: "", dayRating: 5,
    }
  );
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal title={entry ? "Edit entry" : "Add Journal Entry"} onClose={onClose}>
      <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={f("date")} /></Field>
      <Field label="Mood">
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button key={m.key} type="button" onClick={() => setForm({ ...form, mood: m.key })} className={`text-xl p-2 rounded-full transition ${form.mood === m.key ? "bg-rose-100 scale-110" : "hover:bg-stone-50"}`}>
              {m.emoji}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Energy">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm({ ...form, energy: n })} className="text-xl">
              {n <= form.energy ? "⚡" : "◦"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="What we did today"><textarea className={inputCls} value={form.whatWeDid} onChange={f("whatWeDid")} /></Field>
      <Field label="Best part of the day"><input className={inputCls} value={form.bestPart} onChange={f("bestPart")} /></Field>
      <Field label="Something difficult"><input className={inputCls} value={form.difficult} onChange={f("difficult")} /></Field>
      <Field label="Something they learned"><input className={inputCls} value={form.learned} onChange={f("learned")} /></Field>
      <Field label="Anything the parents should know"><textarea className={inputCls} value={form.notesForParents} onChange={f("notesForParents")} /></Field>
      <Field label="Overall day">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm({ ...form, dayRating: n })}>
              <Star className={`w-6 h-6 ${n <= form.dayRating ? "fill-amber-300 text-amber-300" : "text-stone-200"}`} />
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  PROGRESS                                                            */
/* ------------------------------------------------------------------ */

const PROGRESS_TYPES = [
  { key: "learned", label: "Learned", emoji: "🌟" },
  { key: "improved", label: "Improved at", emoji: "📈" },
  { key: "working", label: "Working on", emoji: "🎯" },
  { key: "proud", label: "Proud of", emoji: "💖" },
];

function ProgressPage({ data, update }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGirl, setActiveGirl] = useState(data.girls[0]?.id);

  function save(entry) {
    update((d) => ({ ...d, progress: [entry, ...d.progress] }), "✨ Saved!");
    setModalOpen(false);
  }
  function remove(id) {
    update((d) => ({ ...d, progress: d.progress.filter((p) => p.id !== id) }), "Removed");
  }

  const girlProgress = data.progress
    .filter((p) => p.girlId === activeGirl)
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestByType = (type) =>
    girlProgress.filter((p) => p.type === type).slice(-1)[0];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Star} sub="Watching the girls grow, one little win at a time.">🌟 Little Wins &amp; Progress</SectionTitle>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Progress</Button>
      </div>

      <div className="flex gap-2 mb-5">
        {data.girls.map((g) => (
          <button key={g.id} onClick={() => setActiveGirl(g.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeGirl === g.id ? "bg-rose-300 text-white" : "bg-white border border-stone-200 text-stone-500"}`}>
            {g.avatar} {g.name}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {PROGRESS_TYPES.map((t) => {
          const item = latestByType(t.key);
          return (
            <Card key={t.key}>
              <p className="text-xs font-medium text-stone-400 mb-1">{t.emoji} {t.label}</p>
              <p className="text-sm text-stone-600">{item ? item.text : "—"}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="font-semibold text-stone-700 mb-4">Timeline</h3>
        {girlProgress.length === 0 ? (
          <EmptyState emoji="🌱" text="No progress logged yet for this girl." />
        ) : (
          <ol className="relative border-l-2 border-rose-100 ml-2 space-y-5">
            {girlProgress.slice().reverse().map((p) => (
              <li key={p.id} className="group ml-4">
                <span className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-rose-300" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-400">{shortDate(p.date)}</p>
                  <button onClick={() => remove(p.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-stone-600 mt-0.5">
                  {PROGRESS_TYPES.find((t) => t.key === p.type)?.emoji} {p.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {modalOpen && <ProgressModal girls={data.girls} defaultGirl={activeGirl} onClose={() => setModalOpen(false)} onSave={save} />}
    </div>
  );
}

function ProgressModal({ girls, defaultGirl, onClose, onSave }) {
  const [form, setForm] = useState({ id: uid(), girlId: defaultGirl, date: todayISO(), type: "learned", text: "" });
  return (
    <Modal title="Add Progress" onClose={onClose}>
      <Field label="Girl">
        <select className={inputCls} value={form.girlId} onChange={(e) => setForm({ ...form, girlId: e.target.value })}>
          {girls.map((g) => <option key={g.id} value={g.id}>{g.avatar} {g.name}</option>)}
        </select>
      </Field>
      <Field label="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {PROGRESS_TYPES.map((t) => (
            <button key={t.key} type="button" onClick={() => setForm({ ...form, type: t.key })} className={`px-3 py-1.5 rounded-full text-sm border transition ${form.type === t.key ? "bg-rose-300 text-white border-rose-300" : "border-stone-200 text-stone-500"}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Describe it"><textarea className={inputCls} placeholder="e.g. Learned to tie her shoelaces" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => form.text.trim() && onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOD & FAVOURITES                                                   */
/* ------------------------------------------------------------------ */

const FOOD_CATEGORIES = [
  { key: "meal", label: "Meals" },
  { key: "snack", label: "Snacks" },
  { key: "newFood", label: "New foods to try" },
];

function FoodPage({ data, update }) {
  const [modalOpen, setModalOpen] = useState(false);

  function save(item) {
    update((d) => ({ ...d, food: [item, ...d.food] }), "✨ Saved!");
    setModalOpen(false);
  }
  function remove(id) {
    update((d) => ({ ...d, food: d.food.filter((f) => f.id !== id) }), "Removed");
  }
  function setRating(id, rating) {
    update((d) => ({ ...d, food: d.food.map((f) => (f.id === id ? { ...f, rating } : f)) }));
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Apple} sub="What they love, what they don't, and what to try next.">🍎 Food &amp; Favourites</SectionTitle>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Food</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {FOOD_CATEGORIES.map((cat) => (
          <Card key={cat.key}>
            <h3 className="font-semibold text-stone-700 mb-3">{cat.label}</h3>
            {data.food.filter((f) => f.category === cat.key).length === 0 ? (
              <EmptyState emoji="🍽️" text="Nothing here yet." />
            ) : (
              <ul className="space-y-2">
                {data.food.filter((f) => f.category === cat.key).map((f) => (
                  <li key={f.id} className="group flex items-center justify-between bg-stone-50 rounded-2xl px-3 py-2">
                    <div>
                      <p className="text-sm text-stone-600">{f.name}</p>
                      <p className="text-[11px] text-stone-400">{girlById(data, f.girlId)?.name || "Both"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {FOOD_RATINGS.map((r) => (
                          <button key={r.key} onClick={() => setRating(f.id, r.key)} className={`text-sm px-1 rounded transition ${f.rating === r.key ? "" : "opacity-30 hover:opacity-70"}`} title={r.label}>
                            {r.emoji}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => remove(f.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 transition ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {modalOpen && <FoodModal girls={data.girls} onClose={() => setModalOpen(false)} onSave={save} />}
    </div>
  );
}

function FoodModal({ girls, onClose, onSave }) {
  const [form, setForm] = useState({ id: uid(), name: "", girlId: girls[0]?.id || "", category: "meal", rating: "like" });
  return (
    <Modal title="Add Food" onClose={onClose}>
      <Field label="Food name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Girl">
        <select className={inputCls} value={form.girlId} onChange={(e) => setForm({ ...form, girlId: e.target.value })}>
          {girls.map((g) => <option key={g.id} value={g.id}>{g.avatar} {g.name}</option>)}
        </select>
      </Field>
      <Field label="Category">
        <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {FOOD_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Rating">
        <div className="flex gap-2">
          {FOOD_RATINGS.map((r) => (
            <button key={r.key} type="button" onClick={() => setForm({ ...form, rating: r.key })} className={`px-3 py-1.5 rounded-full text-sm border transition ${form.rating === r.key ? "bg-rose-300 text-white border-rose-300" : "border-stone-200 text-stone-500"}`}>
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => form.name.trim() && onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  IDEAS                                                               */
/* ------------------------------------------------------------------ */

function IdeasPage({ data, update }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [filterLoc, setFilterLoc] = useState("all");
  const [onlyFav, setOnlyFav] = useState(false);

  function save(idea) {
    update((d) => ({ ...d, ideas: [idea, ...d.ideas] }), "✨ Saved!");
    setModalOpen(false);
  }
  function toggle(id, field) {
    update((d) => ({ ...d, ideas: d.ideas.map((i) => (i.id === id ? { ...i, [field]: !i[field] } : i)) }));
  }
  function remove(id) {
    update((d) => ({ ...d, ideas: d.ideas.filter((i) => i.id !== id) }), "Removed");
  }

  const filtered = data.ideas
    .filter((i) => (filterCat === "all" ? true : i.category === filterCat))
    .filter((i) => (filterLoc === "all" ? true : i.location === filterLoc))
    .filter((i) => (onlyFav ? i.favourite : true));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <SectionTitle icon={Lightbulb} sub="A little library of ideas for rainy days and sunny ones.">💡 Activity Ideas</SectionTitle>
        <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Add Idea</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <select className={inputCls + " w-auto"} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>)}
        </select>
        <select className={inputCls + " w-auto"} value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)}>
          <option value="all">Indoor / Outdoor</option>
          <option value="Indoor">🏠 Indoor</option>
          <option value="Outdoor">🌳 Outdoor</option>
        </select>
        <button onClick={() => setOnlyFav(!onlyFav)} className={`px-3 py-2 rounded-xl text-sm border ${onlyFav ? "bg-rose-300 text-white border-rose-300" : "border-stone-200 text-stone-500"}`}>
          ⭐ Favourites only
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="💡" text="No ideas match — add one!" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <Card key={i.id} className="group relative">
              <div className="flex items-start justify-between">
                <Pill tone="sky">{categoryEmoji(i.category)} {i.category}</Pill>
                <button onClick={() => remove(i.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-semibold text-stone-700 mt-2">{i.title}</h3>
              <p className="text-xs text-stone-400 mt-0.5">{i.location === "Indoor" ? "🏠" : "🌳"} {i.location} · ⏱ {i.duration} · 💰 {i.cost} · 🧒 {i.age}</p>
              <p className="text-sm text-stone-600 mt-2">{i.description}</p>
              {i.materials && <p className="text-xs text-stone-400 mt-1">Needs: {i.materials}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggle(i.id, "favourite")} className={`text-xs px-3 py-1.5 rounded-full border transition ${i.favourite ? "bg-amber-100 border-amber-200 text-amber-700" : "border-stone-200 text-stone-400"}`}>
                  ⭐ Favourite
                </button>
                <button onClick={() => toggle(i.id, "done")} className={`text-xs px-3 py-1.5 rounded-full border transition ${i.done ? "bg-green-100 border-green-200 text-green-700" : "border-stone-200 text-stone-400"}`}>
                  ✅ Done
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && <IdeaModal onClose={() => setModalOpen(false)} onSave={save} />}
    </div>
  );
}

function IdeaModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    id: uid(), title: "", category: "Creative", age: "", location: "Indoor",
    duration: "", cost: "", materials: "", description: "", favourite: false, done: false,
  });
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal title="Add Idea" onClose={onClose}>
      <Field label="Title"><input className={inputCls} placeholder="e.g. Make homemade cookies" value={form.title} onChange={f("title")} /></Field>
      <Field label="Category">
        <select className={inputCls} value={form.category} onChange={f("category")}>
          {ACTIVITY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Recommended age"><input className={inputCls} placeholder="e.g. 3-8" value={form.age} onChange={f("age")} /></Field>
        <Field label="Indoor / Outdoor">
          <select className={inputCls} value={form.location} onChange={f("location")}>
            <option>Indoor</option><option>Outdoor</option>
          </select>
        </Field>
        <Field label="Duration"><input className={inputCls} placeholder="e.g. 45 min" value={form.duration} onChange={f("duration")} /></Field>
        <Field label="Cost"><input className={inputCls} placeholder="e.g. £ or Free" value={form.cost} onChange={f("cost")} /></Field>
      </div>
      <Field label="Materials needed"><input className={inputCls} value={form.materials} onChange={f("materials")} /></Field>
      <Field label="Description"><textarea className={inputCls} value={form.description} onChange={f("description")} /></Field>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => form.title.trim() && onSave(form)}><Check className="w-4 h-4" /> Save</Button>
        <Button variant="soft" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  WEEKLY RECAP                                                        */
/* ------------------------------------------------------------------ */

function RecapPage({ data, update }) {
  const [form, setForm] = useState(data.weeklyRecap);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString().slice(0, 10);

  const weekActivities = data.activities.filter((a) => a.date >= weekAgoISO);
  const weekJournal = data.journal.filter((j) => j.date >= weekAgoISO);
  const weekProgress = data.progress.filter((p) => p.date >= weekAgoISO);
  const bestActivity = weekActivities.slice().sort((a, b) => b.rating - a.rating)[0];
  const bestDay = weekJournal.slice().sort((a, b) => b.dayRating - a.dayRating)[0];

  function saveRecap() {
    update((d) => ({ ...d, weeklyRecap: form }), "✨ Saved!");
  }

  return (
    <div>
      <SectionTitle icon={ClipboardList} sub="Everything that happened this week, at a glance.">📖 This Week</SectionTitle>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Activities done" value={weekActivities.length} emoji="🎨" tone="rose" />
        <StatCard label="Little wins" value={weekProgress.length} emoji="🌟" tone="amber" />
        <StatCard label="Journal entries" value={weekJournal.length} emoji="😊" tone="sky" />
        <StatCard label="Best day" value={bestDay ? shortDate(bestDay.date) : "—"} emoji="🏆" tone="rose" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="font-semibold text-stone-700 mb-3">Favourite activity this week</h3>
          {bestActivity ? (
            <div>
              <p className="text-sm text-stone-600 font-medium">{bestActivity.title}</p>
              <p className="text-xs text-stone-400 mt-1">{categoryEmoji(bestActivity.category)} {bestActivity.category} · {shortDate(bestActivity.date)}</p>
              <Stars value={bestActivity.rating} />
            </div>
          ) : <EmptyState emoji="🎨" text="No activities logged this week yet." />}
        </Card>
        <Card>
          <h3 className="font-semibold text-stone-700 mb-3">New things learned</h3>
          {weekProgress.filter((p) => p.type === "learned").length === 0 ? (
            <EmptyState emoji="🌱" text="Nothing logged yet." />
          ) : (
            <ul className="space-y-1.5 text-sm text-stone-600">
              {weekProgress.filter((p) => p.type === "learned").map((p) => (
                <li key={p.id}>🌟 {p.text} <span className="text-stone-400 text-xs">— {girlById(data, p.girlId)?.name}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-stone-700 mb-4">In your own words</h3>
        <Field label="Our week in a few words"><textarea className={inputCls} value={form.ourWeek} onChange={(e) => setForm({ ...form, ourWeek: e.target.value })} /></Field>
        <Field label="Favourite activity"><input className={inputCls} value={form.favouriteActivity} onChange={(e) => setForm({ ...form, favouriteActivity: e.target.value })} /></Field>
        <Field label="Biggest little win"><input className={inputCls} value={form.biggestWin} onChange={(e) => setForm({ ...form, biggestWin: e.target.value })} /></Field>
        <Field label="Something funny / cute"><textarea className={inputCls} value={form.funny} onChange={(e) => setForm({ ...form, funny: e.target.value })} /></Field>
        <Field label="Next week's focus"><input className={inputCls} value={form.nextWeekFocus} onChange={(e) => setForm({ ...form, nextWeekFocus: e.target.value })} /></Field>
        <Field label="Questions / notes for parents"><textarea className={inputCls} value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} /></Field>
        <Button onClick={saveRecap}><Check className="w-4 h-4" /> Save recap</Button>
      </Card>
    </div>
  );
}
