#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createPrivateKey,createPublicKey,sign } from 'node:crypto';
import { deployWithAuthorization, deployRollbackWithAuthorization } from './atlas-release-boundary.mjs';
import { documentBytes,sha256 } from './atlas-release-authorization.mjs';
import { createPagesUpload,protectedJournal,protectedLeaseGuard,waitForRenderedReceipt } from './pages-controller.mjs';

// No enrollment or key generation. Inputs are operator-provisioned protected files.
const authorityRoot=process.env.ATLAS_PRODUCTION_AUTHORITY_ROOT;
if(!authorityRoot||!path.isAbsolute(authorityRoot))throw new Error('MISSING_PROTECTED_AUTHORITY_ROOT');
const config=JSON.parse(fs.readFileSync(path.join(authorityRoot,'pages-controller-config.json')));
const stateBytes=fs.readFileSync(path.join(authorityRoot,'production-state.json'));
const state=JSON.parse(Buffer.from(JSON.parse(stateBytes).payload_base64,'base64'));
const publicKey=fs.readFileSync(path.join(authorityRoot,'authority-public-key.pem'),'utf8');
const privateKey=createPrivateKey(fs.readFileSync(path.join(authorityRoot,'authority-private-key.pem')));
if(createPublicKey(privateKey).export({type:'spki',format:'pem'})!==createPublicKey(publicKey).export({type:'spki',format:'pem'}))throw new Error('ENROLLED_AUTHORITY_KEY_MISMATCH');
const rollback=config.operation==='safe-unpublished';
const manifestBytes=fs.readFileSync(path.join(config.packageRoot,rollback?'rollback-manifest.json':'site-manifest.json'));
const manifest=JSON.parse(manifestBytes);
if(!documentBytes(manifest).equals(manifestBytes))throw new Error('NONCANONICAL_SITE_MANIFEST');
const signEnvelope=async(payload,domain)=>{
  if(!['atlas-pages-dispatch-v1\n','atlas-deployment-outcome-v1\n'].includes(domain))throw new Error('UNSUPPORTED_PROVIDER_SIGNATURE_DOMAIN');
  const data=documentBytes(payload);return {payload_base64:data.toString('base64'),signature:sign(null,Buffer.concat([Buffer.from(domain),data]),privateKey).toString('base64')};
};
const upload=createPagesUpload({...config,mode:rollback?'safe-unpublished':'six-indication',manifest,authorityPublicKey:publicKey,
  expiresAt:state.trusted.valid_until,timeoutMs:780000,assertLease:protectedLeaseGuard(authorityRoot,sha256(stateBytes)),
  journal:protectedJournal(authorityRoot),signEnvelope,verifyRoutes:waitForRenderedReceipt(authorityRoot,120000)});
try{
  const result=await (rollback?deployRollbackWithAuthorization:deployWithAuthorization)({packageRoot:config.packageRoot,checkoutRoot:config.checkoutRoot,authorityRoot,expectedCommit:config.sourceCommit,timeoutMs:900000},upload);
  process.stdout.write(JSON.stringify(result)+'\n');
}catch(error){process.stderr.write(JSON.stringify({status:'BLOCKED_OR_QUARANTINED',reason:error.message})+'\n');process.exitCode=1;}
