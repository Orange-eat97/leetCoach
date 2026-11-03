/** Evidence-gated tutor engine. Pure policy/controller; no model or HTTP dependency. */
export const PHASES = ['approach', 'gap', 'solution', 'abstraction', 'transfer', 'complete'];
export const ACTIONS = ['CLARIFY', 'PROBE', 'HINT', 'CHALLENGE', 'ASK_ABSTRACTION', 'ASK_TRANSFER', 'FEEDBACK', 'COMPLETE'];
const evidenceKinds = ['approach_explained', 'assumptions_clarified', 'limitation_explained', 'correct_method', 'principle_explained', 'transfer_applied'];
const necessary = {approach: 'approach_explained', gap: 'limitation_explained', solution: 'correct_method', abstraction: 'principle_explained', transfer: 'transfer_applied'};
export const PROBLEM = {
  id: 'longest-common-substring', title: 'Longest Common Substring',
  statement: 'Given two strings, return a longest contiguous substring appearing in both. Example: ABABC and BABCA share BABC.',
  concepts: [
    'The initial lockstep pointers miss matches starting at different offsets, unless pointer reset logic explicitly explores these offsets.',
    'A valid solution can enumerate all offsets, enumerate start pairs, use dynamic programming on ending positions, or use another correct algorithm.',
    'For ending-position DP, matching characters extend the diagonal by one, while a mismatch resets the contiguous run to zero.',
    'Transfer to Maximum Length of Repeated Subarray: contiguous matching runs over integers, including shifted starts.'
  ],
  transfer: {title: 'Maximum Length of Repeated Subarray (LeetCode 718)', prompt: 'For integer arrays [1,2,3,2,1] and [3,2,1,4,7], explain how you would find the longest shared contiguous run. Which part of your method transfers, and what changes?'}
};
export function newSession(id = crypto.randomUUID()) {
  const opening = 'Before coding, describe the algorithm you would try for the longest common substring of ABABC and BABCA. What do the pointers or states represent?';
  return {id, problem: PROBLEM.id, phase: 'approach', evidence: [], transcript: [{role:'coach', text:opening, action:'PROBE', visual:null}], events: [{kind:'session_started', phase:'approach'}], turn:0, lastAction:'PROBE', complete:false};
}
function validEvidence(x, source) {
  return x && evidenceKinds.includes(x.kind) && x.supported === true && typeof x.quote === 'string' && x.quote.trim().length >= 8 && source.toLowerCase().includes(x.quote.trim().toLowerCase()) && typeof x.rationale === 'string' && x.rationale.trim().length >= 8;
}
export function transition(previous, learnerText, interpretation) {
  if (!learnerText || !learnerText.trim()) throw new Error('Learner message is required');
  if (previous.complete) throw new Error('Session is complete');
  const state = structuredClone(previous);
  state.turn += 1;
  state.transcript.push({role:'learner', text:learnerText});
  const phaseEvidence = {approach:['approach_explained'],gap:['limitation_explained'],solution:['correct_method'],abstraction:['principle_explained'],transfer:['transfer_applied']};
  const accepted = (interpretation.evidence || []).filter(e => phaseEvidence[state.phase]?.includes(e.kind) && validEvidence(e, learnerText)).map(e => ({...e, turn:state.turn, source: learnerText}));
  // Evidence cannot be backfilled from a supposed confidence score or coach statements.
  for (const item of accepted) if (!state.evidence.some(e=> e.kind === item.kind && e.quote === item.quote)) state.evidence.push(item);
  const has = k => state.evidence.some(e => e.kind === k);
  const old = state.phase;
  const ambiguous = interpretation.ambiguous === true || interpretation.intent === 'unclear';
  const difficulty = interpretation.status === 'stuck' || interpretation.status === 'incorrect';
  const isShortcut = interpretation.intent === 'request_answer';
  let action = 'PROBE';
  let reason = '';
  if (ambiguous) {action = 'CLARIFY'; reason = 'Interpretation remains ambiguous';}
  else if (state.phase === 'approach') {
    if (has('approach_explained')) {state.phase='gap'; action='CHALLENGE'; reason='Learner stated an identifiable approach';}
    else {action='CLARIFY'; reason='No evidenced approach yet';}
  } else if (state.phase === 'gap') {
    if (has('limitation_explained')) {state.phase='solution'; action='PROBE'; reason='Learner explained a relevant limitation or correctness condition';}
    else {action = difficulty ? 'HINT' : 'CHALLENGE'; reason='A reasoning gap has not been explained';}
  } else if (state.phase === 'solution') {
    if (has('correct_method')) {state.phase='abstraction'; action='ASK_ABSTRACTION'; reason='Learner justified a viable algorithm';}
    else {action=difficulty ? 'HINT':'PROBE'; reason='Need a justified algorithm, not a confidence claim';}
  } else if (state.phase === 'abstraction') {
    if (has('principle_explained')) {state.phase='transfer'; action='ASK_TRANSFER'; reason='Learner expressed a reusable principle';}
    else {action='ASK_ABSTRACTION'; reason='No learner-authored abstraction demonstrated';}
  } else if (state.phase === 'transfer') {
    if (has('transfer_applied')) {state.phase='complete'; state.complete=true; action='COMPLETE'; reason='Learner applied a principle to an unseen variant';}
    else {action=difficulty ? 'HINT':'FEEDBACK'; reason='Transfer response requires justification';}
  }
  if (isShortcut && !state.complete) {action = 'HINT'; reason = 'Answer request cannot bypass evidence requirements';}
  state.lastAction=action;
  state.events.push({kind:'interpretation', turn:state.turn, intent:interpretation.intent, status:interpretation.status, ambiguous, evidence:accepted.map(e=>({kind:e.kind,quote:e.quote}))});
  state.events.push({kind:'policy_decision', turn:state.turn, from:old, to:state.phase, action, reason});
  return {state, decision:{action, from:old, to:state.phase, reason, evidence:accepted}};
}
export function attachReply(state, reply) {
  const next = structuredClone(state);
  next.transcript.push({role:'coach', text:reply.text, action:next.lastAction, visual:reply.visual ?? null});
  next.events.push({kind:'coach_reply', turn:next.turn, action:next.lastAction, text:reply.text, visual:reply.visual ?? null});
  return next;
}
export function validateReply(reply, decision) {
  if (!reply || typeof reply.text !== 'string' || !reply.text.trim()) return false;
  if (reply.text.length > 900) return false;
  if (reply.visual != null && !['offset','dp'].includes(reply.visual)) return false;
  // Guardrail against full-code and unwarranted solved-answer delivery, regardless of model instruction.
  const t = reply.text;
  if (/```|\bdef\s+\w+\s*\(|\bclass\s+Solution\b|\breturn\s+s1\s*\[|\bfor\s+\w+\s+in\s+range\s*\(/i.test(t)) return false;
  if (decision.action !== 'COMPLETE' && /(?:here is|here's|the full|complete)\s+(?:the\s+)?(?:solution|code|implementation)/i.test(t)) return false;
  return true;
}
export function fallbackReply(state, decision, interpretation) {
  let text;
  switch (decision.action) {
    case 'CLARIFY': text='When you say that, which positions are compared after a mismatch? Tell me how your method changes its pointers or state.'; break;
    case 'CHALLENGE': text='Let us test your approach against shifted starting positions. In ABABC and BABCA, how would it discover BABC beginning at different indices?'; break;
    case 'HINT': text=state.phase==='transfer'?'Try tracing one shifted equal run in the two arrays. What must be remembered at each pair of positions?':state.phase==='solution'?'Consider whether every possible starting alignment is checked. Could a table of ending positions help, or could you scan each offset? Explain the invariant.':'Trace one counterexample step by step and identify exactly which match your rule skips.'; break;
    case 'ASK_ABSTRACTION': text='Without repeating the code, what general principle made your approach correct? Explain how it handles shifted starts and contiguity, and when you could reuse it.'; break;
    case 'ASK_TRANSFER': text=PROBLEM.transfer.prompt; break;
    case 'FEEDBACK': text='Which specific state or comparison rule transfers from the string problem, and why does it still work for integer arrays?'; break;
    case 'COMPLETE': text='Your explanation applies the principle to a related setting. This completes the tutoring activity; independent assessment would still be needed to establish lasting learning.'; break;
    default: text=state.phase==='solution'?'Propose a correct method and justify why it covers every possible starting alignment. What is its time complexity?':'What does your own method imply on the example? Explain your next step.';
  }
  return {text, visual: decision.action==='CHALLENGE' ? 'offset' : null};
}
export function publicState(state) {
  return {id:state.id, problem:state.problem, phase:state.phase, evidence:state.evidence, transcript:state.transcript, events:state.events, turn:state.turn, complete:state.complete};
}
