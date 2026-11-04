/**
 * Evidence-driven interaction policy. The LLM interprets language; this module
 * exclusively decides phase transitions. No scalar mastery/confidence score.
 */
export const PHASES = ['approach', 'gap', 'solution', 'abstraction', 'transfer', 'complete'];
export const ACTIONS = ['CLARIFY', 'PROBE', 'HINT', 'CHALLENGE', 'VISUALISE', 'REPAIR', 'OFFER_CHOICE', 'ASK_ABSTRACTION', 'ASK_TRANSFER', 'FEEDBACK', 'COMPLETE'];
export const REQUIRED_EVIDENCE = {
  approach: 'approach_explained', gap: 'limitation_explained',
  solution: 'correct_method', abstraction: 'principle_explained', transfer: 'transfer_applied'
};
const evidenceKinds = new Set([...Object.values(REQUIRED_EVIDENCE), 'assumptions_clarified']);
const conceptByPhase = {
  approach: 'learner_approach', gap: 'alignment_coverage',
  solution: 'algorithm_correctness', abstraction: 'reusable_principle',
  transfer: 'near_transfer'
};
export const PROBLEM = {
  id: 'longest-common-substring', title: 'Longest Common Substring',
  statement: 'Given two strings, return a longest contiguous substring appearing in both. Example: ABABC and BABCA share BABC.',
  concepts: [
    'The initial lockstep pointers miss matches starting at different offsets, unless pointer reset logic explicitly explores these offsets.',
    'A valid solution can enumerate all offsets, enumerate start pairs, use dynamic programming on ending positions, or use another correct algorithm.',
    'For ending-position DP, matching characters extend the diagonal by one, while a mismatch resets the contiguous run to zero.',
    'Transfer to Maximum Length of Repeated Subarray: contiguous matching runs over integers, including shifted starts.'
  ],
  transfer: {
    title: 'Maximum Length of Repeated Subarray (LeetCode 718)',
    prompt: 'For integer arrays [1,2,3,2,1] and [3,2,1,4,7], explain how you would find the longest shared contiguous run. Which part of your method transfers, and what changes?'
  }
};
export function newSession(id = crypto.randomUUID()) {
  const opening = 'Before coding, describe the algorithm you would try for the longest common substring of ABABC and BABCA. What do the pointers or states represent?';
  return {
    id, problem: PROBLEM.id, phase: 'approach', evidence: [],
    learnerState: {currentApproach: null, activeGap: 'learner_approach', repairFocus: null,
      attemptsWithoutProgress: 0, supportHistory: []},
    transcript: [{role: 'coach', text: opening, action: 'PROBE', visual: null}],
    events: [{kind: 'session_started', phase: 'approach'}],
    turn: 0, lastAction: 'PROBE', complete: false
  };
}
function validatedEvidence(value, latestMessage) {
  return value && evidenceKinds.has(value.kind) && value.supported === true &&
    typeof value.quote === 'string' && value.quote.trim().length >= 8 &&
    latestMessage.toLowerCase().includes(value.quote.trim().toLowerCase()) &&
    typeof value.rationale === 'string' && value.rationale.trim().length >= 8;
}
function withProvenance(value, state, message) {
  return {...value, turn: state.turn, source: message, status: 'accepted'};
}
function addEvidence(state, item) {
  state.evidence.push(item); // append-only provenance; older evidence may later be marked disputed
  if (item.kind === 'approach_explained') state.learnerState.currentApproach = item.quote;
}
function recordSupport(state, action, from, to) {
  const progressed = from !== to;
  state.learnerState.attemptsWithoutProgress = progressed ? 0 : Math.min(100, state.learnerState.attemptsWithoutProgress + 1);
  state.learnerState.supportHistory.push({turn: state.turn, phase: from, action,
    outcome: progressed ? 'advanced' : 'no_advance'});
}
function adaptAction(action, state, interpreted, learnerText) {
  const attempts = state.learnerState.attemptsWithoutProgress;
  if (state.learnerState.repairFocus) return 'REPAIR';
  if (state.lastAction === 'OFFER_CHOICE' && attempts >= 5) {
    if (/visual|diagram|table|picture|grid/i.test(learnerText)) return 'VISUALISE';
    if (/smaller|example|counterexample|trace/i.test(learnerText)) return 'CHALLENGE';
    return 'HINT';
  }
  if (interpreted.requestsFullAnswer === true || (interpreted.requestsFullAnswer == null && interpreted.intent === 'request_answer')) return 'HINT';
  // Repeated failed abstraction attempts should not loop over the same template.
  if (action === 'ASK_ABSTRACTION' && attempts >= 2) return attempts >= 5 ? 'OFFER_CHOICE' : 'HINT';
  if (action === 'CLARIFY' && attempts >= 3) return 'OFFER_CHOICE';
  if (action === 'CLARIFY' || action === 'ASK_TRANSFER' || action === 'ASK_ABSTRACTION' || action === 'COMPLETE') return action;
  if (attempts >= 5) return 'OFFER_CHOICE';
  if (attempts >= 3) return 'VISUALISE';
  if (attempts >= 2 && (action === 'CHALLENGE' || action === 'PROBE')) return 'HINT';
  return action;
}
/**
 * This transition uses ONLY evidence grounded in the current learner message.
 * Ambiguous turns are excluded before storage. Historical evidence never advances a phase.
 * If a later response explicitly contradicts an earlier milestone, the phase is
 * paused with a targeted repair focus until fresh evidence addresses it.
 */
