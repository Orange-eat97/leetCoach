/** Deterministic representations of the fixed Knapsack learning example.
 * Only partial data are shown so a hint does not reveal the complete solution.
 */
type Props={type:'knapsack-greedy'|'knapsack-dp'}

export default function KnapsackVisual({type}:Props){
 if(type==='knapsack-greedy')return <div className="lc-visual" role="img" aria-label="Greedy ratio order A, B, C; A plus B yields weight 30 and value 160, leaving capacity 20. Other feasible selections have not been shown.">
  <strong>Greedy ratio trace (not necessarily optimal)</strong>
  <table style={{width:'100%',textAlign:'left',borderSpacing:7}}><thead><tr><th>Item</th><th>Weight</th><th>Value</th><th>Value / weight</th></tr></thead><tbody>
   <tr><td>A</td><td>10</td><td>60</td><td>6.0</td></tr><tr><td>B</td><td>20</td><td>100</td><td>5.0</td></tr><tr><td>C</td><td>30</td><td>120</td><td>4.0</td></tr>
  </tbody></table>
  <p>The ratio-first rule picks A then B: weight 30, value 160. The remaining capacity is 20. Is a different valid selection better?</p>
 </div>;
 const capacities=[0,10,20,30],items=[{w:10,v:60},{w:20,v:100}];
 const dp=Array.from({length:items.length+1},()=>Array(31).fill(0));
 for(let i=1;i<=items.length;i++)for(let w=0;w<=30;w++){const item=items[i-1];dp[i][w]=Math.max(dp[i-1][w],w>=item.w?item.v+dp[i-1][w-item.w]:-Infinity);}
 return <div className="lc-visual" role="img" aria-label="Partial 0/1 knapsack DP table showing only items A and B and capacities zero, ten, twenty and thirty; does not reveal optimal capacity-fifty solution.">
  <strong>Partial DP state: first i items, capacity w</strong>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'center',borderSpacing:7}}><thead><tr><th>i / w</th>{capacities.map(w=><th key={w}>{w}</th>)}</tr></thead><tbody>{dp.map((r,i)=><tr key={i}><th>{i}</th>{capacities.map(w=><td key={w} style={{background:i>0?'#dcfce7':'#f1f5f9'}}>{r[w]}</td>)}</tr>)}</tbody></table></div>
  <p>For each new item, compare skipping it with taking it (only if it fits). This is a partial illustration, not the full answer.</p>
 </div>;
}
