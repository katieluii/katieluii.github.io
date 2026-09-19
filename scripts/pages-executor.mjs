#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createPublicKey, verify } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { documentBytes, sha256 } from './atlas-release-authorization.mjs';
export const DOMAIN = 'atlas-pages-dispatch-v1\n';
export const CODES = ['breast','mm','nsclc','obesity','parkinsons','urothelial'];
export function need(ok, code) { if (!ok) throw new Error(code); }
export function verifyDispatch(envelope, publicKey, expected, now = Date.now()) {
  const data=Buffer.from(envelope.payload_base64,'base64'), key=createPublicKey(publicKey);
  need(key.asymmetricKeyType==='ed25519' && verify(null,Buffer.concat([Buffer.from(DOMAIN),data]),key,Buffer.from(envelope.signature,'base64')),'DISPATCH_SIGNATURE');
  const p=JSON.parse(data); need(documentBytes(p).equals(data),'DISPATCH_CANONICAL');
  need(p.schema_version===1 && /^[a-f0-9]{40}$/.test(p.source_commit) && /^[a-f0-9-]{36}$/.test(p.lease),'DISPATCH_SCHEMA');
  need(p.repository===expected.repository && p.source_commit===expected.sourceCommit && p.lease===expected.lease && expected.attempt===1,'DISPATCH_CONTEXT');
  need(Date.parse(p.issued_at)<=now && now<Date.parse(p.expires_at),'DISPATCH_EXPIRED');
  need(sha256(documentBytes(p.manifest))===p.site_manifest_sha256,'DISPATCH_MANIFEST_HASH');
  need(p.mode==='six-indication' || p.mode==='safe-unpublished','DISPATCH_MODE');
  need(JSON.stringify(p.manifest.indications)===JSON.stringify(p.mode==='six-indication'?CODES:[]),'DISPATCH_SCOPE');
  if(p.mode==='six-indication')need(p.manifest.source_commit===p.source_commit,'MANIFEST_COMMIT');
  if(p.mode==='safe-unpublished')need(p.manifest.mode==='safe-unpublished'&&p.manifest.reader_compatible===true,'FALLBACK_QUALIFICATION');
  return p;
}
function inventory(root) {
  const files=[];
  const visit=(dir,prefix='')=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix+item.name;need(!item.isSymbolicLink(),'SITE_SYMLINK');if(item.isDirectory())visit(path.join(dir,item.name),rel+'/');else{need(item.isFile(),'SITE_FILE_TYPE');files.push(rel);}}};
  visit(root);return files.sort();
}
export function verifiedFiles(root,manifest) {
  need(manifest.schema_version===1&&Array.isArray(manifest.files)&&manifest.files.length>0,'SITE_SCHEMA');
  const names=manifest.files.map(x=>x.path);need(new Set(names).size===names.length&&JSON.stringify([...names].sort())===JSON.stringify(inventory(root)),'SITE_COMPLETE_INVENTORY');
  let total=0;
  return manifest.files.map(item=>{need(typeof item.path==='string'&&!path.isAbsolute(item.path)&&!item.path.includes('\\')&&item.path.split('/').every(p=>p&&p!=='.'&&p!=='..'),'SITE_PATH');const full=path.join(root,item.path);const fd=fs.openSync(full,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let data;try{data=fs.readFileSync(fd);}finally{fs.closeSync(fd);}total+=data.length;need(total<=100*1024*1024&&sha256(data)===item.sha256,'SITE_BYTES');return {...item,data};});
}
export function prepareCheckedSite(p,buildRoot,checkedRoot) {
  need(!fs.existsSync(checkedRoot),'CHECKED_ROOT_ALREADY_EXISTS');
  let files;
  if(p.mode==='safe-unpublished'){
    need(Array.isArray(p.fallback_files)&&p.fallback_files.length===2,'FALLBACK_FILES');
    need(JSON.stringify(p.fallback_files.map(f=>f.path).sort())===JSON.stringify(['404.html','index.html']),'FALLBACK_ONLY_INDEX_404');
    files=p.fallback_files.map(f=>({...f,data:Buffer.from(f.base64,'base64')}));
    need(files.every(f=>sha256(f.data)===f.sha256),'FALLBACK_BYTES');
    need(JSON.stringify(files.map(({path,sha256})=>({path,sha256})).sort((a,b)=>a.path.localeCompare(b.path)))===JSON.stringify([...p.manifest.files].sort((a,b)=>a.path.localeCompare(b.path))),'FALLBACK_MANIFEST');
  }else files=verifiedFiles(buildRoot,p.manifest);
  fs.mkdirSync(checkedRoot,{mode:0o700});
  for(const file of files){const full=path.join(checkedRoot,file.path);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,file.data,{flag:'wx',mode:0o444});}
  verifiedFiles(checkedRoot,p.manifest);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  try{
    const env=process.env, envelope=JSON.parse(env.ATLAS_SIGNED_DISPATCH||'null');
    need(env.ATLAS_AUTHORITY_PUBLIC_KEY,'MISSING_ENROLLED_AUTHORITY_KEY');
    const actual=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',timeout:10000}).trim();
    const p=verifyDispatch(envelope,env.ATLAS_AUTHORITY_PUBLIC_KEY,{repository:env.GITHUB_REPOSITORY,sourceCommit:actual,lease:env.ATLAS_LEASE,attempt:Number(env.GITHUB_RUN_ATTEMPT)});
    need(actual===env.GITHUB_SHA,'WORKFLOW_COMMIT_MISMATCH');
    const action=process.argv[2];
    if(action==='prepare')prepareCheckedSite(p,path.resolve('dist'),path.join(env.RUNNER_TEMP,'atlas-checked-site'));
    else if(action==='recheck')verifiedFiles(path.join(env.RUNNER_TEMP,'atlas-checked-site'),p.manifest);
    else need(action==='verify','UNKNOWN_EXECUTOR_COMMAND');
    process.stdout.write(JSON.stringify({status:'PASS',mode:p.mode,source_commit:p.source_commit,site_manifest_sha256:p.site_manifest_sha256})+'\n');
    if(env.GITHUB_OUTPUT)fs.appendFileSync(env.GITHUB_OUTPUT,`mode=${p.mode}\n`);
  }catch(error){process.stderr.write(JSON.stringify({status:'BLOCKED',reason:error.message})+'\n');process.exitCode=1;}
}
