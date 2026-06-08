# AQRIX 2v2 Tournament - Projekt Handoff Dokumentation

## 🎯 Projekt Übersicht

**Projekt Name**: Aqrix 2v2 Community Cup  
**Typ**: Valorant 2v2 Tournament Management System  
**Tech Stack**: React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL/TiDB  
**Status**: Bracket-System FERTIG, weitere Features in Planung  
**Live URL**: https://aqrix2v2-x6s66ewf.manus.space  

---

## 📁 Projektstruktur

```
aqrix-2v2-tournament/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Admin.tsx           # Admin dashboard mit Bracket
│   │   │   ├── Bracket.tsx         # Public bracket view (TODO)
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── BracketVisualizer.tsx  # ⭐ MAIN: Bracket rendering mit WIN/RST buttons
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/trpc.ts             # tRPC client setup
│   │   ├── App.tsx                 # Routes & layout
│   │   ├── main.tsx                # React providers
│   │   └── index.css               # Global styles
│   ├── index.html
│   └── public/
│
├── server/                          # Express Backend
│   ├── routers.ts                  # ⭐ tRPC procedures (tournament, teams, bracket)
│   ├── db.ts                       # ⭐ Database queries (getBracketWithTeamNames, etc)
│   ├── db-bracket-dual32.ts        # ⭐ Bracket generation logic (generateDual32Bracket)
│   ├── storage.ts                  # S3 storage helpers
│   ├── _core/
│   │   ├── context.ts              # tRPC context (auth, user)
│   │   ├── llm.ts                  # LLM integration
│   │   ├── oauth.ts                # Manus OAuth
│   │   └── ... (other core files)
│
├── drizzle/
│   ├── schema.ts                   # ⭐ Database schema (teams, matches, tournaments)
│   └── migrations/                 # SQL migrations
│
├── shared/
│   ├── types.ts                    # Shared TypeScript types
│   └── const.ts                    # Shared constants
│
├── package.json                    # Dependencies
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## 🗄️ Datenbank Schema

### Wichtigste Tabellen:

```sql
-- Teams
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  status ENUM('pending', 'verified', 'rejected'),
  createdAt TIMESTAMP
);

-- Tournaments
CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY,
  status ENUM('pending', 'live', 'completed'),
  startDate TIMESTAMP,
  createdAt TIMESTAMP
);

