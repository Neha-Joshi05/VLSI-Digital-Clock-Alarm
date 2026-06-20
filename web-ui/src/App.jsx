import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock, Bell, BellOff, BellRing, AlarmClock,
  Moon, Sun, RotateCcw, Plus, Minus,
  CheckCircle, Cpu, List
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────
const p2 = n => String(n).padStart(2, "0")
const DAYS    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const SNOOZE_MINS = 5
const MAX_SNOOZE  = 3
const BUZZ_SECS   = 30

// ─── Segment digit ────────────────────────────────────────────
function SegDigit({ value, alarm }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.12 }}
        style={{
          fontSize: 64, fontWeight: 500, lineHeight: 1,
          fontFamily: "'JetBrains Mono',monospace",
          color: alarm ? "var(--red)" : "var(--text)",
          width: 42, textAlign: "center", display: "inline-block"
        }}>
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

// ─── Colon ────────────────────────────────────────────────────
function Colon({ blink }) {
  return (
    <motion.span
      animate={{ opacity: blink ? 1 : 0.15 }}
      transition={{ duration: 0.1 }}
      style={{
        fontSize: 52, fontWeight: 500, lineHeight: 1,
        fontFamily: "'JetBrains Mono',monospace",
        color: "var(--muted)", padding: "0 2px",
        alignSelf: "center"
      }}>:
    </motion.span>
  )
}

// ─── Badge ────────────────────────────────────────────────────
function Badge({ children, color = "muted" }) {
  const colors = {
    muted:  { bg: "var(--s2)", border: "var(--br)", text: "var(--muted)" },
    ok:     { bg: "#00c96e15", border: "#00c96e50", text: "var(--green)" },
    warn:   { bg: "#f5c51815", border: "#f5c51850", text: "var(--yellow)" },
    danger: { bg: "#ff3b5c15", border: "#ff3b5c50", text: "var(--red)" },
    info:   { bg: "#5b8fff15", border: "#5b8fff50", text: "var(--blue)" },
  }
  const c = colors[color]
  return (
    <motion.span animate={{ background: c.bg, borderColor: c.border, color: c.text }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 6,
        border: "1px solid", fontSize: 11,
        fontWeight: 500, fontFamily: "'JetBrains Mono',monospace"
      }}>
      {children}
    </motion.span>
  )
}

// ─── Control button ───────────────────────────────────────────
function CtrlBtn({ icon: Icon, label, active, color, onClick }) {
  const colors = {
    green:  { bg: "#00c96e15", border: "#00c96e", text: "var(--green)" },
    red:    { bg: "#ff3b5c15", border: "#ff3b5c", text: "var(--red)" },
    yellow: { bg: "#f5c51815", border: "#f5c518", text: "var(--yellow)" },
    blue:   { bg: "#5b8fff15", border: "#5b8fff", text: "var(--blue)" },
  }
  const c = color ? colors[color] : null
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "7px 12px", borderRadius: 8, cursor: "pointer",
        border: active && c ? `1px solid ${c.border}` : "1px solid var(--br)",
        background: active && c ? c.bg : "var(--s2)",
        color: active && c ? c.text : "var(--muted)",
        fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
        transition: "all 0.2s"
      }}>
      <Icon size={13} /> {label}
    </motion.button>
  )
}

