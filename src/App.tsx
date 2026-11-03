import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { flows, stageLabels, type DemoFlow, type Turn } from './demoFlows'

type RunStatus = 'idle' | 'running' | 'failed' | 'passed'

const naiveCode = `def longest_common_substring(s1, s2):
    i = j = 0
    current = ""
    best = ""

    while i < len(s1) and j < len(s2):
        if s1[i] == s2[j]:
            current += s1[i]
            if len(current) > len(best):
                best = current
        else:
            current = ""
        i += 1
        j += 1

    return best`

const scaffoldCode = `def longest_common_substring(s1, s2):
    rows, cols = len(s1) + 1, len(s2) + 1
    dp = [[0] * cols for _ in range(rows)]
    best_len = best_end = 0

    for i in range(1, rows):
        for j in range(1, cols):
            if s1[i - 1] == s2[j - 1]:
                # TODO: extend the diagonal
                dp[i][j] = dp[i - 1][j - 1] + 1

    # TODO: track the best ending index
    return ""`

const finalCode = `def longest_common_substring(s1, s2):
    rows, cols = len(s1) + 1, len(s2) + 1
    dp = [[0] * cols for _ in range(rows)]
    best_len = best_end = 0

    for i in range(1, rows):
        for j in range(1, cols):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                if dp[i][j] > best_len:
                    best_len = dp[i][j]
                    best_end = i

    return s1[best_end - best_len:best_end]`

function Icon({ name, size = 16 }: { name: 'code' | 'message' | 'play' | 'reset' | 'chevron' | 'check' | 'spark' | 'book' | 'terminal'; size?: number }) {
  const paths: Record<typeof name, ReactElement> = {
    code: <><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
    play: <path d="m9 7 8 5-8 5Z"/>,
    reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    spark: <><path d="m12 3-1.4 4.2L6 9l4.6 1.8L12 15l1.4-4.2L18 9l-4.6-1.8Z"/><path d="m5 16-.7 2L2 19l2.3 1L5 22l.7-2L8 19l-2.3-1Z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    terminal: <><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function RichText({ children }: { children: string }) {
  const parts = children.split(/(`[^`]+`)/g)
  return <>{parts.map((part, index) => part.startsWith('`') && part.endsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part)}</>
}

function PointerTrace() {
  const first = [...'ABABC']
  const second = [...'BABCA']
  return (
    <div className="visual-card pointer-card">
      <div className="visual-title"><span>Offset check</span><span className="visual-caption">Start s1 at index 1</span></div>
      <div className="string-row"><span className="string-name">s1</span>{first.map((char, index) => <span className={index >= 1 ? 'char matched' : 'char dim'} key={`a-${index}`}>{char}</span>)}</div>
      <div className="string-row shifted"><span className="string-name">s2</span>{second.map((char, index) => <span className={index <= 3 ? 'char matched' : 'char dim'} key={`b-${index}`}>{char}</span>)}</div>
      <div className="match-brace"><span />BABC · length 4</div>
    </div>
  )
}

function buildDpGrid() {
  const a = 'ABABC'
  const b = 'BABCA'
  const grid = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) grid[i][j] = grid[i - 1][j - 1] + 1
    }
  }
  return { a, b, grid }
}