export function transition(previous, learnerText, interpretation = {}) {
  if (!learnerText || !learnerText.trim()) throw new Error('Learner message is required');
  if (previous.complete) throw new Error('Session is complete');
  const state = structuredClone(previous);
  state.turn += 1;
  state.transcript.push({role: 'learner', text: learnerText});
  const from = state.phase;
  const ambiguous = interpretation.ambiguous === true || interpretation.intent === 'unclear';
  const status = interpretation.status || 'unknown';
  const difficulty = status === 'stuck' || status === 'incorrect';
  // Evidence is assessed separately from requests for a complete answer. A mistaken
  // intent label must never erase a correct, quote-grounded reasoning explanation.
  const candidate = (Array.isArray(interpretation.evidence) ? interpretation.evidence : [])
    .filter(item => validatedEvidence(item, learnerText));
  const contradictions = !ambiguous && Array.isArray(interpretation.contradictions)
    ? interpretation.contradictions.filter(item => validatedEvidence(item, learnerText) &&
        state.evidence.some(old => old.kind === item.kind && old.status === 'accepted'))
    : [];
  let action = 'PROBE', reason = '', accepted = [];
  if (ambiguous) {
    action = 'CLARIFY';
    reason = 'Ambiguous interpretation: no evidence accepted or phase transition permitted';
  } else if (contradictions.length > 0) {
    const disputedKind = contradictions[0].kind;
    for (const old of state.evidence) if (old.kind === disputedKind && old.status === 'accepted') old.status = 'disputed';
    state.learnerState.repairFocus = disputedKind;
    state.learnerState.activeGap = disputedKind;
    action = 'REPAIR';
    reason = `New learner reasoning contradicts previously accepted ${disputedKind}`;
    state.events.push({kind: 'evidence_disputed', turn: state.turn, evidenceKind: disputedKind,
      quote: contradictions[0].quote});
  } else if (state.learnerState.repairFocus) {
    const focus = state.learnerState.repairFocus;
    const repairItem = candidate.find(item => item.kind === focus);
    if (repairItem) {
      const recorded = withProvenance(repairItem, state, learnerText);
      addEvidence(state, recorded);
      accepted = [recorded];
      state.learnerState.repairFocus = null;
      state.learnerState.activeGap = conceptByPhase[from] || null;
      action = 'PROBE';
      reason = `Repaired prerequisite ${focus}; return to current milestone without skipping it`;
    } else {
      action = 'REPAIR';
      reason = `Current prerequisite ${focus} remains unresolved`;
    }
  } else {
    const target = REQUIRED_EVIDENCE[from];
    const found = candidate.find(item => item.kind === target);
    if (found) {
      const recorded = withProvenance(found, state, learnerText);
      accepted = [recorded];
      addEvidence(state, recorded);
      const next = PHASES[PHASES.indexOf(from) + 1];
      state.phase = next;
      state.complete = next === 'complete';
      action = {gap:'CHALLENGE',solution:'PROBE',abstraction:'ASK_ABSTRACTION',transfer:'ASK_TRANSFER',complete:'COMPLETE'}[next];
      reason = `Latest learner message supports required checkpoint: ${target}`;
      state.learnerState.activeGap = conceptByPhase[next] || null;
    } else {
      action = from === 'approach' ? 'CLARIFY'
        : from === 'gap' ? (difficulty ? 'HINT' : 'CHALLENGE')
        : from === 'solution' ? (difficulty ? 'HINT' : 'PROBE')
        : from === 'abstraction' ? 'ASK_ABSTRACTION'
        : (difficulty ? 'HINT' : 'FEEDBACK');
      reason = `No new grounded ${target} evidence on this turn`;
    }
  }
  // An unsuccessful response changes the support strategy, never the milestone.
  recordSupport(state, action, from, state.phase);
  if (accepted.length && from === state.phase) state.learnerState.attemptsWithoutProgress = 0; // successful prerequisite repair
  if (state.phase === from) action = adaptAction(action, state, interpretation, learnerText);
  // An explicit answer request with NO qualifying evidence receives a hint. It must
  // not suppress accepted current-turn evidence, repair, or completion.
  const requestedAnswer = interpretation.requestsFullAnswer === true || (interpretation.requestsFullAnswer == null && interpretation.intent === 'request_answer');
  if (requestedAnswer && state.phase === from && !state.learnerState.repairFocus && !ambiguous) {
    action = 'HINT'; reason = 'Answer request without qualifying evidence does not bypass the learning checkpoint';
  }
  state.learnerState.supportHistory.at(-1).action = action;
  state.lastAction = action;
  const eventEvidence = accepted.map(item => ({kind: item.kind, quote: item.quote}));
  state.events.push({kind:'interpretation',turn:state.turn,intent:interpretation.intent || 'unknown',
    status,ambiguous,requestsFullAnswer:requestedAnswer,evidence:eventEvidence,repairFocus:state.learnerState.repairFocus});
  state.events.push({kind:'policy_decision',turn:state.turn,from,to:state.phase,action,reason,
    attemptsWithoutProgress:state.learnerState.attemptsWithoutProgress});
  return {state, decision:{action,from,to:state.phase,reason,evidence:accepted}};
}
export function attachReply(state, reply) {
  const next = structuredClone(state);
  next.transcript.push({role:'coach',text:reply.text,action:next.lastAction,visual:reply.visual ?? null});
  next.events.push({kind:'coach_reply',turn:next.turn,action:next.lastAction,text:reply.text,visual:reply.visual ?? null,source:reply.source||'unknown'});
  return next;
}
export function validateReply(reply, decision) {
  if (!reply || typeof reply.text !== 'string' || !reply.text.trim()) return false;
  if (reply.text.length > 900 || (reply.visual != null && !['offset','dp'].includes(reply.visual))) return false;
  const t = reply.text;
  if (/```|\bdef\s+\w+\s*\(|\bclass\s+Solution\b|\breturn\s+s1\s*\[|\bfor\s+\w+\s+in\s+range\s*\(/i.test(t)) return false;
  if (decision.action !== 'COMPLETE' && /(?:here is|here's|the full|complete)\s+(?:the\s+)?(?:solution|code|implementation)/i.test(t)) return false;
  // Keep gap support focused on alignment coverage and transfer support on the
  // named near-transfer task rather than unrelated implementation details.
  if (decision.to === 'gap' && /\b(?:initializ(?:e|ation)|boundar(?:y|ies)|out.of.bounds|first row|first column)\b/i.test(t)) return false;
  if (decision.to === 'transfer' && ['HINT','FEEDBACK'].includes(decision.action) &&
      /\b(?:negative numbers?|zeros?|new (?:constraints?|problems?))\b/i.test(t)) return false;
  return true;
}
export function fallbackReply(state, decision) {
  let text;
  switch (decision.action) {
    case 'CLARIFY': text = 'Could you clarify exactly what the two pointers or states represent, and how they change after a mismatch?'; break;
    case 'CHALLENGE': text = 'Test your approach on shifted starting positions: how does it discover BABC in ABABC and BABCA? Explain which alignments it checks.'; break;
    case 'HINT': text = state.phase === 'transfer' ? 'For the given integer arrays, explain what your state represents, how it changes for equal versus unequal elements, and how you find the longest run.' : state.phase === 'abstraction' ? 'Beyond the strings in this example, which property of matching endpoints and contiguous runs makes your method reusable?' :state.phase === 'solution' ? 'Check whether your method covers every starting alignment without allowing gaps. Can you state its invariant?' : 'Trace one counterexample and identify precisely which possible match your rule misses.';break;
    case 'VISUALISE': text = state.phase === 'solution' ? 'This DP grid tracks contiguous runs ending at each pair. What would a mismatch do to that run?' : 'Compare BABC at the two shifted offsets. What does your original approach need to examine to find it?'; break;
    case 'REPAIR': text = 'Your latest reasoning conflicts with an earlier explanation. Can you recheck that assumption on a concrete counterexample before we continue?'; break;
    case 'OFFER_CHOICE': text = 'We seem to be revisiting the same gap. Would a smaller example, a visual trace, or a more specific hint help? You can also explain which step is unclear.'; break;
    case 'ASK_ABSTRACTION': text = 'Without repeating code or changing problems yet, what invariant or reusable principle makes your method correct? Explain when this principle would be useful.'; break;
    case 'ASK_TRANSFER': text = PROBLEM.transfer.prompt; break;
    case 'FEEDBACK': text = 'Which specific state or comparison rule would you reuse for the integer-array example? Explain how you would handle both an equal pair and a mismatch.'; break;
    case 'COMPLETE': text = 'You correctly applied your approach to contiguous matching runs in integer arrays, including how matching and mismatching elements affect the run. This completes the learning activity; it does not by itself establish long-term mastery.'; break;
    default: text = state.phase === 'solution' ? 'Describe your full method in words and justify why it handles all starting alignments and contiguity.' : 'Explain your next reasoning step and how it relates to your original idea.';
  }
  return {text, visual: decision.action === 'CHALLENGE' || (decision.action === 'VISUALISE' && state.phase === 'gap') ? 'offset'
    : decision.action === 'VISUALISE' && state.phase === 'solution' ? 'dp' : null};
}
export function publicState(state) {
  return {id:state.id,problem:state.problem,phase:state.phase,evidence:state.evidence,
    learnerState:state.learnerState,transcript:state.transcript,events:state.events,
    turn:state.turn,complete:state.complete};
}