// ─── Spinner ──────────────────────────────────────────────────
function Spinner({ value, onUp, onDown, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <motion.button whileTap={{ scale: 0.9 }} onClick={onUp}
        style={{ background: "var(--s2)", border: "1px solid var(--br)",
          borderRadius: 6, cursor: "pointer", padding: "3px 10px",
          color: "var(--muted)", fontSize: 11 }}>
        <Plus size={11} />
      </motion.button>
      <div style={{ fontSize: 26, fontWeight: 500, minWidth: 36,
        textAlign: "center", fontFamily: "'JetBrains Mono',monospace",
        color: "var(--text)" }}>{p2(value)}</div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={onDown}
        style={{ background: "var(--s2)", border: "1px solid var(--br)",
          borderRadius: 6, cursor: "pointer", padding: "3px 10px",
          color: "var(--muted)", fontSize: 11 }}>
        <Minus size={11} />
      </motion.button>
      <div style={{ fontSize: 9, color: "var(--hint)",
        fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  )
}

// ─── Log entry ────────────────────────────────────────────────
function LogEntry({ entry }) {
  const c = { ok:"var(--green)", warn:"var(--yellow)", info:"var(--blue)", danger:"var(--red)" }
  return (
    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
      style={{ display: "flex", gap: 8, padding: "3px 0",
        borderBottom: "1px solid #0f101a",
        fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
      <span style={{ color: "var(--hint)", minWidth: 22 }}>{entry.n}</span>
      <span style={{ color: c[entry.type] || "var(--text)" }}>{entry.msg}</span>
    </motion.div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 4, background: "var(--s3)",
      borderRadius: 2, overflow: "hidden" }}>
      <motion.div animate={{ width: `${pct}%`, background: color }}
        transition={{ duration: 0.4 }}
        style={{ height: "100%", borderRadius: 2 }} />
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const [hrs,  setHrs]  = useState(0)
  const [mins, setMins] = useState(0)
  const [secs, setSecs] = useState(0)
  const [almHr,  setAlmHr]  = useState(7)
  const [almMin, setAlmMin] = useState(0)
  const [almEn,  setAlmEn]  = useState(false)
  const [buzzer, setBuzzer] = useState(false)
  const [buzzTimer, setBuzzTimer] = useState(0)
  const [setMode,  setSetMode]  = useState(false)
  const [mode12,   setMode12]   = useState(false)
  const [snoozeCnt, setSnoozeCnt] = useState(0)
  const [snoozeTarget, setSnoozeTarget] = useState(-1)
  const [blink, setBlink] = useState(true)
  const [log,   setLog]   = useState([])
  const [logCnt, setLogCnt] = useState(0)

  const stateRef = useRef({})
  stateRef.current = { hrs, mins, secs, almHr, almMin, almEn,
    buzzer, buzzTimer, setMode, mode12, snoozeCnt, snoozeTarget }

  const addLog = useCallback((msg, type = "info") => {
    setLogCnt(n => {
      const next = n + 1
      setLog(l => [{ msg, type, n: next }, ...l].slice(0, 30))
      return next
    })
  }, [])

  // Main tick
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(b => !b)
      const s = stateRef.current
      if (s.setMode) return

      setSecs(prev => {
        const ns = prev + 1
        if (ns < 60) return ns
        setMins(pm => {
          const nm = pm + 1
          if (nm < 60) return nm
          setHrs(ph => (ph + 1) % 24)
          return 0
        })
        return 0
      })

      // Alarm check
      if (s.almEn && !s.buzzer) {
        const target = s.snoozeTarget >= 0 ? s.snoozeTarget : s.almMin
        if (s.hrs === s.almHr && s.mins === target && s.secs === 0) {
          setBuzzer(true)
          setBuzzTimer(BUZZ_SECS)
          addLog(`Alarm triggered ${p2(s.almHr)}:${p2(s.almMin)}`, "danger")
        }
      }

      // Buzz countdown
      if (s.buzzer) {
        setBuzzTimer(t => {
          if (t <= 1) { setBuzzer(false); addLog("Alarm auto-dismissed", "warn"); return 0 }
          return t - 1
        })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [addLog])

  const doSnooze = () => {
    if (!buzzer) { addLog("No active alarm", "warn"); return }
    if (snoozeCnt >= MAX_SNOOZE) { addLog("Max snoozes reached", "danger"); return }
    setBuzzer(false)
    setSnoozeCnt(c => c + 1)
    setSnoozeTarget((mins + SNOOZE_MINS) % 60)
    addLog(`Snoozed — resumes in ${SNOOZE_MINS}min (${snoozeCnt + 1}/${MAX_SNOOZE})`, "warn")
  }

  const doDismiss = () => {
    setBuzzer(false); setSnoozeTarget(-1); setSnoozeCnt(0)
    addLog("Alarm dismissed", "ok")
  }

  const doReset = () => {
    setHrs(0); setMins(0); setSecs(0)
    setAlmHr(7); setAlmMin(0); setAlmEn(false)
    setBuzzer(false); setBuzzTimer(0); setSetMode(false)
    setMode12(false); setSnoozeCnt(0); setSnoozeTarget(-1)
    setLog([]); setLogCnt(0)
    setTimeout(() => addLog("System reset — 00:00:00", "ok"), 50)
  }

  const displayHr = mode12 ? (hrs % 12 || 12) : hrs
  const now = new Date()
  const dateStr = `${DAYS[now.getDay()]} · ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  const alarmColor = buzzer ? "danger" : almEn ? "warn" : "muted"
  const alarmIcon = buzzer ? <BellRing size={12}/> : almEn ? <Bell size={12}/> : <BellOff size={12}/>

  const snoozeRemaining = snoozeTarget >= 0
    ? ((snoozeTarget - mins + 60) % 60)
    : 0

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.div
              animate={{ borderColor: buzzer ? "var(--red)" : "var(--br)" }}
              style={{ width: 38, height: 38, borderRadius: 10,
                border: "1px solid", background: "var(--s1)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={18} color={buzzer ? "var(--red)" : "var(--muted)"} />
            </motion.div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
                VLSI Digital Clock
              </h1>
              <p style={{ fontSize: 11, color: "var(--hint)",
                fontFamily: "'JetBrains Mono',monospace" }}>
                BCD counter · Alarm · Snooze · 12/24hr · Verilog-2005
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={buzzer ? "danger" : "ok"}>
              {buzzer ? <BellRing size={11}/> : <CheckCircle size={11}/>}
              {buzzer ? "ALARM" : "Running"}
            </Badge>
            <Badge color="muted">{mode12 ? "12hr" : "24hr"}</Badge>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={doReset}
              style={{ padding: "5px 11px", borderRadius: 8,
                border: "1px solid var(--br)", background: "var(--s1)",
                color: "var(--muted)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <RotateCcw size={12} /> Reset
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Clock face */}
        <motion.div
          animate={{ borderColor: buzzer ? "var(--red)" : "var(--br)" }}
          style={{ background: "var(--s1)", border: "1px solid",
            borderRadius: 16, padding: "28px 20px",
            textAlign: "center", marginBottom: 12 }}>

          {setMode && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: "#f5c51815", border: "1px solid #f5c51840",
                borderRadius: 8, padding: "5px 12px", fontSize: 11,
                color: "var(--yellow)", fontFamily: "'JetBrains Mono',monospace",
                marginBottom: 14 }}>
              SET MODE — adjusting time
            </motion.div>
          )}

          {/* Main display */}
          <div style={{ display: "flex", alignItems: "center",
            justifyContent: "center", gap: 2, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 2 }}>
              <SegDigit value={Math.floor(displayHr / 10)} alarm={buzzer} />
              <SegDigit value={displayHr % 10} alarm={buzzer} />
            </div>
            <Colon blink={blink} />
            <div style={{ display: "flex", gap: 2 }}>
              <SegDigit value={Math.floor(mins / 10)} alarm={buzzer} />
              <SegDigit value={mins % 10} alarm={buzzer} />
            </div>
            <Colon blink={blink} />
            <div style={{ display: "flex", gap: 2 }}>
              <SegDigit value={Math.floor(secs / 10)} alarm={buzzer} />
              <SegDigit value={secs % 10} alarm={buzzer} />
            </div>
            {mode12 && (
              <div style={{ fontSize: 18, fontWeight: 500, color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace",
                alignSelf: "flex-start", paddingTop: 8, marginLeft: 6 }}>
                {hrs >= 12 ? "PM" : "AM"}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, color: "var(--hint)",
            fontFamily: "'JetBrains Mono',monospace",
            letterSpacing: 1, marginBottom: 10 }}>
            {dateStr}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Badge color={alarmColor}>
              {alarmIcon}
              {buzzer ? "ALARM!" : almEn ? `Set ${p2(almHr)}:${p2(almMin)}` : "Alarm off"}
            </Badge>
            {snoozeTarget >= 0 && (
              <Badge color="warn">Snoozed · {snoozeRemaining}min</Badge>
            )}
          </div>

          {buzzer && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{ marginTop: 12, fontSize: 13, color: "var(--red)",
                fontFamily: "'JetBrains Mono',monospace" }}>
              ⏰ BUZZING — {buzzTimer}s remaining
            </motion.div>
          )}
        </motion.div>

        {/* Bottom grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Alarm controls */}
          <div style={{ background: "var(--s1)", border: "1px solid var(--br)",
            borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 10, color: "var(--hint)", letterSpacing: 2,
              textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Bell size={11} /> Alarm controls
            </div>

            {/* Alarm time spinner */}
            <div style={{ display: "flex", alignItems: "center",
              gap: 12, marginBottom: 14 }}>
              <Spinner value={almHr}
                onUp={() => setAlmHr(h => (h + 1) % 24)}
                onDown={() => setAlmHr(h => (h - 1 + 24) % 24)}
                label="Hour" />
              <span style={{ fontSize: 24, color: "var(--muted)",
                fontFamily: "'JetBrains Mono',monospace" }}>:</span>
              <Spinner value={almMin}
                onUp={() => setAlmMin(m => (m + 1) % 60)}
                onDown={() => setAlmMin(m => (m - 1 + 60) % 60)}
                label="Min" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--hint)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
                  Alarm set for:
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: "var(--text)",
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  {p2(almHr)}:{p2(almMin)}
                </div>
              </div>
            </div>

            {/* Progress bars */}
            {buzzer && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--red)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                  Buzzer: {buzzTimer}s
                </div>
                <ProgressBar pct={buzzTimer / BUZZ_SECS * 100} color="var(--red)" />
              </div>
            )}
            {snoozeTarget >= 0 && !buzzer && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--yellow)",
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>
                  Snooze {snoozeCnt}/{MAX_SNOOZE} — {snoozeRemaining}min remaining
                </div>
                <ProgressBar
                  pct={(SNOOZE_MINS - snoozeRemaining) / SNOOZE_MINS * 100}
                  color="var(--yellow)" />
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <CtrlBtn icon={almEn ? Bell : BellOff}
                label={almEn ? "Alarm ON" : "Alarm OFF"}
                active={almEn} color="green"
                onClick={() => {
                  setAlmEn(v => !v)
                  addLog(`Alarm ${!almEn ? "enabled" : "disabled"} — ${p2(almHr)}:${p2(almMin)}`,
                    !almEn ? "ok" : "warn")
                }} />
              <CtrlBtn icon={AlarmClock} label="Snooze"
                active={buzzer} color="yellow"
                onClick={doSnooze} />
              <CtrlBtn icon={BellOff} label="Dismiss"
                active={false} color="red"
                onClick={doDismiss} />
              <CtrlBtn icon={mode12 ? Sun : Moon}
                label={mode12 ? "→ 24hr" : "→ 12hr"}
                active={mode12} color="blue"
                onClick={() => {
                  setMode12(v => !v)
                  addLog(`Mode → ${!mode12 ? "12hr" : "24hr"}`, "info")
                }} />
            </div>

            {/* Set time */}
            <div style={{ marginTop: 10, paddingTop: 10,
              borderTop: "1px solid var(--br)" }}>
              <CtrlBtn icon={Clock} label={setMode ? "Exit set mode" : "Set time"}
                active={setMode} color="yellow"
                onClick={() => {
                  setSetMode(v => !v)
                  addLog(`set_mode → ${!setMode ? "1" : "0"}`, !setMode ? "warn" : "info")
                }} />
              {setMode && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <CtrlBtn icon={Plus} label="+ Hour" active={false}
                    onClick={() => {
                      setHrs(h => (h + 1) % 24)
                      addLog(`Hour → ${p2((hrs + 1) % 24)}`, "warn")
                    }} />
                  <CtrlBtn icon={Plus} label="+ Minute" active={false}
                    onClick={() => {
                      setSecs(0); setMins(m => (m + 1) % 60)
                      addLog(`Minute → ${p2((mins + 1) % 60)}`, "warn")
                    }} />
                </motion.div>
              )}
            </div>
          </div>

          {/* RTL status + log */}
          <div style={{ background: "var(--s1)", border: "1px solid var(--br)",
            borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 10, color: "var(--hint)", letterSpacing: 2,
              textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Cpu size={11} /> RTL status
            </div>

            {[
              ["clk_en tick", "1Hz",                          "var(--green)"],
              ["HH:MM:SS",    `${p2(hrs)}:${p2(mins)}:${p2(secs)}`, "var(--text)"],
              ["alarm reg",   `${p2(almHr)}:${p2(almMin)}`,   "var(--text)"],
              ["alm_en",      almEn ? "1" : "0",              almEn ? "var(--green)" : "var(--muted)"],
              ["buzzer",      buzzer ? "1" : "0",             buzzer ? "var(--red)" : "var(--muted)"],
              ["buzz_timer",  buzzer ? `${buzzTimer}s` : "0", buzzer ? "var(--red)" : "var(--muted)"],
              ["snooze_cnt",  `${snoozeCnt} / ${MAX_SNOOZE}`, snoozeCnt > 0 ? "var(--yellow)" : "var(--muted)"],
              ["mode",        mode12 ? "12hr" : "24hr",       "var(--blue)"],
              ["pm_flag",     mode12 && hrs >= 12 ? "1" : "0",mode12 && hrs >= 12 ? "var(--yellow)" : "var(--muted)"],
              ["set_mode",    setMode ? "1" : "0",            setMode ? "var(--yellow)" : "var(--muted)"],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "1px solid #0f101a", fontSize: 11 }}>
                <span style={{ color: "var(--hint)",
                  fontFamily: "'JetBrains Mono',monospace" }}>{k}</span>
                <motion.span animate={{ color: c }}
                  style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v}</motion.span>
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: "var(--hint)", letterSpacing: 2,
                textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace",
                marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <List size={11} /> Event log
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                <AnimatePresence>
                  {log.map((e, i) => <LogEntry key={i} entry={e} />)}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 28, fontSize: 10,
        color: "var(--br2)", fontFamily: "'JetBrains Mono',monospace" }}>
        VLSI Digital Clock · Verilog RTL · BCD HH:MM:SS · Alarm · Snooze · 12/24hr
      </div>
    </div>
  )
}