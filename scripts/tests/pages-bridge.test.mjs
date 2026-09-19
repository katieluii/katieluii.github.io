import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {documentBytes,sha256} from '../atlas-release-authorization.mjs';
import {verifyDispatch,prepareCheckedSite,CODES,DOMAIN} from '../pages-executor.mjs';
import {createPagesUpload,checkEnvironment,protectedJournal,waitForRenderedReceipt} from '../pages-controller.mjs';
// All identity, key, API, deployment and DOM values below are synthetic fixtures.
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-pages-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const keys=generateKeyPairSync('ed25519'),pub=keys.publicKey.export({type:'spki',format:'pem'});
  const signer=(payload,domain)=>{const bytes=documentBytes(payload);return {payload_base64:bytes.toString('base64'),signature:sign(null,Buffer.concat([Buffer.from(domain),bytes]),keys.privateKey).toString('base64')};};
  const commit='a'.repeat(40),lease='12345678-1234-1234-1234-123456789abc',body=Buffer.from('synthetic qualified site');
  const manifest={schema_version:1,source_commit:commit,indications:CODES,files:[{path:'index.html',sha256:sha256(body)}]};
  const snapshot={lease,authorization_expires_at:new Date(Date.now()+600000).toISOString(),source_commit:commit,site_manifest_sha256:sha256(documentBytes(manifest)),files:[{...manifest.files[0],base64:body.toString('base64')}]};
  let clock=Date.now(),approved=false,dispatches=0;
  const environment={id:99,name:'github-pages',protection_rules:[{type:'required_reviewers',prevent_self_review:false,reviewers:[{type:'User',reviewer:{id:123}}]}],deployment_branch_policy:{protected_branches:false,custom_branch_policies:true}};
  const policySha=sha256(documentBytes(environment));
  const run={id:55,workflow_id:44,head_sha:commit,run_attempt:1,actor:{id:123},display_title:`atlas-pages-${lease}`};
  const api=async(endpoint,opt={})=>{
    if(endpoint==='user')return {id:123};
    if(endpoint.includes('/deployments?'))return approved?[{id:77},{id:66}]:[{id:66}];
    if(endpoint.includes('/environments/'))return environment;
    if(endpoint.includes('/commits/'))return {sha:commit};
    if(endpoint.endsWith('/dispatches')){dispatches++;return null;}
    if(endpoint.includes('/runs?'))return {workflow_runs:[run]};
    if(endpoint.endsWith('/pending_deployments')){if(opt.method==='POST'){approved=true;return [{id:77,sha:commit,environment:'github-pages'}];}return [{environment:{id:99,name:'github-pages'},current_user_can_approve:true}];}
    if(endpoint.endsWith('/actions/runs/55'))return {...run,status:approved?'completed':'waiting',conclusion:approved?'success':null};
    if(endpoint.endsWith('/statuses'))return [{state:'success'}];throw new Error(`Unexpected fixture API ${endpoint}`);
  };
  const logs=[];
  const cfg={repository:'synthetic/repo',workflowId:44,controllerUserId:123,environment:'github-pages',environmentPolicySha:policySha,expectedPredecessorDeploymentId:66,dispatchRef:'reviewed-ref',manifest,baseUrl:'https://example.invalid/',authorityPublicKey:pub,expiresAt:new Date(clock+600000).toISOString(),timeoutMs:600000,
    assertLease:()=>{},journal:()=>((event,data)=>logs.push({event,...data})),signEnvelope:signer,
    verifyRoutes:async binding=>({status:'PASS',verification_method:'live-browser-dom',mode:binding.mode,lease:binding.lease,run_id:binding.runId,deployment_id:binding.deploymentId,verified_at:new Date(clock).toISOString(),source_commit:binding.sourceCommit,site_manifest_sha256:binding.siteManifestSha,indications:CODES,preview_boundaries:true,excluded_routes:true,source_links:true,catalogue:true})};
  const services={api,now:()=>clock,wait:async ms=>{clock+=ms;},fetchBytes:async()=>body};
  const p={schema_version:1,repository:cfg.repository,source_commit:commit,lease,mode:'six-indication',issued_at:new Date(clock-1000).toISOString(),expires_at:cfg.expiresAt,manifest,site_manifest_sha256:snapshot.site_manifest_sha256};
  return {dir,cfg,services,p,signer,pub,snapshot,body,environment,run,logs,get dispatches(){return dispatches},get approved(){return approved}};
}
test('executor verifies external signature, commit, expiry, scope and refuses reruns',t=>{const f=fixture(t),e=f.signer(f.p,DOMAIN),context={repository:f.cfg.repository,sourceCommit:f.snapshot.source_commit,lease:f.snapshot.lease,attempt:1};assert.equal(verifyDispatch(e,f.pub,context).mode,'six-indication');assert.throws(()=>verifyDispatch(e,f.pub,{...context,attempt:2}),/DISPATCH_CONTEXT/);assert.throws(()=>verifyDispatch(e,f.pub,context,Date.parse(f.p.expires_at)),/DISPATCH_EXPIRED/);e.signature=Buffer.alloc(64).toString('base64');assert.throws(()=>verifyDispatch(e,f.pub,context),/DISPATCH_SIGNATURE/);});
test('executor freezes exact built bytes and rejects extra artifacts',t=>{const f=fixture(t),dist=path.join(f.dir,'dist');fs.mkdirSync(dist);fs.writeFileSync(path.join(dist,'index.html'),f.body);prepareCheckedSite(f.p,dist,path.join(f.dir,'checked'));assert.deepEqual(fs.readFileSync(path.join(f.dir,'checked/index.html')),f.body);fs.writeFileSync(path.join(dist,'private.json'),'private');assert.throws(()=>prepareCheckedSite(f.p,dist,path.join(f.dir,'checked2')),/SITE_COMPLETE_INVENTORY/);});
test('fallback deploys signed index and404 only without rebuilding normaldist',t=>{const f=fixture(t),files=['404.html','index.html'].map(p=>({path:p,sha256:sha256(Buffer.from('synthetic unpublished')),base64:Buffer.from('synthetic unpublished').toString('base64')}));const p={...f.p,mode:'safe-unpublished',manifest:{schema_version:1,mode:'safe-unpublished',reader_compatible:true,indications:[],files:files.map(({path,sha256})=>({path,sha256}))},fallback_files:files};prepareCheckedSite(p,path.join(f.dir,'absent-dist'),path.join(f.dir,'fallback'));assert.deepEqual(fs.readdirSync(path.join(f.dir,'fallback')).sort(),['404.html','index.html']);});
test('controller correlates exact run, approves gated environment, hashes everyasset and binds DOM receipt before signedoutcome',async t=>{const f=fixture(t),out=await createPagesUpload(f.cfg,f.services)(f.snapshot),p=JSON.parse(Buffer.from(out.payload_base64,'base64'));assert.equal(p.status,'VERIFIED_LIVE');assert.equal(p.deployment_id,'77');assert.equal(f.dispatches,1);assert.equal(f.approved,true);assert.ok(f.logs.find(x=>x.event==='run_bound'));assert.ok(f.logs.find(x=>x.event==='live_verified'));});
test('missing required reviewer gate prevents dispatch',async t=>{const f=fixture(t);f.environment.protection_rules=[];await assert.rejects(createPagesUpload(f.cfg,f.services)(f.snapshot),/REQUIRED_CONTROLLER_REVIEW_GATE/);assert.equal(f.dispatches,0);});
test('ref drift and duplicate lease runs fail before approval',async t=>{const f=fixture(t),api=f.services.api;await assert.rejects(createPagesUpload(f.cfg,{...f.services,api:(p,o)=>p.includes('/commits/')?{sha:'b'.repeat(40)}:api(p,o)})(f.snapshot),/DISPATCH_REF_DRIFT/);assert.equal(f.dispatches,0);await assert.rejects(createPagesUpload(f.cfg,{...f.services,api:(p,o)=>p.includes('/runs?')?{workflow_runs:[f.run,{...f.run,id:56}]}:api(p,o)})(f.snapshot),/DUPLICATE_LEASE_RUNS/);assert.equal(f.approved,false);});
test('unknown dispatch API result is recorded and never automatically retried',async t=>{const f=fixture(t),api=f.services.api;await assert.rejects(createPagesUpload(f.cfg,{...f.services,api:(p,o)=>{if(p.endsWith('/dispatches'))throw new Error('provider network unknown');return api(p,o);}})(f.snapshot),/provider network unknown/);assert.equal(f.logs.at(-1).event,'unknown_or_failed');assert.equal(f.approved,false);});
test('bounded poll timeout does not sign success',async t=>{const f=fixture(t),api=f.services.api;f.cfg.timeoutMs=10;await assert.rejects(createPagesUpload(f.cfg,{...f.services,api:(p,o)=>p.includes('/runs?')?{workflow_runs:[]}:api(p,o)})(f.snapshot),/PAGES_PROVIDER_TIMEOUT/);assert.equal(f.approved,false);});
test('successful CI with changed live bytes fails',async t=>{const f=fixture(t);await assert.rejects(createPagesUpload(f.cfg,{...f.services,fetchBytes:async()=>Buffer.from('wrong site')})(f.snapshot),/LIVE_ASSET_MISMATCH/);assert.ok(!f.logs.some(x=>x.event==='live_verified'));});
test('DOM receipt from another lease/run cannot authorize outcome',async t=>{const f=fixture(t),valid=f.cfg.verifyRoutes;f.cfg.verifyRoutes=async b=>({...await valid(b),run_id:999});await assert.rejects(createPagesUpload(f.cfg,f.services)(f.snapshot),/LIVE_ROUTE_ACCEPTANCE_FAILED/);});
test('protected provider journal refuses replay of same lease',t=>{const f=fixture(t),open=protectedJournal(f.dir),log=open(f.snapshot.lease);log('synthetic_test',{run_id:55});assert.throws(()=>open(f.snapshot.lease),/EEXIST/);});
test('DOM receipt requires real protected evidence hash and exact deploymentbinding',async t=>{const f=fixture(t),dir=path.join(f.dir,'rendered-receipts');fs.mkdirSync(dir);const evidence=Buffer.from('SYNTHETIC TEST DOM EVIDENCE');fs.writeFileSync(path.join(dir,'fixture.txt'),evidence);const binding={lease:f.snapshot.lease,sourceCommit:f.snapshot.source_commit,siteManifestSha:f.snapshot.site_manifest_sha256,runId:55,deploymentId:77,notBefore:Date.now()-1000};const receipt={verification_method:'live-browser-dom',lease:binding.lease,source_commit:binding.sourceCommit,site_manifest_sha256:binding.siteManifestSha,run_id:55,deployment_id:77,verified_at:new Date().toISOString(),evidence:[{path:'fixture.txt',sha256:sha256(evidence)}]};fs.writeFileSync(path.join(dir,`${binding.lease}.json`),JSON.stringify(receipt));assert.equal((await waitForRenderedReceipt(f.dir,100)(binding)).run_id,55);await assert.rejects(waitForRenderedReceipt(f.dir,100)({...binding,runId:56}),/RENDERED_RECEIPT_BINDING/);});

test('production predecessor drift and active foreign deployment block dispatch',async t=>{const f=fixture(t),api=f.services.api;f.cfg.expectedPredecessorDeploymentId=65;await assert.rejects(createPagesUpload(f.cfg,f.services)(f.snapshot),/PROVIDER_PREDECESSOR_DRIFT/);assert.equal(f.dispatches,0);f.cfg.expectedPredecessorDeploymentId=66;await assert.rejects(createPagesUpload(f.cfg,{...f.services,api:(p,o)=>p.endsWith('/deployments/66/statuses')?[{state:'in_progress',log_url:'https://github.com/synthetic/repo/actions/runs/999'}]:api(p,o)})(f.snapshot),/CONCURRENT_OR_UNRESOLVED_PRODUCTION_DEPLOYMENT/);assert.equal(f.dispatches,0);});
