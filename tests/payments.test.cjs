const { test } = require('node:test');
const assert = require('node:assert/strict');
const { service, validateProduct, config, unseal } = require('../netlify/lib/payment.cjs');
const clock = Date.parse('2026-09-21T12:00:00+09:00');
const env = { PAYMENTS_ENABLED:'true', TOSS_CLIENT_KEY:'test_gck_shop', TOSS_SECRET_KEY:'test_gsk_shop', TOSS_MID:'spacew90od', TOSS_TAX_MODE:'exempt', ORDER_ENCRYPTION_KEY:Buffer.alloc(32, 7).toString('base64') };
const product = { id:'running', productType:'single', host:'테스트 호스트', place:'테스트 장소', title:'검증용 러닝', saleStatus:'open', price:3900,
  taxType:'exempt', taxVerified:true, included:['진행'], extraCosts:'없음', meetings:[{startAt:'2026-09-25T19:30:00+09:00',endAt:'2026-09-25T21:00:00+09:00'}], deadlineAt:'2026-09-24T19:30:00+09:00' };
const policy = {version:'test-policy',reviewed:true,effectiveAt:'2026-09-20T00:00:00+09:00'};
const input = {productId:'running',name:'테스트',phone:'010-1234-5678',email:'',policyVersion:policy.version,agreements:{refund:true,privacy:true,terms:true,once:true}};
function fixture(mode='ok', testProduct=product) {
  const records = new Map(); let version=0, calls=0, elapsed=0, failSave=false;
  const store = {
    async getWithMetadata(key) {return records.get(key) || null;},
    async setJSON(key,data,options={}) {
      if (failSave && unseal(data,env.ORDER_ENCRYPTION_KEY).status==='DONE') {failSave=false;throw Error('storage down');}
      if ((options.onlyIfNew && records.has(key)) || (options.onlyIfMatch && records.get(key)?.etag!==options.onlyIfMatch)) return {modified:false};
      const etag=String(++version);records.set(key,{data,etag});return {modified:true,etag};
    }
  };
  let completed;
  const fetcher=async(url, options)=>{
    if(options.method==='GET') return {ok:!!completed,json:async()=>completed || {code:'NOT_FOUND_PAYMENT'}};
    calls++; const b=JSON.parse(options.body);
    if(mode==='network') throw Error('timeout');
    completed={...b,totalAmount:b.amount,currency:'KRW',mid:mode==='mid'?'other':env.TOSS_MID,status:mode==='waiting'?'WAITING_FOR_DEPOSIT':'DONE',approvedAt:new Date(clock).toISOString(),method:'카드'};
    return {ok:true,json:async()=>completed};
  };
  return {api:service({store,env,fetcher,now:()=>clock+elapsed,products:[testProduct],policy}),records,
    calls:()=>calls, advance:ms=>{elapsed+=ms;}, failSave:()=>{failSave=true;}};
}
async function order(f){const o=await f.api.create(input);return {...o,paymentKey:'payment-key',amount:o.amount};}
test('stores encrypted applicant and immutable product/policy snapshot; ignores client price',async()=>{
  const f=fixture(),o=await f.api.create({...input,amount:1});assert.equal(o.amount,3900);
  const blob=f.records.get(o.orderId).data;assert.ok(!JSON.stringify(blob).includes('01012345678'));
  const stored=unseal(blob,env.ORDER_ENCRYPTION_KEY);assert.equal(stored.policy.version,policy.version);assert.equal(stored.applicant.phone,'01012345678');
});
test('approval and repeated confirmation only approve once',async()=>{const f=fixture(),o=await order(f);assert.equal((await f.api.confirm(o)).status,'DONE');await f.api.confirm(o);assert.equal(f.calls(),1);});
test('tampered amount, token, payment key and unknown order rejected',async()=>{
  const f=fixture(),o=await order(f);
  await assert.rejects(f.api.confirm({...o,amount:1}),/금액/);await assert.rejects(f.api.confirm({...o,token:'wrong'}),/주문/);
  await f.api.confirm(o);await assert.rejects(f.api.confirm({...o,paymentKey:'different'}),/다른/);
  await assert.rejects(f.api.confirm({...o,orderId:'pp_00000000-0000-0000-0000-000000000000'}),/주문/);
});
test('expired and closed orders never call approval',async()=>{const f=fixture(),o=await order(f);f.advance(30*60000);await assert.rejects(f.api.confirm(o),/유효시간/);assert.equal(f.calls(),0);});
test('pending deposit and wrong merchant never display success',async()=>{for(const mode of ['waiting','mid']){const f=fixture(mode),o=await order(f);await assert.rejects(f.api.confirm(o));assert.notEqual(unseal(f.records.get(o.orderId).data,env.ORDER_ENCRYPTION_KEY).status,'DONE');}});
test('network error retains reconcilable state',async()=>{const f=fixture('network'),o=await order(f);await assert.rejects(f.api.confirm(o),/지연/);assert.equal(unseal(f.records.get(o.orderId).data,env.ORDER_ENCRYPTION_KEY).status,'CONFIRMING');});
test('approval persisted after storage outage by lookup, even after order expiry',async()=>{const f=fixture(),o=await order(f);f.failSave();await assert.rejects(f.api.confirm(o));f.advance(31*60000);assert.equal((await f.api.confirm(o)).status,'DONE');assert.equal(f.calls(),1);});
test('concurrent confirmations do not issue duplicate approval',async()=>{const f=fixture(),o=await order(f);await Promise.allSettled([f.api.confirm(o),f.api.confirm(o)]);assert.equal(f.calls(),1);});
test('required consent, phone and policy mismatch rejected',async()=>{const f=fixture();for(const change of [{phone:'123'},{policyVersion:'old'},{agreements:{}}]) await assert.rejects(f.api.create({...input,...change}));});
test('draft, unreviewed policy and invalid dates blocked',()=>{
  validateProduct(product,clock,policy);
  for(const change of [{saleStatus:'draft'},{deadlineAt:'2026-09-25T19:00:00+09:00'},{taxType:null},{meetings:[]}])assert.throws(()=>validateProduct({...product,...change},clock,policy));
  assert.throws(()=>validateProduct(product,clock,{...policy,reviewed:false}));
});
test('live keys, docs keys and missing encryption key blocked',()=>{for(const change of [{TOSS_CLIENT_KEY:'live_gck_x'},{TOSS_CLIENT_KEY:'test_gck_docs_x'},{ORDER_ENCRYPTION_KEY:''}])assert.throws(()=>config({...env,...change}));});
test('live mode requires an explicit mode and matching live key prefixes for the merchant',()=>{
  const live = {...env,TOSS_MODE:'live',TOSS_CLIENT_KEY:'live_gck_shop',TOSS_SECRET_KEY:'live_gsk_shop'};
  assert.equal(config(live).mode,'live');
  assert.equal(config(env).mode,'test');
  for (const change of [{TOSS_MODE:'test'},{TOSS_MODE:'invalid'},{TOSS_SECRET_KEY:'test_gsk_shop'},{TOSS_CLIENT_KEY:'test_gck_shop'},{TOSS_MID:'other'},{PAYMENTS_ENABLED:'false'}])
    assert.throws(()=>config({...live,...change}));
});
test('990,000 won per-payment ceiling is inclusive',()=>{
  validateProduct({...product,price:990000},clock,policy);
  assert.throws(()=>validateProduct({...product,price:990001},clock,policy),/990,000/);
});
const term = {...product,productType:'term',termNumber:1,programId:'october',price:15600,purchaseScope:'1차수 총 4회',meetings:[
  {startAt:'2026-10-06T19:30:00+09:00',endAt:'2026-10-06T21:00:00+09:00'},
  {startAt:'2026-10-13T19:30:00+09:00',endAt:'2026-10-13T21:00:00+09:00'},
  {startAt:'2026-10-20T19:30:00+09:00',endAt:'2026-10-20T21:00:00+09:00'},
  {startAt:'2026-10-27T19:30:00+09:00',endAt:'2026-10-27T21:00:00+09:00'}],deadlineAt:'2026-10-05T19:30:00+09:00'};
