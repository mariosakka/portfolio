const P="mms-portfolio",B=`https://firestore.googleapis.com/v1/projects/${P}/databases/mms-portfolio/documents`;
const un=v=>{const [t,x]=Object.entries(v)[0];
 if(t==='mapValue')return Object.fromEntries(Object.entries(x.fields||{}).map(([k,y])=>[k,un(y)]));
 if(t==='arrayValue')return (x.values||[]).map(un);
 if(t==='integerValue')return +x; if(t==='nullValue')return null; return x;};
const doc=d=>({id:d.name.split('/').pop(),...Object.fromEntries(Object.entries(d.fields||{}).map(([k,y])=>[k,un(y)]))});
import fs from 'fs'; fs.mkdirSync('export',{recursive:true});
for(const c of ['experience','projects','education','certificates','organizations','portfolio']){
 const r=await fetch(`${B}/${c}?pageSize=300`); const j=await r.json();
 if(!r.ok){console.log(c,r.status,j.error?.message);continue}
 const docs=(j.documents||[]).map(doc); fs.writeFileSync(`export/${c}.json`,JSON.stringify(docs,null,2)); console.log(c,docs.length);
}
