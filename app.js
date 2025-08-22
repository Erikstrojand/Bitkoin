
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, runTransaction,
  query, where, limit, getDocs, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAJUtUPmktXnkh4agB3Bq40gKGWSC73rGM",
  authDomain: "bitkoin-b9ebc.firebaseapp.com",
  projectId: "bitkoin-b9ebc",
  storageBucket: "bitkoin-b9ebc.firebasestorage.app",
  messagingSenderId: "752112888101",
  appId: "1:752112888101:web:305ad8a0c7ad5ae76812cc"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const $ = (id)=>document.getElementById(id);
const show = (el, yes=true)=>{ el.classList.toggle('hidden', !yes); };
const msg = (el, text, type='ok')=>{
  el.innerHTML = text ? `<div class="alert ${type==='error'?'err':'ok'}">${text}</div>` : '';
};
const nice = (s)=>new Option(s).innerHTML;
const handleToEmail = (handle)=> `${handle.slice(1).toLowerCase()}@bitkoin.local`;

function normalizeHandle(input){
  let h = (input||'').trim();
  if(!h) return null;
  if(h[0] !== '@') h = '@'+h;
  const core = h.slice(1);
  const lower = core.toLowerCase();
  const valid = /^[a-z0-9_]{3,16}$/.test(lower);
  if(!valid) return null;
  return '@'+lower;
}
async function sha256Hex(str){
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function formatDate(ts){
  if (!ts) return '—';
  const d = typeof ts.toDate === 'function' ? ts.toDate() : ts;
  try { return d.toLocaleString(); } catch { return String(d); }
}


const puzzles = [
  { id:'p1', q:"Who's my favorite friend?", a:"Bunna" },
  { id:'p2', q:"White Dumass?", a:"Snocap" },

  { id:'p3', q:"What has keys but can’t open locks?", a:"keyboard" },
  { id:'p4', q:"What has hands but can’t clap?", a:"clock" },
  { id:'p5', q:"What gets wetter the more it dries?", a:"towel" },
  { id:'p6', q:"What has a head, a tail, is brown, and has no legs?", a:"penny" },
  { id:'p7', q:"What can travel around the world while staying in a corner?", a:"stamp" },
  { id:'p8', q:"What has many teeth but can’t bite?", a:"comb" },
  { id:'p9', q:"The more you take, the more you leave behind. What am I?", a:"footsteps" },
  { id:'p10', q:"What belongs to you but is used more by others?", a:"name" },
  { id:'p11', q:"What can fill a room but takes up no space?", a:"light" },
  { id:'p12', q:"What has one eye but can’t see?", a:"needle" },
  { id:'p13', q:"What goes up but never comes down?", a:"age" },
  { id:'p14', q:"What is so fragile that saying its name breaks it?", a:"silence" },
  { id:'p15', q:"I speak without a mouth and hear without ears. What am I?", a:"echo" },
  { id:'p16', q:"What has cities, rivers, and roads but no people?", a:"map" },
  { id:'p17', q:"What has a neck but no head?", a:"bottle" },
  { id:'p18', q:"Feed me and I live; give me a drink and I die. What am I?", a:"fire" },
  { id:'p19', q:"What runs but never walks, has a bed but never sleeps?", a:"river" },
  { id:'p20', q:"What can you catch but not throw?", a:"cold" },
  { id:'p21', q:"What has many rings but no fingers?", a:"tree" },
  { id:'p22', q:"I’m tall when young and short when old. What am I?", a:"candle" },
  { id:'p23', q:"What has words but never speaks?", a:"book" },
  { id:'p24', q:"What has roots as nobody sees, is taller than trees, up it goes yet never grows?", a:"mountain" },
  { id:'p25', q:"What invention lets you look right through a wall?", a:"window" },
  { id:'p26', q:"The more there is, the less you see. What is it?", a:"darkness" },
  { id:'p27', q:"What can you break without touching?", a:"promise" },
  { id:'p28', q:"What has ears but cannot hear?", a:"corn" },
  { id:'p29', q:"What has a thumb and four fingers but isn’t alive?", a:"glove" },
  { id:'p30', q:"What kind of room has no doors or windows?", a:"mushroom" },
  { id:'p31', q:"What begins with T, ends with T, and has T in it?", a:"teapot" },
  { id:'p32', q:"If you drop me I’m sure to crack, but give me a smile and I’ll smile back. What am I?", a:"mirror" },
  { id:'p33', q:"What has a heart that doesn’t beat?", a:"artichoke" },
  { id:'p34', q:"What can you keep after giving to someone?", a:"your word" },
  { id:'p35', q:"What has an eye but cannot see and is raging in a storm?", a:"hurricane" },
  { id:'p36', q:"What comes once in a minute, twice in a moment, but never in a thousand years?", a:"m" },
  { id:'p37', q:"What begins with an E, ends with an E, but only has one letter in it?", a:"envelope" },
  { id:'p38', q:"What is always in front of you but can’t be seen?", a:"future" },
  { id:'p39', q:"What building has the most stories?", a:"library" },
  { id:'p40', q:"What is full of holes but still holds water?", a:"sponge" },
  { id:'p41', q:"What goes through cities and fields but never moves?", a:"road" },
  { id:'p42', q:"What flies without wings and cries without eyes?", a:"cloud" },
  { id:'p43', q:"What starts with P and ends with E and has a thousand letters?", a:"post office" },
  { id:'p44', q:"Forward I’m heavy, backward I’m not. What am I?", a:"ton" },
  { id:'p45', q:"If two’s company and three’s a crowd, what are four and five?", a:"nine" },
  { id:'p46', q:"I shave every day, but my beard stays the same. Who am I?", a:"barber" },
  { id:'p47', q:"You see me once in June, twice in November, and not at all in May. What am I?", a:"e" },
  { id:'p48', q:"I have branches, but no fruit, trunk, or leaves. What am I?", a:"bank" },
  { id:'p49', q:"What’s always running but never late?", a:"nose" },
  { id:'p50', q:"What has legs but doesn’t walk?", a:"table" },
  { id:'p51', q:"What’s at the end of a rainbow?", a:"w" },
  { id:'p52', q:"I’m not alive, but I grow; I don’t have lungs, but I need air. What am I?", a:"fire" },
  { id:'p53', q:"The more you have of me, the less you see. What am I?", a:"darkness" },
  { id:'p54', q:"What can one catch that is not thrown and makes you sneeze?", a:"cold" },
  { id:'p55', q:"Which weighs more, a pound of feathers or a pound of bricks?", a:"neither" },
  { id:'p56', q:"What disappears as soon as you say its name?", a:"silence" },
  { id:'p57', q:"What runs around a house but doesn’t move?", a:"fence" },
  { id:'p58', q:"What tastes better than it smells?", a:"tongue" },
  { id:'p59', q:"What five-letter word becomes shorter when you add two letters?", a:"short" },
  { id:'p60', q:"What has a ring but no finger and wakes you up?", a:"alarm" },
  { id:'p61', q:"What can you hold in your left hand but not in your right?", a:"right elbow" },
  { id:'p62', q:"What has four fingers and a thumb but is not alive?", a:"glove" },
  { id:'p63', q:"Where does today come before yesterday?", a:"dictionary" },
  { id:'p64', q:"What has a bed but never sleeps and a mouth but never eats?", a:"river" },
  { id:'p65', q:"What has a spine but no bones and is often read?", a:"book" },
  { id:'p66', q:"What gets bigger the more you take away?", a:"hole" },
  { id:'p67', q:"What has an end but no beginning, a home but no family, and a space without a room?", a:"keyboard" },
  { id:'p68', q:"What comes down but never goes up?", a:"rain" },
  { id:'p69', q:"What invention makes you able to walk through walls?", a:"door" },
  { id:'p70', q:"If I have it, I don’t share it; if I share it, I don’t have it. What is it?", a:"secret" },
  { id:'p71', q:"What has a face and two hands but no arms or legs?", a:"clock" },
  { id:'p72', q:"What can be cracked, made, told, and played?", a:"joke" },
  { id:'p73', q:"What flies when it’s born, lies when it’s alive, and runs when it’s dead?", a:"snowflake" },
  { id:'p74', q:"What has one head, one foot, and four legs?", a:"bed" },
  { id:'p75', q:"What has four wheels and flies?", a:"garbage truck" },
  { id:'p76', q:"Take one out and scratch my head, I am now black but once was red. What am I?", a:"match" },
  { id:'p77', q:"What has two hands, a round face, but no arms or legs?", a:"clock" },
  { id:'p78', q:"What can run but never walks and has a mouth but never talks?", a:"river" },
  { id:'p79', q:"What’s always in season but never out of style and found in the produce aisle?", a:"reason" },
  { id:'p80', q:"What begins with an E but only contains one letter?", a:"envelope" },
  { id:'p81', q:"Where do you find roads without cars and forests without trees?", a:"map" },
  { id:'p82', q:"What can’t talk but will reply when spoken to?", a:"echo" },
  { id:'p83', q:"What has many needles but doesn’t sew?", a:"pine tree" },
  { id:'p84', q:"What has a ring but isn’t jewelry and lives underground?", a:"earthworm" },
  { id:'p85', q:"What kind of coat is always wet when you put it on?", a:"paint" },
  { id:'p86', q:"What do you bury when it’s alive and dig up when it’s dead?", a:"plant" },
  { id:'p87', q:"I follow you all the time but can’t touch you. What am I?", a:"shadow" },
  { id:'p88', q:"What has no beginning, end, or middle?", a:"circle" },
  { id:'p89', q:"What can be in a minute and in a moment but never in a thousand years?", a:"m" },
  { id:'p90', q:"What has an end and a start but is never complete and is measured but unseen?", a:"time" }
];

let currentPuzzle = null;
function pickPuzzle(){
  currentPuzzle = puzzles[Math.floor(Math.random()*puzzles.length)];
  $('quizQ').textContent = currentPuzzle.q;
  $('quizA').value = '';
  $('mineMsg').innerHTML = '';
}


let me = { uid:null, handle:null };
let myCoins = [];


function onSignedIn(){
  $('hdrHandle').textContent = me.handle || 'Signed in';
  $('meHandle').textContent = me.handle || '';
  $('meUid').textContent = me.uid;
  show($('btnLogout'), true);
  show($('authSection'), false);
  show($('appSection'), true);
  pickPuzzle();
  refreshCoins();
}
function onSignedOut(){
  $('hdrHandle').textContent = 'Not signed in';
  show($('btnLogout'), false);
  show($('appSection'), false);
  show($('authSection'), true);
  $('meBalance').textContent = '0';
  $('coinList').innerHTML = '';
}


async function refreshCoins(){
  if(!me.uid) return;
  const qCoins = query(collection(db,'coins'), where('ownerUid','==', me.uid), limit(500));
  const snapCoins = await getDocs(qCoins);
  myCoins = [];
  snapCoins.forEach(d=> myCoins.push({ id:d.id, ...d.data() }));

  $('meBalance').textContent = String(myCoins.length);

  $('coinList').innerHTML = myCoins.map(c=>{
    const idShort = c.id ? c.id.slice(0,10)+'…' : '(no id)';
    const minted = formatDate(c.mintedAt);
    const moved  = c.transferredAt ? formatDate(c.transferredAt) : '—';
    const puzzle = c.puzzleId || '—';
    const value  = typeof c.value === 'number' ? c.value : 1;

    return `
      <div class="item">
        <div class="mono"># ${idShort}</div>
        <small>
          value: ${value} BK • minted: ${minted}${c.transferredAt ? ` • last transfer: ${moved}` : ''} • puzzle: ${nice(puzzle)}
        </small>
      </div>
    `;
  }).join('') || '<div class="muted">No coins yet. Mine one above.</div>';
}


onAuthStateChanged(auth, async (user)=>{
  if(!user){ me={uid:null,handle:null}; onSignedOut(); return; }
  me.uid = user.uid;

  
  const uref = doc(db,'users', user.uid);
  let usnap = await getDoc(uref);
  if(!usnap.exists()){
    await setDoc(uref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), balance:0 });
    usnap = await getDoc(uref);
  }
  let handle = usnap.data()?.handle;

  if(!handle){
    
    const qh = query(collection(db,'handles'), where('uid','==', user.uid), limit(1));
    const hres = await getDocs(qh);
    if(!hres.empty){
      const hdoc = hres.docs[0];
      handle = hdoc.data().handle || ('@'+hdoc.id);
      await setDoc(uref, { handle, handleLower: handle.slice(1), updatedAt: serverTimestamp() }, { merge:true });
    }
  }

  me.handle = handle || '(no handle)';
  onSignedIn();
});


