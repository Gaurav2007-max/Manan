// ---- FIREBASE ----
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
    import { getFirestore, collection, addDoc, setDoc, doc, getDoc, getDocs, query, where, onSnapshot, updateDoc, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

    // Replace with your firebase config
    const firebaseConfig = {
        apiKey: "AIzaSyDJtmkCoy3cgn-0RKEyvxqbxEycvl29gZU",
        authDomain: "manan-a5cac.firebaseapp.com",
        projectId: "manan-a5cac",
        storageBucket: "manan-a5cac.firebasestorage.app",
        messagingSenderId: "749930441436",
        appId: "1:749930441436:web:e2bcc3dd932413d5862219",
        measurementId: "G-NC89F27XCQ"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // UI refs
    const modal = document.getElementById('modal');
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.getElementById('closeModal');
    const showSignIn = document.getElementById('showSignIn');
    const showSignUp = document.getElementById('showSignUp');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const doSignIn = document.getElementById('doSignIn');
    const doSignUp = document.getElementById('doSignUp');
    const siEmail = document.getElementById('siEmail');
    const siPass = document.getElementById('siPass');
    const suEmail = document.getElementById('suEmail');
    const suPass = document.getElementById('suPass');
    const suName = document.getElementById('suName');
    const suYear = document.getElementById('suYear');
    const suRoll = document.getElementById('suRoll');
    const suBranch = document.getElementById('suBranch');
    const siMsg = document.getElementById('siMsg');
    const suMsg = document.getElementById('suMsg');

    const adminArea = document.getElementById('adminArea');
    const adminContent = document.getElementById('adminContent');
    const openPending = document.getElementById('openPending');
    const openAddMember = document.getElementById('openAddMember');
    const openAddEvent = document.getElementById('openAddEvent');
    const openAddPhoto = document.getElementById('openAddPhoto');

    // other UI
    const leadersList = document.getElementById('leadersList');
    const membersGrid = document.getElementById('membersGrid');
    const eventsList = document.getElementById('eventsList');
    const fcCalendarEl = document.getElementById('fcCalendar');
    const googleCalendarEmbedWrap = document.getElementById('googleCalendarEmbed');
    const galleryGrid = document.getElementById('galleryGrid');

    // state
    let currentUser = null;
    let isAdmin = false;
    let fcCalendar = null;        // FullCalendar instance
    let fcEvents = [];           // events for FullCalendar

    // Show modal
    authBtn.addEventListener('click', () => {
        modal.classList.add('show');

        if (!currentUser) {
            document.getElementById('panelTitle').innerText = 'Authentication';
            authArea.style.display = 'block';
            adminArea.style.display = 'none';
            showSignIn.click();
        } else {
            if (isAdmin) {
                document.getElementById('panelTitle').innerText = 'Admin Panel';
                authArea.style.display = 'none';
                adminArea.style.display = 'block';
            } else {
                document.getElementById('panelTitle').innerText = 'You are logged in';
                authArea.style.display = 'none';
                adminArea.style.display = 'none';
            }
        }
    });

    // Logout button
      logoutBtn.addEventListener('click', async () => {
        try {
          await signOut(auth);
          location.href = 'index.html';   // redirect after logout
        } catch (e) {
          console.error('logout', e);
          alert('Logout failed');
        }
      });

    closeModal.addEventListener('click',()=>modal.classList.remove('show'));
    showSignIn.addEventListener('click',()=>{signInForm.style.display='block';signUpForm.style.display='none';siMsg.innerText='';});
    showSignUp.addEventListener('click',()=>{signInForm.style.display='none';signUpForm.style.display='block';suMsg.innerText='';});

    // Sign up
    doSignUp.addEventListener('click',async()=>{
      const name = suName.value.trim();
      const email = suEmail.value.trim();
      const pass = suPass.value;
      const year = suYear.value.trim();
      const roll = suRoll.value.trim();
      const branch = suBranch.value.trim();
      if(!name||!email||!pass){suMsg.innerText='Please fill name, email and password';return}
      try{
        const userCred = await createUserWithEmailAndPassword(auth,email,pass);
        await setDoc(doc(db,'pendingSignups',userCred.user.uid),{
          uid: userCred.user.uid,
          name, email, year, roll, branch, createdAt: new Date().toISOString()
        });
        suMsg.innerText='Signup requested. Wait for admin approval. You will get access once approved.';
      }catch(err){console.error(err);suMsg.innerText = err.message}
    });

    // Sign in
    doSignIn.addEventListener('click', async () => {
      const email = siEmail.value.trim();
      const pass = siPass.value;
      try {
          const cred = await signInWithEmailAndPassword(auth, email, pass);

          const adminRef = doc(db, 'admins', cred.user.uid);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            siMsg.innerText = 'Welcome Admin!';
            modal.classList.remove('show');
            return;
          }

          const memRef = doc(db, 'members', cred.user.uid);
          const memSnap = await getDoc(memRef);

          if (memSnap.exists()) {
            siMsg.innerText = 'Welcome Member!';
            modal.classList.remove('show');
            return;
          }

          siMsg.innerText = 'Your signup is not approved yet. Contact admin.';
          await signOut(auth);

      } catch (err) {
          console.error(err);
          siMsg.innerText = err.message;
      }
    });

    // Forgot password
    document.getElementById('forgotPass').addEventListener('click',async()=>{
      const email = siEmail.value.trim();
      if(!email){siMsg.innerText='Enter your email first.';return}
      try{await sendPasswordResetEmail(auth,email);siMsg.innerText='Password reset email sent.'}catch(e){siMsg.innerText=e.message}
    });

    // Auth state & admin detection
    import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js').then(({onAuthStateChanged})=>{
      onAuthStateChanged(auth, async user=>{
        currentUser = user;
        if(user){
          try{
            const q = doc(db,'admins',user.uid);
            const byUid = await getDoc(q);
            if(byUid.exists()) isAdmin = true;
            else{
              const adminsCol = collection(db,'admins');
              const allAdmins = await getDocs(adminsCol);
              isAdmin = false;
              allAdmins.forEach(d=>{const data=d.data(); if(data.email && data.email.toLowerCase()===user.email.toLowerCase()) isAdmin=true});
            }
          }catch(e){console.error('admin check',e)}
          authBtn.innerText = 'Signed in as '+(user.displayName||user.email);
          logoutBtn.style.display = 'inline-block';
          if(isAdmin) showAdminPanel();
        }else{
          isAdmin=false; currentUser=null; authBtn.innerText='Login / Signup'; hideAdminPanel();
          logoutBtn.style.display = 'none';
        }
      });
    });

    function showAdminPanel(){adminArea.style.display='block';}
    function hideAdminPanel(){adminArea.style.display='none';}

    // Admin actions: pending / add member / events / photos
    openPending.addEventListener('click',async()=>{
      adminContent.innerHTML = '<h4>Pending Signups</h4><div id="pendingList">Loading...</div>';
      const pendingCol = collection(db,'pendingSignups');
      const snap = await getDocs(pendingCol);
      const list = document.getElementById('pendingList'); list.innerHTML='';
      if(snap.empty){list.innerText='No pending signups.'}
      snap.forEach(docSnap=>{
        const d = docSnap.data();
        const el = document.createElement('div'); el.className='member-card';
        el.innerHTML = `<div style="flex:1"><strong>${d.name}</strong><div style='font-size:13px;color:var(--muted)'>${d.email}<br>Year: ${d.year} | ${d.branch} | Roll: ${d.roll}</div></div>
          <div style='display:flex;gap:6px'><button class='btn approve' data-id='${docSnap.id}'>Approve</button><button class='btn deny' data-id='${docSnap.id}'>Deny</button></div>`;
        list.appendChild(el);
      });

      list.addEventListener('click',async(ev)=>{
        if(ev.target.classList.contains('approve')){
          const id = ev.target.dataset.id;
          const docRef = doc(db,'pendingSignups',id);
          const docSnap = await getDoc(docRef);
          if(docSnap.exists()){
            const data = docSnap.data();
            await setDoc(doc(db,'members',id),{...data, approvedAt:new Date().toISOString()});
            await deleteDoc(docRef);
            ev.target.closest('.member-card').remove();
            alert('Approved');
            loadMembers();
          }
        }
        if(ev.target.classList.contains('deny')){
          const id = ev.target.dataset.id;
          await deleteDoc(doc(db,'pendingSignups',id));
          ev.target.closest('.member-card').remove();
          alert('Denied and removed');
        }
      });
    });

    openAddMember.addEventListener('click',()=>{
      adminContent.innerHTML = `
        <h4>Add Member</h4>
        <label>Name</label><input id='admName'>
        <label>Email</label><input id='admEmail'>
        <label>Year</label><input id='admYear'>
        <label>Roll</label><input id='admRoll'>
        <label>Branch</label><input id='admBranch'>
        <div style='margin-top:8px'><button id='saveMember' class='btn'>Save</button></div>
      `;
      document.getElementById('saveMember').addEventListener('click',async()=>{
        const name=document.getElementById('admName').value; const email=document.getElementById('admEmail').value; const year=document.getElementById('admYear').value; const roll=document.getElementById('admRoll').value; const branch=document.getElementById('admBranch').value;
        const id = email.split('@')[0] + '_' + roll;
        await setDoc(doc(db,'members',id),{uid:id,name,email,year,roll,branch,addedBy:currentUser ? currentUser.email : 'admin',addedAt:new Date().toISOString()});
        alert('Member added'); loadMembers();
      });
    });

    openAddEvent.addEventListener('click',()=>{
      adminContent.innerHTML = `
        <h4>Add Event</h4>
        <label>Title</label><input id='evTitle'>
        <label>Description</label><textarea id='evDesc'></textarea>
        <label>Date & Time (YYYY-MM-DD HH:MM)</label><input id='evWhen' placeholder='2025-11-25 18:00'>
        <label>Venue</label><input id='evVenue'>
        <div style='margin-top:8px'><button id='saveEvent' class='btn'>Save Event</button></div>
      `;
      document.getElementById('saveEvent').addEventListener('click',async()=>{
        const title=document.getElementById('evTitle').value; const desc=document.getElementById('evDesc').value; const when=document.getElementById('evWhen').value; const venue=document.getElementById('evVenue').value;
        if(!title||!when){alert('Provide title and date/time');return}
        await addDoc(collection(db,'events'),{title,desc,when,venue,createdAt:new Date().toISOString()});
        alert('Event saved'); loadEvents();
      });
    });

    // Improved Add Photo: convert Drive share->direct link, validate and fallback to localStorage if Firestore denies
    openAddPhoto.addEventListener('click',()=>{
      adminContent.innerHTML = `
        <h4>Add Photo Link (Drive / Public URL)</h4>
        <label>Title</label><input id='phTitle'>
        <label>Drive link (public)</label><input id='phLink'>
        <div style='margin-top:8px'><button id='savePhoto' class='btn'>Save Photo Link</button></div>
        <div id="phMsg" style="margin-top:8px;color:var(--muted)"></div>
      `;
      document.getElementById('savePhoto').addEventListener('click',async()=>{
        const title = (document.getElementById('phTitle').value || '').trim();
        let link = (document.getElementById('phLink').value || '').trim();
        const msgEl = document.getElementById('phMsg');
        msgEl.innerText = '';
        if(!link){ msgEl.innerText = 'Provide a link'; return; }

        const driveMatch = link.match(/\/d\/([a-zA-Z0-9_-]{10,})/i) || link.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
        if (driveMatch && driveMatch[1]) {
          const fileId = driveMatch[1];
          link = `https://drive.google.com/uc?export=view&id=${fileId}`;
        } else {
          if(!/^https?:\/\//i.test(link)) link = 'https://' + link;
        }

        try{ new URL(link); }catch(e){ msgEl.innerText = 'Invalid URL'; return; }

        const photoObj = { title, link, addedAt: new Date().toISOString(), addedBy: currentUser ? currentUser.email : 'anonymous' };

        try{
          await addDoc(collection(db,'photos'),photoObj);
          msgEl.innerText = 'Photo link saved to cloud.';
          document.getElementById('phTitle').value=''; document.getElementById('phLink').value='';
          loadPhotos();
        }catch(e){
          console.warn('Firestore save failed', e);
          if(e && e.message && /permission/i.test(e.message)){
            const local = JSON.parse(localStorage.getItem('manan_local_photos') || '[]');
            local.push(photoObj);
            localStorage.setItem('manan_local_photos', JSON.stringify(local));
            msgEl.innerText = 'Saved locally (Firestore permission denied). Sign in as admin to save to Firestore.';
            document.getElementById('phTitle').value=''; document.getElementById('phLink').value='';
            loadPhotos();
          }else{
            msgEl.innerText = 'Save failed: ' + (e.message || 'unknown error');
          }
        }
      });
    });

    // Load leaders (hardcoded fallback from images)
    async function loadLeaders(){
      leadersList.innerHTML='';
      try{
        const leadersCol = collection(db,'leaders');
        const snap = await getDocs(leadersCol);
        if(snap.empty){
          const sample = [
            {name:'Shubham Tanwar', role:'Joint Secretary', info:'For Session 2025-2026'},
            {name:'Kavya Gupta', role:'Joint Secretary', info:'For Session 2025-2026'},
            {name:'Vaibhav', role:'Joint Secretary', info:'For Session 2025-2026'},
            {name:'Hardik Singhal', role:'Session Head', info:'For Session 2025-2026'},
            {name:'Pranjal Sethi', role:'Session Head', info:'For Session 2025-2026'},
            {name:'Sunny Shukla', role:'Session Head', info:'For Session 2025-2026'}
          ];
          sample.forEach(s=>{
            const d=document.createElement('div'); d.className='member-card';
            d.innerHTML = `<div class='avatar'>${s.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><strong>${s.name}</strong><div style='font-size:13px;color:var(--muted)'>${s.role}<br>${s.info}</div></div>`;
            leadersList.appendChild(d);
          });
        }else{
          snap.forEach(docSnap=>{
            const s=docSnap.data();
            const d=document.createElement('div'); d.className='member-card';
            d.innerHTML = `<div class='avatar'>${(s.name||'').split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><strong>${s.name}</strong><div style='font-size:13px;color:var(--muted)'>${s.role}<br>${s.info||''}</div></div>`;
            leadersList.appendChild(d);
          })
        }
      }catch(e){console.error(e)}
    }

    // Members
    async function loadMembers(){
      membersGrid.innerHTML='';
      try{
        const mems = collection(db,'members');
        const snap = await getDocs(mems);
        if(snap.empty){membersGrid.innerText='No members yet.'}
        snap.forEach(docSnap=>{
          const m = docSnap.data();
          const cel = document.createElement('div'); cel.className='card';
          cel.innerHTML = `<div class='member-card'><div class='avatar'>${(m.name||'').split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div style='flex:1'><strong>${m.name}</strong><div style='font-size:13px;color:var(--muted)'>${m.branch} | ${m.year} | ${m.roll || ''}</div></div></div>`;
          membersGrid.appendChild(cel);
        });
      }catch(e){console.error(e)}
    }

    // Load events and populate both list & FullCalendar
    async function loadEvents(){
      eventsList.innerHTML=''; fcEvents = []; // reset
      try{
        const evCol = collection(db,'events');
        const snap = await getDocs(evCol);
        if(snap.empty){eventsList.innerText='No events scheduled.'}
        const eventsArr = [];
        snap.forEach(s=>{const d=s.data(); eventsArr.push({...d,id:s.id})});
        eventsArr.sort((a,b)=>new Date(a.when)-new Date(b.when));

        // Build plain list (Removed "Add to Google Calendar" button as requested)
        eventsArr.forEach(e=>{
          const el = document.createElement('div'); el.className='card';
          el.innerHTML = `<strong>${e.title}</strong>
            <div style='color:var(--muted)'>${e.when} | ${e.venue || ''}</div>
            <div style='margin-top:6px'>${e.desc || ''}</div>`;
          eventsList.appendChild(el);

          // prepare for FullCalendar
          let startISO = e.when ? e.when.replace(' ', 'T') : null;
          fcEvents.push({
            id: e.id,
            title: e.title,
            start: startISO,
            extendedProps: { description: e.desc || '', venue: e.venue || '' }
          });
        });

        // Render into FullCalendar (if initialized)
        if(fcCalendar){
          fcCalendar.removeAllEvents();
          fcEvents.forEach(ev => fcCalendar.addEvent(ev));
        } else {
          initFullCalendar(); // initialize if not yet
        }

        // Also show optional Google Calendar embed (public calendar id)
        renderGoogleCalendarEmbed();

      }catch(e){console.error(e)}
    }

    // Photos: load from Firestore and localStorage fallback
    async function loadPhotos(){
      galleryGrid.innerHTML='';
      const local = JSON.parse(localStorage.getItem('manan_local_photos') || '[]');
      try{
        const phCol = collection(db,'photos');
        const snap = await getDocs(phCol);
        const firestorePhotos = [];
        snap.forEach(s => firestorePhotos.push(s.data()));
        const combined = [...firestorePhotos, ...local]; // local appended after
        if(combined.length === 0){galleryGrid.innerText='No photos yet.'}
        combined.forEach(p=>{
          const el=document.createElement('a'); el.href=p.link; el.target='_blank'; el.className='photo';
          el.innerHTML=`<div style="height:100px;display:flex;align-items:center;justify-content:center;background: #ffffff;border: 1px solid #e2e8f0;border-radius:8px">${p.title || 'Photo'}</div>`;
          galleryGrid.appendChild(el)
        });
      }catch(e){
        console.warn('Photos load failed - falling back to local only', e);
        if(local.length === 0) galleryGrid.innerText='No photos yet.'
        local.forEach(p=>{
          const el=document.createElement('a'); el.href=p.link; el.target='_blank'; el.className='photo';
          el.innerHTML=`<div style="height:100px;display:flex;align-items:center;justify-content:center;background: #ffffff;border: 1px solid #e2e8f0;border-radius:8px">${p.title || 'Photo'}</div>`;
          galleryGrid.appendChild(el)
        })
      }
    }

    // --------------------------
    // FullCalendar: init & helpers
    // --------------------------
    import('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js').then(({ FullCalendar })=>{
      // make sure it's available; create instance after DOM
      // initFullCalendar() will be called from loadEvents when needed
    });

    function initFullCalendar(){
      if(fcCalendar) return;
      try{
        const Calendar = window.FullCalendar && window.FullCalendar.Calendar;
        if(!Calendar) return console.warn('FullCalendar not loaded yet');

        fcCalendar = new Calendar(fcCalendarEl, {
          initialView: 'dayGridMonth',
          headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
          events: fcEvents,
          height: 600,
          eventDidMount: function(info){
            info.el.style.cursor = 'pointer';
          },
          eventClick: function(info){
            const ev = info.event;
            alert(ev.title + '\n' + (ev.extendedProps.description || '') + '\n' + (ev.extendedProps.venue || ''));
          }
        });
        fcCalendar.render();
      }catch(e){console.error('initFullCalendar',e)}
    }

    // Optional: Public Google Calendar embed (provide calendar id here)
    const publicCalendarId = ''; // if you have a public calendar ID put it here
    function renderGoogleCalendarEmbed(){
      googleCalendarEmbedWrap.innerHTML = '';
      if(!publicCalendarId) return;
      const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(publicCalendarId)}&ctz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`;
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.style.width = '100%';
      frame.style.height = '600px';
      frame.style.border = '0';
      frame.loading = 'lazy';
      googleCalendarEmbedWrap.appendChild(frame);
    }

    // Initial loads
    loadLeaders(); loadMembers(); loadEvents(); loadPhotos();

    // helper import for deleteDoc reference (used earlier)
    import('https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js').then(m=>{window.deleteDocRef = m.deleteDoc});

    // Expose some helpers for debugging
    window._manan = { loadLeaders, loadMembers, loadEvents, loadPhotos, initFullCalendar, fcEvents };

