import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { documentBytes, sha256 } from './atlas-release-authorization.mjs';
import { CODES, DOMAIN, need, verifyDispatch } from './pages-executor.mjs';

export function ghApi(endpoint, { method='GET', body }={}) {
  return new Promise((resolve,reject)=>{
    const args=['api','--hostname','github.com','--method',method,'-H','Accept: application/vnd.github+json','-H','X-GitHub-Api-Version: 2022-11-28',endpoint];
    if(body!==undefined)args.push('--input','-');
    const child=spawn('gh',args,{stdio:['pipe','pipe','pipe']});let out='',err='',done=false;
    const timer=setTimeout(()=>{child.kill('SIGTERM');finish(new Error('GH_API_TIMEOUT'));},30000);
    function finish(error,value){if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(value);}
    child.on('error',finish);child.stdout.on('data',b=>{out+=b;if(out.length>2*1024*1024){child.kill('SIGTERM');finish(new Error('GH_API_OUTPUT_LIMIT'));}});
    child.stderr.on('data',b=>{err+=b;if(err.length>32768)err=err.slice(0,32768);});
    child.on('close',code=>{if(code!==0)return finish(new Error(`GH_API_FAILED_${code}: ${err}`));try{finish(null,out.trim()?JSON.parse(out):null);}catch(e){finish(e);}});
    child.stdin.end(body===undefined?'':JSON.stringify(body));
  });
}
export function protectedLeaseGuard(authorityRoot, expectedStateSha) {
  return snapshot=>{
    const stateBytes=fs.readFileSync(path.join(authorityRoot,'production-state.json'));
    need(sha256(stateBytes)===expectedStateSha,'CONTROLLER_AUTHORITY_STATE_CHANGED');
    const state=JSON.parse(Buffer.from(JSON.parse(stateBytes).payload_base64,'base64'));
    need(Date.now()<Date.parse(state.trusted.valid_until),'CONTROLLER_AUTHORITY_EXPIRED');
    const ledger=JSON.parse(fs.readFileSync(path.join(authorityRoot,'ledger.json'))),a=ledger.active;
    need(a?.status==='reserved'&&a.lease===snapshot.lease&&a.source_commit===snapshot.source_commit&&a.site_manifest_sha256===snapshot.site_manifest_sha256,'CONTROLLER_RESERVATION_CHANGED');
  };
}
export function protectedJournal(authorityRoot) {
  return lease=>{
    need(/^[a-f0-9-]{36}$/.test(lease),'JOURNAL_LEASE');
    const dir=path.join(authorityRoot,'provider-receipts');fs.mkdirSync(dir,{recursive:true,mode:0o700});
    const file=path.join(dir,`${lease}.jsonl`),fd=fs.openSync(file,'wx',0o600);
    fs.closeSync(fd);
    const dirfd=fs.openSync(dir,'r');try{fs.fsyncSync(dirfd);}finally{fs.closeSync(dirfd);}
    return (event,data)=>{const f=fs.openSync(file,'a');try{fs.writeFileSync(f,documentBytes({at:new Date().toISOString(),event,...data}));fs.fsyncSync(f);}finally{fs.closeSync(f);}};
  };
}
function environmentPolicy(environment) {
  return {id:environment.id,name:environment.name,protection_rules:environment.protection_rules,deployment_branch_policy:environment.deployment_branch_policy};
}
export function checkEnvironment(environment,cfg) {
  const rule=environment.protection_rules?.find(x=>x.type==='required_reviewers');
  need(environment.name===cfg.environment&&rule&&rule.prevent_self_review===false,'REQUIRED_CONTROLLER_REVIEW_GATE');
  need(rule.reviewers.length===1&&rule.reviewers[0].type==='User'&&rule.reviewers[0].reviewer.id===cfg.controllerUserId,'UNEXPECTED_ENVIRONMENT_REVIEWER');
  need(sha256(documentBytes(environmentPolicy(environment)))===cfg.environmentPolicySha,'ENVIRONMENT_POLICY_CHANGED');
}
export async function checkProductionPredecessor(api,cfg,allowedRunId=null) {
  need(Number.isSafeInteger(cfg.expectedPredecessorDeploymentId),'EXPECTED_PROVIDER_PREDECESSOR_REQUIRED');
  const base=`repos/${cfg.repository}`;
  const deployments=await api(`${base}/deployments?environment=${encodeURIComponent(cfg.environment)}&per_page=100`);
  need(Array.isArray(deployments)&&deployments.length>0,'PROVIDER_PREDECESSOR_UNRESOLVED');
  let successful;
  for(const deployment of deployments){
    const statuses=await api(`${base}/deployments/${deployment.id}/statuses`),last=statuses[0];
    if(!last||['queued','pending','in_progress'].includes(last.state)){
      const expectedRun=allowedRunId&&new RegExp(`/actions/runs/${allowedRunId}(?:/|$)`).test(last?.log_url??'');
      need(expectedRun,'CONCURRENT_OR_UNRESOLVED_PRODUCTION_DEPLOYMENT');
    }
    if(!successful&&last?.state==='success')successful=deployment.id;
  }
  need(successful===cfg.expectedPredecessorDeploymentId,'PROVIDER_PREDECESSOR_DRIFT');
}
export async function liveAssetBytes(url) {
  const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  need(response.status===200,'LIVE_ASSET_HTTP');
  const chunks=[];let count=0;
  for await(const chunk of response.body){count+=chunk.length;need(count<=100*1024*1024,'LIVE_ASSET_SIZE');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export function waitForRenderedReceipt(authorityRoot, timeoutMs=120000) {
  return async binding=>{
    need(/^[a-f0-9-]{36}$/.test(binding.lease),'RENDERED_RECEIPT_LEASE');
    const receiptPath=path.join(authorityRoot,'rendered-receipts',`${binding.lease}.json`),deadline=Date.now()+timeoutMs;
    while(Date.now()<deadline){
      if(fs.existsSync(receiptPath)){
        need(!fs.lstatSync(receiptPath).isSymbolicLink(),'RENDERED_RECEIPT_SYMLINK');
        const receipt=JSON.parse(fs.readFileSync(receiptPath));
        need(receipt.verification_method==='live-browser-dom'&&receipt.lease===binding.lease&&receipt.source_commit===binding.sourceCommit&&receipt.site_manifest_sha256===binding.siteManifestSha&&receipt.run_id===binding.runId&&String(receipt.deployment_id)===String(binding.deploymentId),'RENDERED_RECEIPT_BINDING');
        need(Date.parse(receipt.verified_at)>=binding.notBefore&&Date.parse(receipt.verified_at)<=Date.now(),'RENDERED_RECEIPT_FRESHNESS');
        need(Array.isArray(receipt.evidence)&&receipt.evidence.length>0,'RENDERED_EVIDENCE_REQUIRED');
        for(const item of receipt.evidence){
          need(typeof item.path==='string'&&!path.isAbsolute(item.path)&&item.path.split('/').every(p=>p&&p!=='.'&&p!=='..'),'RENDERED_EVIDENCE_PATH');
          const target=path.join(authorityRoot,'rendered-receipts',item.path);
          need(!fs.lstatSync(target).isSymbolicLink()&&sha256(fs.readFileSync(target))===item.sha256,'RENDERED_EVIDENCE_HASH');
        }
        return receipt;
      }
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    throw new Error('RENDERED_RECEIPT_TIMEOUT');
  };
}
export function createPagesUpload(cfg, services={}) {
  const api=services.api??ghApi,now=services.now??Date.now,wait=services.wait??(ms=>new Promise(resolve=>setTimeout(resolve,ms))),fetchBytes=services.fetchBytes??liveAssetBytes;
  need(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(cfg.repository)&&Number.isSafeInteger(cfg.workflowId)&&Number.isSafeInteger(cfg.controllerUserId),'PROVIDER_CONFIG');
  need(typeof cfg.assertLease==='function'&&typeof cfg.journal==='function'&&typeof cfg.signEnvelope==='function'&&typeof cfg.verifyRoutes==='function','TRUSTED_CONTROLLER_CALLBACKS_REQUIRED');
  need(new URL(cfg.baseUrl).protocol==='https:'&&!new URL(cfg.baseUrl).username,'TRUSTED_HTTPS_ORIGIN_REQUIRED');
  return async snapshot=>{
    const log=cfg.journal(snapshot.lease),start=now(),deadline=Math.min(start+(cfg.timeoutMs??780000),Date.parse(cfg.expiresAt),Date.parse(snapshot.authorization_expires_at));
    need(Number.isFinite(deadline),'AUTHORIZATION_DEADLINE_REQUIRED');
    const base=`repos/${cfg.repository}`,guard=()=>{need(now()<deadline,'PAGES_PROVIDER_TIMEOUT');cfg.assertLease(snapshot);};
    let runId,approved=false;
    try{
      guard();need(sha256(documentBytes(cfg.manifest))===snapshot.site_manifest_sha256,'PROVIDER_MANIFEST_MISMATCH');
      need(JSON.stringify(cfg.manifest.files.map(f=>({path:f.path,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path)))===JSON.stringify(snapshot.files.map(f=>({path:f.path,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path))),'PROVIDER_SNAPSHOT_INVENTORY');
      need(snapshot.files.every(f=>sha256(Buffer.from(f.base64,'base64'))===f.sha256),'PROVIDER_SNAPSHOT_BYTES');
      need((await api('user')).id===cfg.controllerUserId,'AUTHENTICATED_CONTROLLER_IDENTITY');
      checkEnvironment(await api(`${base}/environments/${encodeURIComponent(cfg.environment)}`),cfg);
      await checkProductionPredecessor(api,cfg);
      const commit=await api(`${base}/commits/${encodeURIComponent(cfg.dispatchRef)}`);need(commit.sha===snapshot.source_commit,'DISPATCH_REF_DRIFT');
      const p={schema_version:1,repository:cfg.repository,source_commit:snapshot.source_commit,lease:snapshot.lease,mode:cfg.mode??'six-indication',
        issued_at:new Date(start).toISOString(),expires_at:new Date(deadline).toISOString(),site_manifest_sha256:snapshot.site_manifest_sha256,manifest:cfg.manifest};
      if(p.mode==='safe-unpublished')p.fallback_files=snapshot.files;
      const envelope=await cfg.signEnvelope(p,DOMAIN);
      verifyDispatch(envelope,cfg.authorityPublicKey,{repository:cfg.repository,sourceCommit:snapshot.source_commit,lease:snapshot.lease,attempt:1},now());
      const dispatch={ref:cfg.dispatchRef,inputs:{source_commit:snapshot.source_commit,lease:snapshot.lease,signed_dispatch:JSON.stringify(envelope)}};
      need(Buffer.byteLength(JSON.stringify(dispatch.inputs))<=60000,'DISPATCH_INPUT_SIZE');
      guard();log('dispatch_requested',{source_commit:snapshot.source_commit,site_manifest_sha256:snapshot.site_manifest_sha256,dispatch_sha256:sha256(documentBytes(dispatch))});
      await api(`${base}/actions/workflows/${cfg.workflowId}/dispatches`,{method:'POST',body:dispatch});
      while(!runId){guard();const result=await api(`${base}/actions/workflows/${cfg.workflowId}/runs?event=workflow_dispatch&head_sha=${snapshot.source_commit}&per_page=100`);
        const matches=result.workflow_runs.filter(r=>r.display_title===`atlas-pages-${snapshot.lease}`);need(matches.length<=1,'DUPLICATE_LEASE_RUNS');
        if(matches.length){const r=matches[0];need(r.head_sha===snapshot.source_commit&&r.run_attempt===1&&r.actor.id===cfg.controllerUserId&&r.workflow_id===cfg.workflowId,'UNTRUSTED_RUN');runId=r.id;log('run_bound',{run_id:runId,head_sha:r.head_sha});}else await wait(3000);
      }
      let deploymentId;
      while(true){guard();const run=await api(`${base}/actions/runs/${runId}`);need(run.head_sha===snapshot.source_commit&&run.run_attempt===1&&run.workflow_id===cfg.workflowId,'RUN_CONTEXT_CHANGED');
        if(run.status==='completed'){need(approved&&run.conclusion==='success','WORKFLOW_NOT_SUCCESSFUL');break;}
        if(!approved){const pending=await api(`${base}/actions/runs/${runId}/pending_deployments`);const target=pending.filter(d=>d.environment.name===cfg.environment);
          if(target.length){need(target.length===1&&target[0].current_user_can_approve===true,'CONTROLLER_CANNOT_APPROVE_RUN');
            checkEnvironment(await api(`${base}/environments/${encodeURIComponent(cfg.environment)}`),cfg);
            const duplicateCheck=await api(`${base}/actions/workflows/${cfg.workflowId}/runs?event=workflow_dispatch&head_sha=${snapshot.source_commit}&per_page=100`);
            need(duplicateCheck.workflow_runs.filter(r=>r.display_title===`atlas-pages-${snapshot.lease}`).length===1,'DUPLICATE_LEASE_RUNS');
            await checkProductionPredecessor(api,cfg,runId);
            guard();log('approval_requested',{run_id:runId,environment_id:target[0].environment.id});
            const deployments=await api(`${base}/actions/runs/${runId}/pending_deployments`,{method:'POST',body:{environment_ids:[target[0].environment.id],state:'approved',comment:`Protected Atlas reservation ${snapshot.lease}; exact commit ${snapshot.source_commit}`}});
            const selected=deployments.filter(d=>d.sha===snapshot.source_commit&&d.environment===cfg.environment);need(selected.length===1,'DEPLOYMENT_ID_UNRESOLVED');deploymentId=selected[0].id;approved=true;log('environment_approved',{run_id:runId,deployment_id:deploymentId});
          }
        }
        await wait(3000);
      }
      guard();const statuses=await api(`${base}/deployments/${deploymentId}/statuses`);need(statuses[0]?.state==='success','DEPLOYMENT_NOT_SUCCESSFUL');
      const checked=[];
      for(const file of snapshot.files){guard();const u=new URL(file.path,cfg.baseUrl.endsWith('/')?cfg.baseUrl:cfg.baseUrl+'/');need(u.origin===new URL(cfg.baseUrl).origin,'LIVE_ORIGIN_ESCAPE');u.searchParams.set('atlas_verify',snapshot.lease);const body=await fetchBytes(u.href);need(sha256(body)===file.sha256,`LIVE_ASSET_MISMATCH:${file.path}`);checked.push({path:file.path,sha256:file.sha256});}
      guard();const renderedBinding={baseUrl:cfg.baseUrl,mode:p.mode,lease:snapshot.lease,runId,deploymentId,sourceCommit:snapshot.source_commit,siteManifestSha:snapshot.site_manifest_sha256,notBefore:now()};
      log('awaiting_rendered_verification',renderedBinding);
      const routes=await cfg.verifyRoutes(renderedBinding);
      need(routes.verification_method==='live-browser-dom'&&routes.lease===snapshot.lease&&routes.run_id===runId&&String(routes.deployment_id)===String(deploymentId)&&Date.parse(routes.verified_at)>=renderedBinding.notBefore&&Date.parse(routes.verified_at)<=now()&&routes.status==='PASS'&&routes.mode===p.mode&&routes.source_commit===snapshot.source_commit&&routes.site_manifest_sha256===snapshot.site_manifest_sha256,'LIVE_ROUTE_ACCEPTANCE_FAILED');
      if(p.mode==='six-indication')need(JSON.stringify(routes.indications)===JSON.stringify(CODES)&&routes.preview_boundaries===true&&routes.excluded_routes===true&&routes.source_links===true&&routes.catalogue===true,'LIVE_SIX_ACCEPTANCE_INCOMPLETE');
      else need(routes.indications.length===0&&routes.unpublished===true,'LIVE_FALLBACK_ACCEPTANCE_INCOMPLETE');
      guard();await checkProductionPredecessor(api,{...cfg,expectedPredecessorDeploymentId:deploymentId},runId);
      guard();log('live_verified',{run_id:runId,deployment_id:deploymentId,assets:checked,routes});
      const outcome={lease:snapshot.lease,source_commit:snapshot.source_commit,site_manifest_sha256:snapshot.site_manifest_sha256,status:'VERIFIED_LIVE',deployment_id:String(deploymentId),verified_at:new Date(now()).toISOString()};
      return await cfg.signEnvelope(outcome,'atlas-deployment-outcome-v1\n');
    }catch(error){log('unknown_or_failed',{run_id:runId??null,environment_approved:approved,reason:error.message});throw error;}
  };
}