test('term purchase saves and approves all four meetings for one total payment',async()=>{
  const f=fixture('ok',term),o=await order(f);assert.equal(o.amount,15600);assert.equal(o.meetings.length,4);
  const approved=await f.api.confirm(o);assert.equal(approved.meetingCount,4);assert.equal(approved.termNumber,1);assert.equal(f.calls(),1);
  assert.equal(unseal(f.records.get(o.orderId).data,env.ORDER_ENCRYPTION_KEY).product.meetings.length,4);
});
test('term rejects overlap, missing/end-invalid meetings, excess period and unsupported later term',()=>{
  for(const change of [{meetings:[term.meetings[0],term.meetings[0]]},{meetings:[...term.meetings,{startAt:'2026-11-05T19:30:00+09:00',endAt:'2026-11-05T21:00:00+09:00'}]},{termNumber:2},{meetings:[]}])
    assert.throws(()=>validateProduct({...term,...change},clock,policy));
});
test('calendar month boundary in February is excluded even at 28 days',()=>{
  const p={...term,deadlineAt:'2027-01-31T19:30:00+09:00',meetings:[{startAt:'2027-02-01T19:30:00+09:00',endAt:'2027-02-01T21:00:00+09:00'},{startAt:'2027-03-01T18:00:00+09:00',endAt:'2027-03-01T19:30:00+09:00'}]};
  assert.throws(()=>validateProduct(p,Date.parse('2027-01-25T00:00:00+09:00'),policy),/1개월/);
});