function DpGrid() {
  const { a, b, grid } = useMemo(buildDpGrid, [])
  return (
    <div className="visual-card dp-card">
      <div className="visual-title"><span>DP state map</span><span className="visual-caption">diagonal = contiguous run</span></div>
      <div className="dp-grid" style={{ gridTemplateColumns: `28px repeat(${b.length + 1}, 30px)` }}>
        <span className="dp-label" />
        <span className="dp-label">∅</span>
        {[...b].map((char, index) => <span className="dp-label" key={`bh-${index}`}>{char}</span>)}
        <span className="dp-label">∅</span>
        {grid[0].map((value, index) => <span className="dp-cell" key={`r0-${index}`}>{value}</span>)}
        {[...a].map((char, rowIndex) => (
          <div className="dp-row" key={`row-${rowIndex}`} style={{ display: 'contents' }}>
            <span className="dp-label">{char}</span>
            {grid[rowIndex + 1].map((value, colIndex) => (
              <span className={`dp-cell value-${Math.min(value, 4)} ${value === 4 ? 'peak' : ''}`} key={`${rowIndex}-${colIndex}`}>{value}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="dp-result"><span className="result-swatch" />Peak chain: <strong>4</strong> → <code>BABC</code></div>
    </div>
  )
}

function MiniTestResult() {
  return (
    <div className="visual-card inline-tests">
      <div><span className="test-check"><Icon name="check" size={13} /></span><code>ABABC, BABCA</code><strong>"BABC"</strong></div>
      <div><span className="test-check"><Icon name="check" size={13} /></span><code>abcdxyz, xyzabcd</code><strong>"abcd"</strong></div>
    </div>
  )
}

function TransferCard({ practice }: { practice: Turn['practice'] }) {
  if (!practice) return null
  return (
    <div className="visual-card transfer-card">
      <div className="practice-heading">
        <span className="practice-icon"><Icon name="book" size={13} /></span>
        <div><span className="transfer-kicker">Recommended next</span><strong>{practice.problem}</strong></div>
        <span className="practice-number">{practice.number}</span>
      </div>
      <p>{practice.reason}</p>
      <div className="practice-prompt"><span>Think before coding</span><RichText>{practice.prompt}</RichText></div>
    </div>
  )
}

function TurnVisual({ turn }: { turn: Turn }) {
  if (turn.visual === 'pointer-trace') return <PointerTrace />
  if (turn.visual === 'dp-grid') return <DpGrid />
  if (turn.visual === 'test-result') return <MiniTestResult />
  if (turn.visual === 'transfer') return <TransferCard practice={turn.practice} />
  return null
}

function ProgressPanel({ stage, step, total, complete }: { stage: number; step: number; total: number; complete: boolean }) {
  const completion = Math.round((step / total) * 100)
  return (
    <section className="progress-panel" aria-label="Learning progress">
      <div className="section-heading">
        <span>Learning progress</span>
        <span className="progress-percent">{completion}%</span>
      </div>
      <div className="progress-track"><span style={{ width: `${completion}%` }} /></div>
      <ol className="stage-list">
        {stageLabels.map((label, index) => {
          const state = complete || index < stage ? 'done' : index === stage ? 'active' : 'upcoming'
          return (
            <li className={state} key={label}>
              <span className="stage-dot">{state === 'done' ? <Icon name="check" size={12} /> : index + 1}</span>
              <div><strong>{label}</strong><span>{state === 'done' ? 'Evidence captured' : state === 'active' ? 'In progress' : 'Not started'}</span></div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function ProblemPanel({ stage, step, total, complete }: { stage: number; step: number; total: number; complete: boolean }) {
  return (
    <aside className="panel problem-panel">
      <div className="panel-tabs"><button className="active">Description</button><button>Notes</button></div>
      <div className="problem-scroll">
        <div className="problem-title-row"><h1>Longest Common Substring</h1><span className="difficulty">Medium</span></div>
        <p className="problem-copy">Given two strings <code>s1</code> and <code>s2</code>, return the longest contiguous string that appears in both.</p>
        <h2>Example</h2>
        <div className="example-block">
          <div><span>Input</span><code>s1 = "ABABC"</code></div>
          <div><span></span><code>s2 = "BABCA"</code></div>
          <div><span>Output</span><code>"BABC"</code></div>
          <div><span>Length</span><code>4</code></div>
        </div>
        <h2>Constraints</h2>
        <ul className="constraint-list">
          <li><code>1 ≤ s1.length, s2.length ≤ 1000</code></li>
          <li>Inputs contain uppercase English letters.</li>
          <li>The result must be contiguous in both strings.</li>
        </ul>
        <div className="learning-focus"><Icon name="spark" /><div><strong>Learning focus</strong><span>Move from a lockstep two-pointer intuition to a state that represents every alignment.</span></div></div>
        <ProgressPanel stage={stage} step={step} total={total} complete={complete} />
      </div>
    </aside>
  )
}

function ConversationPanel({
  flow,
  visibleCount,
  overrides,
  draft,
  onDraft,
  onAdvance,
  onSend,
  onBack,
  onReset,
  onFlow,
}: {
  flow: DemoFlow
  visibleCount: number
  overrides: Record<string, string>
  draft: string
  onDraft: (value: string) => void
  onAdvance: () => void
  onSend: () => void
  onBack: () => void
  onReset: () => void
  onFlow: (id: DemoFlow['id']) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const turns = flow.turns.slice(0, visibleCount)
  const nextTurn = flow.turns[visibleCount]
  const finished = !nextTurn

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [visibleCount, flow.id])

  return (
    <main className="panel conversation-panel">
      <header className="conversation-header">
        <div className="conversation-title"><span className="coach-avatar"><Icon name="spark" size={15} /></span><div><strong>Algorithm coach</strong><span><i /> Moderated session</span></div></div>
        <div className="flow-switch-wrap">
          <span className="demo-label">Demo scenario</span>
          <div className="flow-switch" role="group" aria-label="Demo scenario">
            {(Object.values(flows) as DemoFlow[]).map((item) => <button className={flow.id === item.id ? 'active' : ''} onClick={() => onFlow(item.id)} key={item.id}>{item.shortName}</button>)}
          </div>
        </div>
      </header>
      <div className="flow-context"><strong>{flow.name}</strong><span>{flow.description}</span></div>
      <div className="conversation-scroll" ref={scrollRef}>
        <div className="session-marker"><span>Session started</span></div>
        {turns.map((turn) => (
          <article className={`message ${turn.speaker}`} key={turn.id}>
            <div className="message-meta"><span>{turn.speaker === 'coach' ? 'Coach' : 'You'}</span>{turn.eyebrow && <em>{turn.eyebrow}</em>}</div>
            <div className="message-bubble"><p><RichText>{overrides[turn.id] ?? turn.text}</RichText></p><TurnVisual turn={turn} /></div>
          </article>
        ))}
        {finished && <div className="completion-card"><span><Icon name="check" /></span><div><strong>Learning activity complete</strong><p>The learner explained the key recurrence and transferred it to a related problem.</p></div></div>}
      </div>
      <footer className="composer">
        {nextTurn?.speaker === 'learner' && (
          <button className="suggestion-chip" onClick={() => onDraft(nextTurn.text)}><Icon name="spark" size={13} />Use scripted learner reply</button>
        )}
        {nextTurn?.speaker === 'coach' && (
          <button className="coach-next" onClick={onAdvance}><Icon name="message" size={14} />Reveal coach response<Icon name="chevron" size={14} /></button>
        )}
        {finished && <button className="coach-next" onClick={onReset}><Icon name="reset" size={14} />Replay this scenario</button>}
        <div className="composer-row">
          <textarea
            aria-label="Learner response"
            disabled={!nextTurn || nextTurn.speaker === 'coach'}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            placeholder={nextTurn?.speaker === 'learner' ? 'Type a response or use the scripted reply…' : finished ? 'Activity complete' : 'The coach is preparing the next prompt…'}
            rows={1}
          />
          <button className="send-button" disabled={!draft.trim() || nextTurn?.speaker !== 'learner'} onClick={onSend}>Send</button>
        </div>
        <div className="composer-tools"><button disabled={visibleCount <= 1} onClick={onBack}>Previous step</button><span>{visibleCount} / {flow.turns.length} turns</span><button onClick={onReset}>Reset</button></div>
      </footer>
    </main>
  )
}

function CodePanel({ stage, runStatus, onRun, collapsed, onToggle }: { stage: number; runStatus: RunStatus; onRun: () => void; collapsed: boolean; onToggle: () => void }) {
  const code = stage === 0 ? naiveCode : stage === 1 ? scaffoldCode : finalCode
  const lines = code.split('\n')
  if (collapsed) {
    return (
      <aside className="panel code-panel collapsed">
        <button className="code-rail-toggle" onClick={onToggle} aria-label="Expand code workspace" title="Expand code workspace">
          <Icon name="code" size={17} />
          <span>Code workspace</span>
          <Icon name="chevron" size={15} />
        </button>
      </aside>
    )
  }
  return (
    <aside className="panel code-panel">
      <div className="code-tabs"><button className="active"><Icon name="code" size={14} />solution.py</button><button><Icon name="book" size={14} />Notes</button><button className="code-panel-toggle" onClick={onToggle} aria-label="Collapse code workspace" title="Collapse code workspace"><Icon name="chevron" size={15} /></button></div>
      <div className="editor-toolbar"><span>Python 3</span><span className={`code-state stage-${stage}`}>{stage === 0 ? 'Initial approach' : stage === 1 ? 'DP scaffold' : 'Ready to test'}</span></div>
      <div className="code-editor" aria-label="Python solution">
        {lines.map((line, index) => <div className={line.includes('dp[i][j]') ? 'focus-line' : ''} key={`${index}-${line}`}><span className="line-number">{index + 1}</span><code>{line || ' '}</code></div>)}
      </div>
      <section className="console-panel">
        <div className="console-header"><span><Icon name="terminal" size={14} />Test results</span><button className="run-button" onClick={onRun} disabled={runStatus === 'running'}><Icon name="play" size={13} />{runStatus === 'running' ? 'Running…' : 'Run'}</button></div>
        <div className="console-body">
          {runStatus === 'idle' && <div className="idle-state"><span className="idle-icon"><Icon name="terminal" size={20} /></span><strong>2 test cases ready</strong><p>Run the current implementation to compare it with the expected output.</p></div>}
          {runStatus === 'running' && <div className="running-state"><span className="spinner" /><strong>Evaluating solution…</strong><p>Running the scripted examples.</p></div>}
          {runStatus === 'failed' && <div className="result-state failed"><div className="result-heading"><span>Wrong Answer</span><strong>1 / 2 passed</strong></div><div className="case-row"><span>Example</span><code>"BABC"</code><em>passed</em></div><div className="case-row"><span>Offset match</span><code>expected "abcd" · got ""</code><em>failed</em></div><p className="console-hint">Lockstep pointers do not inspect every starting alignment.</p></div>}
          {runStatus === 'passed' && <div className="result-state passed"><div className="result-heading"><span>Accepted</span><strong>2 / 2 passed</strong></div><div className="case-row"><span>Example</span><code>"BABC"</code><em>4 ms</em></div><div className="case-row"><span>Offset match</span><code>"abcd"</code><em>5 ms</em></div><p className="complexity"><span>Time <code>O(mn)</code></span><span>Space <code>O(mn)</code></span></p></div>}
        </div>
      </section>
    </aside>
  )
}

export default function App() {
  const [flowId, setFlowId] = useState<DemoFlow['id']>('fast')
  const [visibleCount, setVisibleCount] = useState(1)
  const [draft, setDraft] = useState('')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [codeCollapsed, setCodeCollapsed] = useState(true)
  const flow = flows[flowId]
  const visibleTurns = flow.turns.slice(0, visibleCount)
  const currentStage = visibleTurns.at(-1)?.stage ?? 0

  const resetFlow = (nextFlow = flowId) => {
    setFlowId(nextFlow)
    setVisibleCount(1)
    setDraft('')
    setOverrides({})
    setRunStatus('idle')
  }

  const sendReply = () => {
    const nextTurn = flow.turns[visibleCount]
    if (!nextTurn || nextTurn.speaker !== 'learner' || !draft.trim()) return
    setOverrides((current) => ({ ...current, [nextTurn.id]: draft.trim() }))
    setVisibleCount((count) => Math.min(count + 1, flow.turns.length))
    setDraft('')
  }

  const runCode = () => {
    setRunStatus('running')
    window.setTimeout(() => setRunStatus(currentStage >= 2 ? 'passed' : 'failed'), 650)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark">A</span><strong>AlgoCoach</strong><span className="prototype-badge">Prototype</span></div>
        <div className="header-problem"><span>Learning activity</span><strong>Longest Common Substring</strong></div>
        <div className="header-actions"><span className="saved-state"><i /> Scripted demo</span><button className="header-reset" onClick={() => resetFlow()}><Icon name="reset" size={14} />Reset</button><span className="user-avatar">ST</span></div>
      </header>
      <div className={`workspace ${codeCollapsed ? 'code-collapsed' : ''}`}>
        <ProblemPanel stage={currentStage} step={visibleCount} total={flow.turns.length} complete={visibleCount >= flow.turns.length} />
        <ConversationPanel
          flow={flow}
          visibleCount={visibleCount}
          overrides={overrides}
          draft={draft}
          onDraft={setDraft}
          onAdvance={() => setVisibleCount((count) => Math.min(count + 1, flow.turns.length))}
          onSend={sendReply}
          onBack={() => { setVisibleCount((count) => Math.max(1, count - 1)); setRunStatus('idle') }}
          onReset={() => resetFlow()}
          onFlow={(id) => resetFlow(id)}
        />
        <CodePanel stage={currentStage} runStatus={runStatus} onRun={runCode} collapsed={codeCollapsed} onToggle={() => setCodeCollapsed((current) => !current)} />
      </div>
    </div>
  )
}
