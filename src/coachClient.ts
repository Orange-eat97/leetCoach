export type Phase = 'approach'|'gap'|'solution'|'abstraction'|'transfer'|'complete'
export type Evidence = {kind:string; quote:string; rationale:string; turn:number; source:string}
export type CoachTurn = {role:'coach'|'learner';text:string;action?:string; visual?:'offset'|'dp'|null}
export type CoachSession = {id:string; phase:Phase; evidence:Evidence[]; transcript:CoachTurn[]; events:Record<string,unknown>[];turn:number;complete:boolean}
const json = async (response:Response) => {const body=await response.json();if(!response.ok)throw new Error(body.error||'Request failed');return body}
export async function startSession():Promise<{session:CoachSession;mode:string}>{return json(await fetch('/api/sessions',{method:'POST'}))}
export async function sendMessage(id:string,text:string):Promise<{session:CoachSession;mode:string;decision:{action:string;reason:string;from:Phase;to:Phase}}>{return json(await fetch(`/api/sessions/${encodeURIComponent(id)}/messages`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})}))}
