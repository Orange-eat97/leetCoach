export type Phase = 'approach'|'gap'|'solution'|'abstraction'|'transfer'|'complete'
export type Evidence = {kind:string; quote:string; rationale:string; turn:number; source:string}
export type CoachTurn = {role:'coach'|'learner';text:string;action?:string; visual?:'offset'|'dp'|'knapsack-greedy'|'knapsack-dp'|null}
export type CoachSession = {id:string; problem:string; phase:Phase; evidence:Evidence[]; transcript:CoachTurn[]; events:Record<string,unknown>[];turn:number;complete:boolean}
export class CoachApiError extends Error {session?:CoachSession;diagnostic?:Record<string,unknown>;constructor(message:string,body:Record<string,unknown>){super(message);this.name='CoachApiError';this.session=body.session as CoachSession|undefined;this.diagnostic=body.diagnostic as Record<string,unknown>|undefined}}
const json = async (response:Response) => {const body=await response.json();if(!response.ok)throw new CoachApiError(String(body.error||'Request failed'),body);return body}
export async function startSession(problem='zero-one-knapsack'):Promise<{session:CoachSession;mode:string}>{return json(await fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({problem})}))}
export async function sendMessage(id:string,text:string):Promise<{session:CoachSession;mode:string;decision:{action:string;reason:string;from:Phase;to:Phase}}>{return json(await fetch(`/api/sessions/${encodeURIComponent(id)}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})}))}
