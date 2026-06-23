# Decision Simulator ◈

> A multi-agent AI debate engine that helps you make better decisions.

Three AI advisors with distinct perspectives debate your decision **in parallel**, then a synthesis engine delivers a verdict with confidence scoring, swing factor analysis, and prioritized action steps.

![Decision Simulator](https://img.shields.io/badge/Built%20with-Claude%20AI-blueviolet?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)

---

## How It Works

```
User Input ──► [The Visionary]   ─┐
              [The Contrarian]  ──┼──► Synthesis Engine ──► Verdict
              [The Realist]    ──┘        (+ confidence score, swing factor, action steps)
                  ↑
           Parallel API calls
           via Promise.all()
```

### The Three Advisors

| Advisor | Role | Focus |
|---|---|---|
| **The Visionary** | Best-case architect | Upside potential, growth opportunities |
| **The Contrarian** | Risk stress-tester | Flaws, hidden costs, dangerous assumptions |
| **The Realist** | Ground-truth navigator | Realistic outcomes, key variables |

### The Synthesis

After all three advisors respond, a fourth AI call synthesizes the debate into:
- **Verdict** — Proceed / Pause / Avoid
- **Confidence Score** — 0–100% decision clarity
- **Swing Factor** — The single variable that determines the outcome
- **Action Steps** — Top 3 things to do if you proceed

---

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **AI** — Meta Llama 3.3 70B via [Groq](https://groq.com) (free tier, ultra-fast inference)
- **Architecture** — Multi-agent parallel inference with `Promise.all()`
- **Deployment** — Vercel

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/decision-simulator.git
cd decision-simulator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your Groq API key:
```
GROQ_API_KEY=gsk_your-key-here
```

Get a **free** key at [console.groq.com](https://console.groq.com).

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Under **Environment Variables**, add:
   - `GROQ_API_KEY` = your key from [console.groq.com](https://console.groq.com)
4. Click **Deploy**

---

## Project Structure

```
decision-simulator/
├── src/
│   └── app/
│       ├── api/
│       │   └── simulate/
│       │       └── route.ts      # Server-side API route (keeps key secret)
│       ├── page.tsx              # Main UI — client component
│       ├── layout.tsx            # Root layout + metadata
│       └── globals.css           # Global styles + keyframe animations
├── .env.local.example            # Template for env vars
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Key Engineering Decisions

**Why a server-side API route?**
The Anthropic API key lives in `/api/simulate/route.ts` — a Next.js server function. It never touches the browser, so your key stays secret even in production.

**Why `Promise.all()` for the advisors?**
Running three sequential AI calls would triple the latency. `Promise.all()` fires all three in parallel, cutting wait time by ~65%.

**Why word-by-word animation instead of streaming?**
The server fetches all three opinions in parallel, then the client animates them simultaneously with a word-by-word loop. This gives a streaming feel while keeping the architecture simple — no SSE or WebSocket needed.

---

## License

MIT
