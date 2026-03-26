import {
  BarChart2,
  Calendar,
  CheckCircle2,
  Settings2,
  Target,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    key: "categories",
    icon: <Target size={20} className="text-app-green" />,
    title: "Category-Based Organization",
    desc: "Group your habits into weighted categories. Each category carries a percentage weight, helping you see how well-balanced your routine is across life areas like Health, Work, and Learning.",
  },
  {
    key: "frequency",
    icon: <Calendar size={20} className="text-app-green" />,
    title: "Flexible Task Frequency",
    desc: "Define tasks as Daily (every day) or Weekly (a custom number of times per week, from 1 to 6). This lets you build a realistic plan that matches your lifestyle.",
  },
  {
    key: "tracking",
    icon: <CheckCircle2 size={20} className="text-app-green" />,
    title: "Easy Completion Tracking",
    desc: "Mark daily tasks done with a single tap. For weekly tasks, log each completion individually — you can even exceed your planned count when you're on a roll!",
  },
  {
    key: "dashboard",
    icon: <BarChart2 size={20} className="text-app-green" />,
    title: "Insightful Dashboards",
    desc: "Visualize your Daily Completion Factor and Weekly Completion Factor as donut charts with drill-down details showing exactly which tasks are complete and which remain.",
  },
  {
    key: "trends",
    icon: <TrendingUp size={20} className="text-app-green" />,
    title: "Historical Trends",
    desc: "Bar charts show your completion performance over the past 6 days and 4 weeks (configurable), giving you a clear view of momentum and consistency over time.",
  },
  {
    key: "settings",
    icon: <Settings2 size={20} className="text-app-green" />,
    title: "Configurable Thresholds",
    desc: "Set your own Red / Amber / Green thresholds. By default, below 60% is red, 61–80% is amber, and above 80% is green — so you always know at a glance how you're really doing.",
  },
];

export default function About() {
  return (
    <div>
      <div className="bg-app-hero border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <h1 className="text-4xl font-extrabold text-app-charcoal">
            About Build Habits
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base">
            A purposeful habit-tracking app designed to turn intentions into
            measurable progress.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-app-charcoal mb-3">
            Objective
          </h2>
          <div className="bg-card rounded-xl shadow-card p-6 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            <p>
              <strong className="text-foreground">Build Habits</strong> helps
              you deliberately design and track your daily and weekly routines.
              By quantifying completion rates and visualizing them with clear
              metrics, the app holds you accountable to the habits that matter
              most — not just the easy ones.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-app-charcoal mb-3">Purpose</h2>
          <div className="bg-card rounded-xl shadow-card p-6 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            <p>
              Most habit trackers treat all habits equally. Build Habits
              introduces{" "}
              <strong className="text-foreground">category weights</strong> so
              you can prioritize what truly drives growth in your life. The{" "}
              <strong className="text-foreground">completion factor</strong>{" "}
              model — daily and weekly — gives you a single number that reflects
              your true effort, not just a streak count.
            </p>
            <p className="mt-3">
              The color-coded thresholds (🔴 Red · 🟡 Amber · 🟢 Green) make it
              instantly obvious whether you're falling behind, keeping pace, or
              exceeding your goals — no interpretation required.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-app-charcoal mb-4">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.key}
                className="bg-card rounded-xl shadow-card p-5"
                data-ocid={`about.item.${i + 1}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {f.icon}
                  <h3 className="text-sm font-semibold text-foreground">
                    {f.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-app-charcoal mb-3">
            How Completion Factors Work
          </h2>
          <div className="bg-card rounded-xl shadow-card p-6 max-w-3xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">
                📅 Daily Completion Factor
              </h3>
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2">
                = (Daily tasks completed today) ÷ (Total daily tasks defined)
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-1">
                📆 Weekly Completion Factor
              </h3>
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded p-2">
                = (All completions in last 7 days) ÷ (Daily tasks × days/week +
                Σ weekly task targets)
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full bg-app-red inline-block" />
                Below red threshold
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full bg-app-amber inline-block" />
                Between thresholds
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded-full bg-app-green inline-block" />
                Above amber threshold
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
