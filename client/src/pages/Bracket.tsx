import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Trophy, Zap, Brackets } from "lucide-react";

export default function Bracket() {
  const { data: allTeams } = trpc.teams.list.useQuery();
  const { data: bracketData } = trpc.tournament.getBracket.useQuery(undefined, { refetchInterval: 3000 });
  const { data: tournamentStatus } = trpc.tournament.getStatus.useQuery();

  const registeredCount = allTeams?.length || 0;
  const matches = bracketData?.matches || [];

  return (
    <Layout>
      <section className="relative py-16 border-b-2 border-border bg-card/10 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest mb-4">
            <Brackets className="h-4 w-4" /> Live Tournament Bracket
          </div>
          <h1 className="font-mono text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-3">
            Tournament <span className="text-primary">Bracket</span>
          </h1>
          <p className="text-muted-foreground">Track the Aqrix 2v2 Community Cup · Auto-refreshes every 3s</p>
        </div>
      </section>

      <section className="py-8 border-b border-purple-900/40" style={{background:"#07050f"}}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Status */}
            <div style={{background:"#0d0920",border:"1px solid #3a1a6a",borderRadius:6,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#8800ff,transparent)"}}/>
              <p style={{fontFamily:"Orbitron,monospace",fontSize:9,letterSpacing:3,color:"#5a3a8a",textTransform:"uppercase",marginBottom:8}}>Status</p>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:10,height:10,borderRadius:"50%",background: tournamentStatus?.status==="live" ? "#ff3366" : "#8800ff",boxShadow: tournamentStatus?.status==="live" ? "0 0 8px #ff3366" : "0 0 8px #8800ff",flexShrink:0}}/>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:16,fontWeight:900,color:"#dd88ff",letterSpacing:2}}>
                  {tournamentStatus?.status === "live" ? "LIVE" : "REGISTRATION"}
                </span>
              </div>
            </div>

            {/* Teams */}
            <div style={{background:"#0d0920",border:"1px solid #3a1a6a",borderRadius:6,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#6600dd,transparent)"}}/>
              <p style={{fontFamily:"Orbitron,monospace",fontSize:9,letterSpacing:3,color:"#5a3a8a",textTransform:"uppercase",marginBottom:8}}>Teams</p>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:22,fontWeight:900,color:"#c090ff"}}>{registeredCount}</span>
                <span style={{fontFamily:"monospace",fontSize:14,color:"#3a1a6a",fontWeight:700}}>/</span>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:16,fontWeight:700,color:"#5a3a8a"}}>64</span>
              </div>
              {/* progress bar */}
              <div style={{marginTop:8,height:3,background:"#1a0835",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(registeredCount/64)*100}%`,background:"linear-gradient(90deg,#6600dd,#dd55ff)",borderRadius:2,transition:"width 0.5s"}}/>
              </div>
            </div>

            {/* Prize Pool */}
            <div style={{background:"#0d0920",border:"1px solid #3a1a6a",borderRadius:6,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#aa00ff,transparent)"}}/>
              <p style={{fontFamily:"Orbitron,monospace",fontSize:9,letterSpacing:3,color:"#5a3a8a",textTransform:"uppercase",marginBottom:8}}>Prize Pool</p>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:22,fontWeight:900,color:"#d8ccff",textShadow:"0 0 10px rgba(168,85,247,.25)"}}>160€</span>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#5a3a8a",letterSpacing:1}}>TOTAL</span>
              </div>
              <p style={{fontFamily:"monospace",fontSize:9,color:"#3a2a60",marginTop:6,letterSpacing:1}}>1ST · 2ND · 3RD PLACE</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 border-b-2 border-border bg-background">
        <div className="container mx-auto px-4">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-mono text-2xl font-black text-foreground mb-2">Bracket Being Prepared</h2>
              <p className="text-muted-foreground">The bracket will appear here once registration is complete.</p>
            </div>
          ) : (
            <PublicBracketView matches={matches} />
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="border-2 border-primary/40 bg-primary/5 p-5 rounded-lg flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-bold">Live Updates —</span> The bracket refreshes every 3 seconds. Follow the Twitch livestream for commentary.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Match {
  id: number; bracket: string; round: number; matchNumber: number;
  team1: string; team2: string;
  team1Id: number | null; team2Id: number | null;
  team1Score: number; team2Score: number; winnerId: number | null;
}

// ─── Layout constants (all in SVG units) ──────────────────────────────────────
const MW       = 148;  // match card width
const TEAM_H   = 24;   // one team row height
const VS_H     = 14;   // VS divider height
const MH       = TEAM_H * 2 + VS_H;   // 62 — total match height
const R1_GAP   = 12;   // gap between matches in round 1
const COL_GAP  = 52;   // horizontal gap between columns
const FM_W     = 178;  // grand final card width
const SIDE_GAP = 80;   // gap between last side-column and grand final
const WB_H     = 118;  // winner box height
const FINALS_V = 36;   // vertical gap: final card → winner box
const HPAD     = 20;   // left/right padding
const TL_Y     = 36;   // timeline Y
const PAD_TOP  = 80;   // space above matches (for timeline + labels)

// Gap between matches grows per round (they merge pairs)
function roundGap(ri: number): number {
  return ri === 0 ? R1_GAP : 2 * MH + 2 * roundGap(ri - 1) + R1_GAP - MH;
}
// Total column height for n matches at round ri
function colH(ri: number, n: number): number {
  return n > 0 ? n * MH + (n - 1) * roundGap(ri) : 0;
}

// ─── Main bracket component ───────────────────────────────────────────────────
function PublicBracketView({ matches }: { matches: Match[] }) {
  // Group: bracket → round → matches[]
  const grouped: Record<string, Record<number, Match[]>> = {};
  matches.forEach(m => {
    grouped[m.bracket]             ??= {};
    grouped[m.bracket][m.round]    ??= [];
    grouped[m.bracket][m.round].push(m);
  });

  const leftRounds   = Object.keys(grouped["left"]   || {}).map(Number).sort((a,b)=>a-b);
  const rightRounds  = Object.keys(grouped["right"]  || {}).map(Number).sort((a,b)=>a-b);
  const finalsRounds = Object.keys(grouped["finals"] || {}).map(Number).sort((a,b)=>a-b);

  // Round 1 match count determines the max height
  const r1LeftCount  = grouped["left"]?.[leftRounds[0]]?.length  ?? 0;
  const r1RightCount = grouped["right"]?.[rightRounds[0]]?.length ?? 0;
  const r1Count      = Math.max(r1LeftCount, r1RightCount, 1);
  const maxH         = colH(0, r1Count);

  const numRounds = Math.max(leftRounds.length, rightRounds.length);
  const sideW     = numRounds * MW + (numRounds - 1) * COL_GAP;
  const totalW    = HPAD + sideW + SIDE_GAP + FM_W + SIDE_GAP + sideW + HPAD;

  // Grand final is centered vertically
  const finalsTotalH = MH + FINALS_V + WB_H;
  const fTopY        = PAD_TOP + Math.max(0, (maxH - finalsTotalH) / 2);
  const winnerY      = fTopY + MH + FINALS_V;
  const totalH       = Math.max(PAD_TOP + maxH, fTopY + finalsTotalH) + 80;

  const CX  = totalW / 2;
  const fmx = CX - FM_W / 2;

  // X position of a column
  function colX(ri: number, side: "left" | "right"): number {
    if (side === "left")  return HPAD + ri * (MW + COL_GAP);
    // right side: round 0 is rightmost, grows left
    return totalW - HPAD - MW - ri * (MW + COL_GAP);
  }

  // ── Match card ──────────────────────────────────────────────────────────────
  function drawMatch(m: Match, x: number, y: number) {
    const t1w = m.winnerId !== null && m.winnerId === m.team1Id;
    const t2w = m.winnerId !== null && m.winnerId === m.team2Id;
    const done = m.winnerId !== null;
    const border = done ? "#8800ff" : "#3a1a6a";

    const t1fill  = t1w ? "#2a0060" : "#110820";
    const t2fill  = t2w ? "#2a0060" : "#110820";
    const t1color = t1w ? "#dd88ff" : t2w ? "#2a1050" : "#c090ff";
    const t2color = t2w ? "#dd88ff" : t1w ? "#2a1050" : "#c090ff";

    return (
      <g key={`m${m.id}`}>
        <rect x={x} y={y}              width={MW} height={TEAM_H} rx={3} fill={t1fill} stroke={border} strokeWidth={1}/>
        <text x={x+6} y={y+TEAM_H/2} fontSize={10} fill={t1color} dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight={t1w?"700":"400"}>
          {trunc(m.team1||"TBD", 15)}
        </text>
        {done && <text x={x+MW-5} y={y+TEAM_H/2} fontSize={8} fill={t1w?"#22c55e":"#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold">{t1w?"WIN":"OUT"}</text>}

        <rect x={x} y={y+TEAM_H}      width={MW} height={VS_H}   fill="#0e0619" stroke={border} strokeWidth={1}/>
        <text x={x+MW/2} y={y+TEAM_H+VS_H/2} fontSize={8} fill="#5030a0" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace">VS</text>

        <rect x={x} y={y+TEAM_H+VS_H} width={MW} height={TEAM_H} rx={3} fill={t2fill} stroke={border} strokeWidth={1}/>
        <text x={x+6} y={y+TEAM_H+VS_H+TEAM_H/2} fontSize={10} fill={t2color} dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight={t2w?"700":"400"}>
          {trunc(m.team2||"TBD", 15)}
        </text>
        {done && <text x={x+MW-5} y={y+TEAM_H+VS_H+TEAM_H/2} fontSize={8} fill={t2w?"#22c55e":"#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold">{t2w?"WIN":"OUT"}</text>}
      </g>
    );
  }

  // ── Side (left / right) ─────────────────────────────────────────────────────
  function drawSide(side: "left"|"right", rounds: number[]) {
    const out: React.ReactNode[] = [];
    rounds.forEach((round, ri) => {
      const ms    = [...(grouped[side]?.[round]||[])].sort((a,b)=>a.matchNumber-b.matchNumber);
      const x0    = colX(ri, side);
      const sp    = roundGap(ri);
      const ch    = colH(ri, ms.length);
      const offY  = PAD_TOP + (maxH - ch) / 2;

      ms.forEach((m, mi) => out.push(drawMatch(m, x0, offY + mi*(MH+sp))));

      // connector lines to next round column
      if (ri < rounds.length - 1) {
        const nri   = ri + 1;
        const nms   = grouped[side]?.[rounds[nri]]||[];
        const nsp   = roundGap(nri);
        const nch   = colH(nri, nms.length);
        const nOffY = PAD_TOP + (maxH - nch) / 2;
        const nx0   = colX(nri, side);
        const ex    = side==="left" ? x0+MW : x0;
        const en    = side==="left" ? nx0   : nx0+MW;
        const midX  = (ex+en)/2;
        ms.forEach((_,mi) => {
          const y0 = offY  + mi*(MH+sp) + MH/2;
          const y1 = nOffY + Math.floor(mi/2)*(MH+nsp) + MH/2;
          out.push(<path key={`c${side}${round}${mi}`} d={`M${ex},${y0} H${midX} V${y1} H${en}`} stroke="#3a1a6a" strokeWidth={1} fill="none"/>);
        });
      }

      // connector from last column → grand final
      if (ri === rounds.length-1 && ms.length>0) {
        const ch2   = colH(ri, ms.length);
        const offY2 = PAD_TOP + (maxH-ch2)/2;
        const lastCY= offY2 + MH/2;
        const fCY   = fTopY + MH/2;
        const ex    = side==="left" ? x0+MW : x0;
        const en    = side==="left" ? fmx   : fmx+FM_W;
        const midX  = (ex+en)/2;
        out.push(<path key={`cf${side}`} d={`M${ex},${lastCY} H${midX} V${fCY} H${en}`} stroke="#6020b0" strokeWidth={1.5} fill="none"/>);
      }
    });
    return out;
  }

  // ── Grand final data ─────────────────────────────────────────────────────────
  const finalMatch  = finalsRounds.length>0 ? (grouped["finals"]?.[finalsRounds[0]]||[])[0] : null;
  const winnerName  = finalMatch?.winnerId
    ? (finalMatch.winnerId===finalMatch.team1Id ? finalMatch.team1 : finalMatch.team2)
    : null;

  const RNAMES  = ["Round 1","Round 2","Round 3","Round 4","Round 5"];
  const RCOUNTS = ["32 Matches","16 Matches","8 Matches","4 Matches","2 Matches"];

  // Winner box geometry
  const wbW = FM_W + 44; const wbX = CX - wbW/2; const wbR = 8; const dS = 7;

  return (
    <div className="w-full overflow-auto rounded-xl border border-border/50" style={{background:"#07050f"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');`}</style>
      <svg width={totalW} height={totalH} style={{display:"block",minWidth:totalW}}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1e0050"/>
            <stop offset="100%" stopColor="#07000f"/>
          </linearGradient>
          <linearGradient id="wb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#dd55ff"/>
            <stop offset="50%"  stopColor="#8800ff"/>
            <stop offset="100%" stopColor="#dd55ff"/>
          </linearGradient>
        </defs>

        {/* Timeline */}
        <line x1={0} y1={TL_Y} x2={totalW} y2={TL_Y} stroke="#2a1050" strokeWidth={1.5}/>
        <circle cx={CX} cy={TL_Y} r={7} fill="#9900ff"/>

        {/* Group A bar */}
        <rect x={HPAD} y={TL_Y-20} width={sideW} height={15} rx={3} fill="#1a0835" opacity={0.9}/>
        <text x={HPAD+sideW/2} y={TL_Y-12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">GROUP A</text>

        {/* Group B bar */}
        <rect x={totalW-HPAD-sideW} y={TL_Y-20} width={sideW} height={15} rx={3} fill="#1a0835" opacity={0.9}/>
        <text x={totalW-HPAD-sideW/2} y={TL_Y-12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">GROUP B</text>

        {/* Round dots + labels — left */}
        {leftRounds.map((_, ri) => {
          const x = colX(ri,"left") + MW/2;
          return <g key={`lh${ri}`}>
            <circle cx={x} cy={TL_Y} r={4} fill="#7030d0"/>
            <text x={x} y={TL_Y+13} fontSize={9}  fill="#9060d0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">{RNAMES[ri]}</text>
            <text x={x} y={TL_Y+24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily="monospace">{RCOUNTS[ri]}</text>
          </g>;
        })}

        {/* Round dots + labels — right */}
        {rightRounds.map((_, ri) => {
          const x = colX(ri,"right") + MW/2;
          return <g key={`rh${ri}`}>
            <circle cx={x} cy={TL_Y} r={4} fill="#7030d0"/>
            <text x={x} y={TL_Y+13} fontSize={9}  fill="#9060d0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">{RNAMES[ri]}</text>
            <text x={x} y={TL_Y+24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily="monospace">{RCOUNTS[ri]}</text>
          </g>;
        })}

        {/* Grand Final label */}
        <text x={CX} y={TL_Y+13} fontSize={10} fill="#ff60ff" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="900">Grand Final</text>
        <text x={CX} y={TL_Y+24} fontSize={7.5} fill="#8030a0" textAnchor="middle" fontFamily="monospace">1 Match</text>

        {/* Left bracket */}
        {drawSide("left",  leftRounds)}
        {/* Right bracket */}
        {drawSide("right", rightRounds)}

        {/* Grand Final card */}
        {[0,1].map(i => {
          const team    = i===0 ? (finalMatch?.team1||"TBD") : (finalMatch?.team2||"TBD");
          const isWin   = finalMatch?.winnerId && (i===0 ? finalMatch.winnerId===finalMatch.team1Id : finalMatch.winnerId===finalMatch.team2Id);
          const ty      = i===0 ? fTopY : fTopY+TEAM_H+VS_H;
          const fill    = isWin ? "#2a0060" : "#0e0618";
          const color   = isWin ? "#dd88ff" : "#c090ff";
          return <g key={`f${i}`}>
            <rect x={fmx} y={ty} width={FM_W} height={TEAM_H} rx={3} fill={fill} stroke="#8000ff" strokeWidth={2}/>
            {finalMatch
              ? <text x={fmx+8} y={ty+TEAM_H/2} fontSize={10} fill={color} dominantBaseline="middle" fontFamily="Orbitron,monospace">{trunc(team,22)}</text>
              : <line x1={fmx+FM_W*0.15} y1={ty+TEAM_H/2} x2={fmx+FM_W*0.85} y2={ty+TEAM_H/2} stroke="#3a1a6a" strokeWidth={1.5}/>
            }
          </g>;
        })}
        <rect x={fmx} y={fTopY+TEAM_H} width={FM_W} height={VS_H} fill="#0b0016" stroke="#8000ff" strokeWidth={2}/>
        <text x={CX} y={fTopY+TEAM_H+VS_H/2} fontSize={8} fill="#7030b0" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace">VS</text>

        {/* Connector → winner box */}
        <line x1={CX} y1={fTopY+MH} x2={CX} y2={winnerY} stroke="#8800ff" strokeWidth={2}/>

        {/* Winner box */}
        <rect x={wbX-3} y={winnerY-3} width={wbW+6} height={WB_H+6} rx={wbR+4} fill="none" stroke="#cc44ff" strokeWidth={1} opacity={0.3}/>
        <rect x={wbX}   y={winnerY}   width={wbW}   height={WB_H}   rx={wbR}   fill="url(#wg)" stroke="url(#wb)" strokeWidth={2}/>
        <line x1={wbX+18} y1={winnerY+2}     x2={wbX+wbW-18} y2={winnerY+2}     stroke="#cc44ff" strokeWidth={1} opacity={0.4}/>
        <line x1={wbX+18} y1={winnerY+WB_H-2} x2={wbX+wbW-18} y2={winnerY+WB_H-2} stroke="#cc44ff" strokeWidth={1} opacity={0.4}/>
        <text x={CX} y={winnerY+WB_H*0.27} fontSize={26} textAnchor="middle" dominantBaseline="middle">🏆</text>
        <text x={CX} y={winnerY+WB_H*0.56} fontSize={13} fill="#dd88ff" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight="900">WINNER</text>
        <rect x={wbX+wbW*0.1} y={winnerY+WB_H*0.73} width={wbW*0.8} height={23} rx={3} fill="#0d001f" stroke="#5500bb" strokeWidth={1}/>
        {winnerName && <text x={CX} y={winnerY+WB_H*0.73+11} fontSize={10} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight="700">{trunc(winnerName,22)}</text>}
        {[[wbX+14,winnerY+14],[wbX+wbW-14,winnerY+14],[wbX+14,winnerY+WB_H-14],[wbX+wbW-14,winnerY+WB_H-14]].map(([dx,dy],i)=>(
          <polygon key={i} points={`${dx},${dy-dS} ${dx+dS},${dy} ${dx},${dy+dS} ${dx-dS},${dy}`} fill="#9900dd" opacity={0.7}/>
        ))}

        {/* Footer */}
        <text x={CX} y={winnerY+WB_H+26} fontSize={15} fill="#fff"    textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="900">AQRIX 2v2 Community Cup</text>
        <text x={CX} y={winnerY+WB_H+44} fontSize={9}  fill="#6030a0" textAnchor="middle" fontFamily="monospace">64 TEAM · SINGLE ELIMINATION</text>
      </svg>
    </div>
  );
}

function trunc(s: string, max: number) { return s.length>max ? s.slice(0,max-1)+"…" : s; }