-- Bracket Matches
CREATE TABLE bracket_matches (
  id INTEGER PRIMARY KEY,
  tournamentId INTEGER,
  bracket ENUM('left', 'right', 'finals'),
  round INTEGER,                    -- 1=32er, 2=16er, 3=8er, 4=4er, 5=2er, 6=1er
  matchNumber INTEGER,              -- Position in round (0-indexed)
  team1Id INTEGER,
  team2Id INTEGER,
  winnerId INTEGER,                 -- NULL = ausstehend
  createdAt TIMESTAMP,
  FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
  FOREIGN KEY (team1Id) REFERENCES teams(id),
  FOREIGN KEY (team2Id) REFERENCES teams(id),
  FOREIGN KEY (winnerId) REFERENCES teams(id)
);
```

---

## 🎮 Bracket System - Detaillierte Erklärung

### Bracket Struktur (Dual-32)

```
LEFT BRACKET (32 Teams)          FINALS (1 Match)          RIGHT BRACKET (32 Teams)
├─ Round 1: 16 Matches    ────→  ├─ Round 1: 1 Match  ←────  ├─ Round 1: 16 Matches
├─ Round 2: 8 Matches     ────→  └─ Round 2: 1 Match  ←────  ├─ Round 2: 8 Matches
├─ Round 3: 4 Matches     ────→                               ├─ Round 3: 4 Matches
├─ Round 4: 2 Matches     ────→                               ├─ Round 4: 2 Matches
└─ Round 5: 1 Match       ────→                               └─ Round 5: 1 Match
```

### Bracket Generation (generateDual32Bracket)

**Datei**: `server/db-bracket-dual32.ts`

```typescript
export async function generateDual32Bracket(
  tournamentId: number,
  teams: Array<{ id: number; name: string }>
) {
  // 1. Shuffle teams
  const shuffledTeams = teams.sort(() => Math.random() - 0.5);
  
  // 2. Split in LEFT (0-31) und RIGHT (32-63)
  const leftTeams = shuffledTeams.slice(0, 32);
  const rightTeams = shuffledTeams.slice(32, 64);
  
  // 3. Generate matches für LEFT bracket
  await generateSingleEliminationBracket(tournamentId, leftTeams, 'left');
  
  // 4. Generate matches für RIGHT bracket
  await generateSingleEliminationBracket(tournamentId, rightTeams, 'right');
  
  // 5. Generate FINALS match (TBD vs TBD)
  // Finals wird gefüllt wenn LEFT und RIGHT Winner feststehen
}
```

### Winner Progression

**Datei**: `server/routers.ts` - `updateMatchResult` Mutation

```typescript
export const updateMatchResult = protectedProcedure
  .input(z.object({
    matchId: z.number(),
    winnerId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    // 1. Update current match mit winner
    await db.update(bracket_matches)
      .set({ winnerId: input.winnerId })
      .where(eq(bracket_matches.id, input.matchId));
    
    // 2. Calculate next match position
    const currentMatch = await db.query.bracket_matches.findFirst({
      where: eq(bracket_matches.id, input.matchId)
    });
    
    // 3. Insert winner in next round
    // - Wenn round 1: nächste round = 2
    // - Team position: wenn matchNumber gerade → team1, ungerade → team2
    const nextRound = currentMatch.round + 1;
    const nextMatchNumber = Math.floor(currentMatch.matchNumber / 2);
    const isTeam1 = currentMatch.matchNumber % 2 === 0;
    
    // 4. Update next match
    if (isTeam1) {
      await db.update(bracket_matches)
        .set({ team1Id: input.winnerId })
        .where(and(
          eq(bracket_matches.bracket, currentMatch.bracket),
          eq(bracket_matches.round, nextRound),
          eq(bracket_matches.matchNumber, nextMatchNumber)
        ));
    } else {
      await db.update(bracket_matches)
        .set({ team2Id: input.winnerId })
        .where(...);
    }
  });
```

---

## 🎨 Frontend - BracketVisualizer Component

**Datei**: `client/src/components/BracketVisualizer.tsx`

### Key Constants

```typescript
const MATCH_WIDTH = 140;           // Breite einer Match-Box
const MATCH_HEIGHT = 50;           // Höhe einer Match-Box
const PAIR_HEIGHT = 220;           // Vertikaler Abstand zwischen Match-Paaren
const ROUND_SPACING = 220;         // Horizontaler Abstand zwischen Runden
```

### Rendering Logic

```typescript
// 1. Group matches by bracket (left, right, finals)
const groupedMatches = {
  left: { 1: [...], 2: [...], ... },
  right: { 1: [...], 2: [...], ... },
  finals: { 1: [...], 2: [...] }
};

// 2. Render LEFT bracket (x: 40 → 920)
renderBracketColumn(groupedMatches, 'left', 40, false);

// 3. Render FINALS (x: 1100)
renderBracketColumn(groupedMatches, 'finals', 1100, false);

// 4. Render RIGHT bracket (x: 2200 → 1320, reversed)
renderBracketColumn(groupedMatches, 'right', 2200, true);
```

### Winner Box Positioning (WICHTIG!)

```typescript
// Winner-Boxen ZWISCHEN zwei Match-Paaren
for (let i = 0; i < roundMatches.length; i += 2) {
  const match1 = roundMatches[i];
  const match2 = roundMatches[i + 1];
  
  if (match1 && match2) {
    // Y-Position EXAKT mittig zwischen den beiden Matches
    const match1Y = 40 + winnerPairIndex * PAIR_HEIGHT;
    const match2Y = match1Y + MATCH_HEIGHT + 40;
    const winnerY = (match1Y + match2Y) / 2;  // ← KEY FORMULA
    
    // Render winner box
    renderWinnerBox(winnerMatch, xOffset, winnerY);
  }
}
```

### Match Rendering

```typescript
// Jeder Match hat:
// - Team 1 Box (oben)
// - Team 2 Box (unten)
// - WIN Button für Team 1 (grün wenn gewonnen)
// - WIN Button für Team 2 (rot wenn verloren)
// - RST Button (zum Zurücksetzen)

// Farben:
// - W = weiß (ausstehend)
// - ✓ = grün (WON)
// - ✗ = rot (LOST)
```

---

## 🔧 Wichtige Funktionen

### 1. Tournament Starten

**Datei**: `server/routers.ts` - `startTournament`

```typescript
export const startTournament = adminProcedure
  .mutation(async ({ ctx }) => {
    const verifiedTeams = await db.query.teams.findMany({
      where: eq(teams.status, 'verified')
    });
    
    if (verifiedTeams.length === 64) {
      // Generate Dual-32 Bracket
      await generateDual32Bracket(tournamentId, verifiedTeams);
    } else if (verifiedTeams.length > 0) {
      // Generate Single Elimination
      await generateBracketMatches(tournamentId, verifiedTeams);
    }
  });
```

### 2. Team Verification

**Datei**: `server/routers.ts` - `verifyTeam`

```typescript
export const verifyTeam = adminProcedure
  .input(z.object({ teamId: z.number() }))
  .mutation(async ({ input }) => {
    await db.update(teams)
      .set({ status: 'verified' })
      .where(eq(teams.id, input.teamId));
  });
```

### 3. Get Bracket Data

**Datei**: `server/db.ts` - `getBracketWithTeamNames`

```typescript
export async function getBracketWithTeamNames(tournamentId: number) {
  const matches = await db
    .select({
      id: bracket_matches.id,
      bracket: bracket_matches.bracket,
      round: bracket_matches.round,
      matchNumber: bracket_matches.matchNumber,
      team1Name: sql`COALESCE(t1.name, 'TBD')`,
      team2Name: sql`COALESCE(t2.name, 'TBD')`,
      winnerId: bracket_matches.winnerId,
      // ... more fields
    })
    .from(bracket_matches)
    .leftJoin(teams.as('t1'), eq(bracket_matches.team1Id, teams.id))
    .leftJoin(teams.as('t2'), eq(bracket_matches.team2Id, teams.id))
    .where(eq(bracket_matches.tournamentId, tournamentId));
  
  // Group by bracket and round
  return groupBy(matches, m => `${m.bracket}-${m.round}`);
}
```

---

## 📋 Admin Dashboard Features

### Tabs

1. **TOURNAMENT SETTINGS**
   - Start Date/Time
   - Current Status (LIVE, PENDING, COMPLETED)
   - Team Counts (Total, Pending, Verified, Rejected)
   - START TOURNAMENT Button

2. **VERIFICATION**
   - List aller Teams
   - Status Badges (pending, verified, rejected)
   - Verify/Reject Buttons

3. **BRACKET RESULTS** ⭐
   - Visual Bracket mit LEFT | FINALS | RIGHT
   - WIN/RST Buttons für jeden Match
   - Live Updates wenn Winner gesetzt wird

---

## 🚀 Nächste Features (TODO)

### 1. Public Bracket View
- Neue Route: `/bracket`
- Read-only Bracket für Zuschauer
- Auto-refresh alle 5 Sekunden
- Live-Updates mit WebSocket (optional)

### 2. Match Statistiken
- Score eingeben
- Match Dauer
- Timestamp
- Match Notes

### 3. Bracket Export
- Download als PNG/PDF
- Social Media Share
- Embed Code

### 4. Streaming Integration
- Twitch API integration
- Live Match Updates
- Viewer Count

---

## 🧪 Testing Checklist

Bevor du neue Features hinzufügst, überprüfe:

- [ ] **Bracket Generation**: 64 Teams → 32 LEFT + 32 RIGHT
- [ ] **Winner Progression**: Winner geht in nächste Runde
- [ ] **Winner Box Position**: EXAKT mittig zwischen zwei Matches (alle Runden)
- [ ] **No Overlaps**: Keine Boxen überlappen sich
- [ ] **Consistent Spacing**: Alle Match-Paare haben gleichen Abstand
- [ ] **WIN/RST Buttons**: Funktionieren und speichern in DB
- [ ] **Finals**: Wird gefüllt wenn LEFT und RIGHT Winner da sind
- [ ] **Mobile Responsive**: Bracket scrollbar funktioniert

---

## 📝 Code Conventions

### File Naming
- Components: PascalCase (BracketVisualizer.tsx)
- Utilities: camelCase (getBracketWithTeamNames.ts)
- Types: PascalCase (Match.ts)

### Database
- Tables: snake_case (bracket_matches)
- Columns: camelCase (winnerId)
- Enums: lowercase ('left', 'right', 'finals')

### React
- Use tRPC hooks: `trpc.tournament.getBracket.useQuery()`
- Use optimistic updates für UI responsiveness
- Always handle loading/error states

### Styling
- Use Tailwind utilities
- Use shadcn/ui components
- Keep custom CSS minimal

---

## 🔑 Key Files für Änderungen

| Feature | Datei | Änderungen |
|---------|-------|-----------|
| Bracket Layout | `BracketVisualizer.tsx` | Rendering, Spacing, Positioning |
| Winner Logic | `server/routers.ts` | updateMatchResult mutation |
| Bracket Gen | `server/db-bracket-dual32.ts` | Team distribution, round generation |
| Database | `drizzle/schema.ts` | Neue Felder, Relationen |
| API | `server/routers.ts` | Neue procedures |
| UI | `client/src/pages/Admin.tsx` | New tabs, components |

---

## 🐛 Common Issues & Fixes

### Problem: Winner-Boxen nicht mittig
**Lösung**: Check `winnerY = (match1Y + match2Y) / 2` Formel in BracketVisualizer.tsx

### Problem: Teams werden nicht in nächste Runde eingefügt
**Lösung**: Check `updateMatchResult` in routers.ts - nextMatchNumber Berechnung

### Problem: Bracket wird nicht generiert
**Lösung**: Check ob genau 64 Teams verified sind - nur dann wird `generateDual32Bracket` aufgerufen

### Problem: Matches kleben aneinander
**Lösung**: Erhöhe PAIR_HEIGHT oder MATCH_GAP in BracketVisualizer.tsx

---

## 📞 Support & Questions

Wenn du steckenbleibst:

1. **Check die Datenbank**: `SELECT * FROM bracket_matches WHERE tournamentId = 1;`
2. **Check die Logs**: `.manus-logs/devserver.log` und `browserConsole.log`
3. **Check die Types**: Alle tRPC inputs/outputs sind typed
4. **Test mit 64 Teams**: Nur mit 64 wird Dual-32 generiert

---

## ✅ Deployment Checklist

Bevor du publishst:

- [ ] Alle Features in todo.md sind [x]
- [ ] Kein console.error in Browser
- [ ] Bracket sieht auf Desktop und Mobile gut aus
- [ ] WIN/RST Buttons funktionieren
- [ ] Winner-Progression funktioniert
- [ ] Keine TypeScript Fehler
- [ ] Database Schema ist aktuell
- [ ] Tests laufen durch (pnpm test)

---

**Last Updated**: 2026-06-04  
**Status**: Bracket System COMPLETE, weitere Features TODO