$('btnCreate').addEventListener('click', async ()=>{
  msg($('regMsg'),'');
  const h = normalizeHandle($('regHandle').value);
  const pw = $('regPass').value;
  if(!h){ msg($('regMsg'),'Handle must be 3–16 chars (a–z, 0–9, _)','error'); return; }
  if(!pw || pw.length < 6){ msg($('regMsg'),'Password must be at least 6 characters','error'); return; }
  const email = handleToEmail(h);

  
  const hRef = doc(db,'handles', h.slice(1));
  if((await getDoc(hRef)).exists()){ msg($('regMsg'),'That handle is taken.','error'); return; }

  try{
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    const uid = cred.user.uid;
    await runTransaction(db, async (tx)=>{
      
      const hh = doc(db,'handles', h.slice(1));
      const hx = await tx.get(hh);
      if(hx.exists()) throw new Error('Handle just got taken.');
      const uref = doc(db,'users', uid);
      
      tx.set(hh, { uid, handle:h, createdAt: serverTimestamp() });
      tx.set(uref, { handle:h, handleLower:h.slice(1), balance:0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    msg($('regMsg'),`Wallet created for ${nice(h)}.`,'ok');
  }catch(err){
    console.error(err);
    if(auth.currentUser){ try{ await deleteUser(auth.currentUser); }catch(_){} }
    msg($('regMsg'), err.message || 'Failed to create wallet','error');
  }
});


$('btnLogin').addEventListener('click', async ()=>{
  msg($('loginMsg'),'');
  const h = normalizeHandle($('loginHandle').value);
  const pw = $('loginPass').value;
  if(!h){ msg($('loginMsg'),'Enter a valid handle like @alice','error'); return; }
  if(!pw){ msg($('loginMsg'),'Enter password','error'); return; }
  try{
    await signInWithEmailAndPassword(auth, handleToEmail(h), pw);
    msg($('loginMsg'),'Logged in.','ok');
  }catch(err){ msg($('loginMsg'), err.message || 'Login failed','error'); }
});


$('btnLogout').addEventListener('click', async ()=>{
  try{ await signOut(auth); } finally { window.location.reload(); }
});


$('btnNextQ').addEventListener('click', pickPuzzle);
$('btnMine').addEventListener('click', async ()=>{
  if(!me.uid){ msg($('mineMsg'),'Sign in first','error'); return; }
  const ans = ($('quizA').value||'').trim().toLowerCase();
  if(!currentPuzzle) pickPuzzle();
  if(ans !== currentPuzzle.a.toLowerCase()){ msg($('mineMsg'),'Incorrect. Try again.','error'); return; }

  try{
    $('btnMine').disabled = true;
    const seed = `${me.uid}:${Date.now()}:${Math.random()}:${currentPuzzle.id}`;
    const hash = await sha256Hex(seed);
    const coinRef = doc(db,'coins', hash);

    await runTransaction(db, async (tx)=>{
      
      tx.set(coinRef, {
        id:hash,
        ownerUid:me.uid,
        ownerHandle:me.handle,
        value:1,
        mintedAt: serverTimestamp(),
        puzzleId: currentPuzzle.id
      });
      tx.set(doc(db,'users', me.uid), { balance: increment(1), updatedAt: serverTimestamp() }, { merge:true });
    });

    msg($('mineMsg'),`Minted 1 BK • ${hash.slice(0,10)}…`,'ok');
    pickPuzzle();
    refreshCoins();
  }catch(err){
    console.error(err);
    msg($('mineMsg'), err.message || 'Mint failed','error');
  } finally{
    $('btnMine').disabled = false;
  }
});


$('btnSend').addEventListener('click', async ()=>{
  if(!me.uid){ msg($('sendMsg'),'Sign in first','error'); return; }
  const dest = normalizeHandle($('payTo').value);
  const amt = parseInt(($('payAmt').value||'').trim(),10);
  const memo = ($('payMemo').value||'').trim();

  if(!dest){ msg($('sendMsg'),'Enter a valid @handle','error'); return; }
  if(dest === me.handle){ msg($('sendMsg'),'Cannot send to yourself','error'); return; }
  if(!amt || amt < 1){ msg($('sendMsg'),'Amount must be a positive integer','error'); return; }

  
  if(myCoins.length < amt){ msg($('sendMsg'),`Insufficient funds. You have ${myCoins.length} BK`,'error'); return; }

  try{
    $('btnSend').disabled = true;

    
    const hRef = doc(db,'handles', dest.slice(1));
    const hSnap = await getDoc(hRef);
    if(!hSnap.exists()){ msg($('sendMsg'),'Recipient handle not found','error'); return; }
    const recipientUid = hSnap.data().uid;

    const coinIds = myCoins.slice(0, amt).map(c=>c.id);

    await runTransaction(db, async (tx)=>{
      
      const coinRefs = coinIds.map(id=>doc(db,'coins', id));
      const coinSnaps = [];
      for(const cRef of coinRefs){
        const snap = await tx.get(cRef);
        if(!snap.exists()) throw new Error('Coin missing during transfer');
        if(snap.data().ownerUid !== me.uid) throw new Error('Double-spend detected');
        coinSnaps.push({ ref:cRef });
      }

      
      for(const c of coinSnaps){
        tx.update(c.ref, {
          ownerUid: recipientUid,
          ownerHandle: dest,
          transferredAt: serverTimestamp()
        });
      }
      tx.set(doc(db,'users', me.uid), { balance: increment(-amt), updatedAt: serverTimestamp() }, { merge:true });
      tx.set(doc(db,'users', recipientUid), { balance: increment(amt), updatedAt: serverTimestamp() }, { merge:true });
    });

    msg($('sendMsg'),`Sent ${amt} BK to ${nice(dest)}.`,'ok');
    $('payAmt').value = '';
    $('payMemo').value = '';
    refreshCoins();
  }catch(err){
    console.error(err);
    msg($('sendMsg'), err.message || 'Send failed','error');
  } finally{
    $('btnSend').disabled = false;
  }
});



$('btnAllTx').addEventListener('click', ()=>{
  window.location.href = "transactions.html";
});