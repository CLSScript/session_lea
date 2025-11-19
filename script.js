/* =========================================
   CONFIGURATION & ÉTAT
   ========================================= */
const CONFIG = {
    pass: "Rex2012",
    code_decrypt: "1411",
    vol: 0.4,
    sfxVol: 0.7,
    lang: "fr"
};

const I18N = {
    fr: {
        chapter_i: "CHAPITRE I : L'ANOMALIE",
        chapter_ii: "CHAPITRE II : SURVEILLANCE",
        chapter_iii: "CHAPITRE III : INDICES",
        chapter_iv: "CHAPITRE IV : VÉRITÉ",
        prologue_lines: [
            "Léa croyait être seule. Les nuits s'allongeaient, et l'écran restait allumé.",
            "Une silhouette s'est glissée dans son monde, entre pixels et souffle.",
            "Pour comprendre, il faudra fouiller ses souvenirs, ses fichiers… et ce qui les observe.",
            "N'entre pas sans regarder la caméra. N'ouvre pas sans écouter le silence."
        ]
    },
    en: {
        chapter_i: "CHAPTER I: ANOMALY",
        chapter_ii: "CHAPTER II: SURVEILLANCE",
        chapter_iii: "CHAPTER III: CLUES",
        chapter_iv: "CHAPTER IV: TRUTH",
        prologue_lines: [
            "Léa thought she was alone. Nights stretched while the screen stayed awake.",
            "A silhouette slipped into her world, between pixels and breath.",
            "To understand, you must dig through her memories, her files… and what watches them.",
            "Do not enter without checking the camera. Do not open without listening to the silence."
        ]
    }
};
const L = I18N[CONFIG.lang] || I18N.fr;

let state = {
    chapter: 0,
    attempts: 0,
    hacked: false,
    zIndexCounter: 100, // Pour gérer l'ordre des fenêtres
    flags: {
        wordRead: false,
        gallerySeen: false,
        cameraChecked: false,
        thomasDead: false,
        policeContacted: false,
        thomasThreadStarted: false,
        camilleThreadStarted: false,
        profThreadStarted: false,
        unknownQuestAdded: false
    },
    chaptersShown: { i: false, ii: false, iii: false, iv: false },
    eventsStarted: false
};

/* =========================================
   DOM CACHE
   ========================================= */
const ui = {
    screens: {
        intro: document.getElementById('scene-intro'),
        login: document.getElementById('scene-login'),
        desktop: document.getElementById('scene-desktop')
    },
    overlay: {
        el: document.getElementById('chapter-overlay'),
        title: document.getElementById('chapter-title')
    },
    login: {
        inp: document.getElementById('inp-pass'),
        btn: document.getElementById('btn-login'),
        msg: document.getElementById('login-msg'),
        hint: document.getElementById('hint-box'),
        box: document.querySelector('.login-box'),
        img: document.getElementById('user-avatar')
    },
    iscord: {
        chat: document.getElementById('chat-history'),
        choices: document.getElementById('chat-choices'),
        contacts: document.getElementById('chat-contacts'),
        badge: document.getElementById('badge-iscord')
    },
    email: {
        list: document.getElementById('email-list'),
        view: document.getElementById('email-view'),
        subject: document.getElementById('email-subject'),
        sender: document.getElementById('email-sender'),
        body: document.getElementById('email-content'),
        badge: document.getElementById('badge-email')
    },
    police: {
        chat: document.getElementById('police-history'),
        choices: document.getElementById('police-choices'),
        badge: document.getElementById('badge-police')
    },
    terminal: {
        out: document.getElementById('term-output'),
        inp: document.getElementById('term-input')
    },
    video: document.getElementById('villain-video'),
    audio: {
        bg: document.getElementById('bg-music'),
        key: document.getElementById('sfx-key'),
        glitch: document.getElementById('sfx-glitch'),
        scream: document.getElementById('sfx-scream'),
        email: document.getElementById('sfx-email'),
        camera: document.getElementById('sfx-camera'),
        thump: document.getElementById('sfx-thump'),
        door: document.getElementById('sfx-door'),
        breath: document.getElementById('sfx-breath'),
        static: document.getElementById('sfx-static')
    },
    btnStart: document.getElementById('btn-start-game'),
    clock: document.createElement('div'),
    clockDesktop: document.createElement('div'),
    prologueEl: document.getElementById('prologue-overlay'),
    prologueTxt: document.getElementById('prologue-text')
};

/* =========================================
   1. INITIALISATION & SYSTÈME
   ========================================= */

window.onload = () => {
    // Configuration de l'heure dans le dock
    const dock = document.querySelector('.dock');
    ui.clock.classList.add('dock-clock');
    ui.clock.style.color = "white";
    ui.clock.style.fontFamily = "monospace";
    ui.clock.style.marginLeft = "20px";
    ui.clock.style.alignSelf = "center";
    ui.clock.style.fontWeight = "bold";
    updateClock();
    setInterval(updateClock, 1000);
    dock.appendChild(ui.clock);

    // Rendre toutes les fenêtres déplaçables
    document.querySelectorAll('.window').forEach(win => makeDraggable(win));

    // Horloge sur le bureau (overlay)
    ui.clockDesktop.classList.add('desktop-clock');
    ui.screens.desktop.appendChild(ui.clockDesktop);

};

function updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const val = `${hh}:${mm}`;
    ui.clock.innerText = val;
    ui.clockDesktop.innerText = val;
}

// Démarrage du jeu (Click sur l'intro)
ui.btnStart.addEventListener('click', () => {
    ui.audio.bg.volume = CONFIG.vol;
    ui.audio.bg.play().catch(e => {});
    ui.screens.intro.classList.add('hidden');
    playIntroStory(() => {
        ui.prologueEl.classList.add('hidden');
        ui.screens.login.classList.remove('hidden');
        ui.login.inp.focus();
    });
    primeAudio();
});

let audioPrimed = false;
function primeAudio() {
    if(audioPrimed) return;
    const a = ui.audio;
    try { a.bg.volume = CONFIG.vol; } catch(e) {}
    [a.key,a.glitch,a.scream,a.email,a.camera,a.thump,a.door,a.breath,a.static].forEach(el => {
        if(!el) return;
        try {
            el.volume = CONFIG.sfxVol;
            el.play().then(() => { el.pause(); el.currentTime = 0; }).catch(() => {});
        } catch(e) {}
    });
    audioPrimed = true;
}
document.addEventListener('click', () => primeAudio(), { once: true });

// Transition Chapitre (Écran noir avec titre)
function setChapter(title, callback) {
    ui.overlay.el.classList.remove('hidden');
    ui.overlay.title.innerText = title;
    
    // Petite animation CSS via JS
    ui.overlay.el.style.opacity = "1";
    ui.overlay.title.classList.add('chapter-title-animate');
    playSfx('glitch');

    setTimeout(() => {
        callback(); // Changement de scène
    }, 2000);

    setTimeout(() => {
        ui.overlay.el.style.opacity = "0";
        setTimeout(() => ui.overlay.el.classList.add('hidden'), 1000);
        ui.overlay.title.classList.remove('chapter-title-animate');
    }, 4000);
}

// Audio Helper
function playSfx(type) {
    try {
        if(type === 'key') { ui.audio.key.currentTime = 0; ui.audio.key.play(); }
        if(type === 'glitch') { ui.audio.glitch.currentTime = 0; ui.audio.glitch.play(); }
        if(type === 'scream') { ui.audio.scream.currentTime = 0; ui.audio.scream.play(); }
        if(type === 'email') { ui.audio.email.currentTime = 0; ui.audio.email.play(); }
        if(type === 'camera') { ui.audio.camera.currentTime = 0; ui.audio.camera.play(); }
        if(type === 'thump') { ui.audio.thump.currentTime = 0; ui.audio.thump.play(); }
        if(type === 'door') { ui.audio.door.currentTime = 0; ui.audio.door.play(); }
        if(type === 'breath') { if(ui.audio.breath.paused) { ui.audio.breath.currentTime = 0; ui.audio.breath.play(); } }
        if(type === 'static') { if(ui.audio.static.paused) { ui.audio.static.currentTime = 0; ui.audio.static.play(); } }
    } catch(e) { console.log("Sound error", e); }
}

/* =========================================
   2. LOGIN LOGIC
   ========================================= */

ui.login.btn.addEventListener('click', checkLogin);
ui.login.inp.addEventListener('keyup', (e) => { if(e.key === 'Enter') checkLogin(); });

function checkLogin() {
    if(ui.login.inp.value === CONFIG.pass) {
        setChapter("CHAPITRE I : L'ANOMALIE", () => {
            ui.screens.login.classList.add('hidden');
            ui.screens.desktop.classList.remove('hidden');
            startDesktopEvents();
        });
        state.chaptersShown.i = true;
    } else {
        state.attempts++;
        ui.login.inp.value = "";
        ui.login.msg.innerText = "Mot de passe incorrect.";
        playSfx('key');
        
        // Mode Horreur au 2ème essai
        if(state.attempts >= 2 && !state.hacked) {
            state.hacked = true;
            ui.login.box.style.animation = "shake 0.5s";
            ui.login.img.src = "asset/stalker_photo.jpg";
            ui.login.hint.classList.remove('hidden');
            playSfx('glitch');
            
            // Effet visuel glitch sur le body
            document.body.style.filter = "invert(1)";
            setTimeout(() => document.body.style.filter = "invert(0)", 100);
        }
    }
}

/* =========================================
   3. DESKTOP & FENÊTRES (DRAG & DROP)
   ========================================= */

function startDesktopEvents() {
    startPostItHints();
    updateClock();
    initEmail();
    startEmailFeed();
    initBrowser();
    initIscordConvos();
    updateDockLocks();
    initQuests();
    addQuest('parler_camille', "Ouvrir le fil Camille");
    addQuest('repondre_thomas', "Répondre à Thomas");

}

let emails = [];
function initEmail() {
    emails = [
        { from: 'Camille', subject: 'Tu as entendu du bruit hier ?', body: "J'ai pas dormi. Si tu peux, reste chez toi ce soir.", unread: true },
        { from: 'Prof Philo', subject: 'Sujet : conscience et matière', body: "N'oublie pas d'explorer l'idée d'identité numérique.", unread: true },
        { from: 'Maman', subject: 'Tu me réponds ?', body: "Je m'inquiète. Réponds moi, s'il te plaît.", unread: false }
    ];
    renderEmailList();
}

function renderEmailList() {
    ui.email.list.innerHTML = '';
    emails.forEach((m, i) => {
        const item = document.createElement('div');
        item.className = 'email-item' + (m.unread ? ' unread' : '');
        item.innerHTML = `<div>${m.subject}</div><div style="font-size:12px; color:#bbb">${m.from}</div>`;
        item.onclick = () => openEmail(i);
        ui.email.list.appendChild(item);
    });
}

function openEmail(i) {
    const m = emails[i];
    if(!m) return;
    m.unread = false;
    ui.email.subject.innerText = m.subject;
    ui.email.sender.innerText = `De: ${m.from}`;
    ui.email.body.innerText = m.body;
    renderEmailList();
    if(m.from === 'Maman') completeQuest('read_email_maman');
    const btn = document.getElementById('btn-reply-mom');
    if(btn) btn.classList.toggle('hidden', m.from !== 'Maman');
}

function pushEmail(m) {
    emails.unshift(m);
    renderEmailList();
    const win = document.getElementById('win-email');
    if(win.classList.contains('hidden')) ui.email.badge.classList.remove('hidden');
    playSfx('email');
}

function startEmailFeed() {
    const schedule = () => {
        const delay = 20000 + Math.floor(Math.random() * 20000);
        setTimeout(() => {
            if(!ui.screens.desktop.classList.contains('hidden')) {
                const pool = [
                    { from: 'Camille', subject: 'Ne sors pas ce soir', body: "Je t'en prie.", unread: true },
                    { from: 'Prof Philo', subject: 'Le moi est-il divisible ?', body: "Réfléchis à la copie digitale.", unread: true },
                    { from: 'Maman', subject: 'Appelle-moi', body: "Réponds. Je suis inquiète.", unread: true },
                    { from: 'INCONNU', subject: 'JE SUIS LÀ', body: "Tu es à moi.", unread: true }
                ];
                const msg = pool[Math.floor(Math.random() * pool.length)];
                pushEmail(msg);
            }
            schedule();
        }, delay);
    };
    schedule();
}

function startVillainEvents() {
    const schedule = () => {
        const base = state.flags.thomasDead ? 9000 : 14000;
        const delay = base + Math.floor(Math.random() * 20000);
        setTimeout(() => {
            if(!ui.screens.desktop.classList.contains('hidden')) {
                const r = Math.random();
                if(r < 0.25) glitchScreen();
                else if(r < 0.6) injectUnknownChat();
                else if(r < 0.85) cameraFlick();
                else {
                    pushEmail({ from: 'INCONNU', subject: 'NE RESPIRE PAS', body: 'Tu fais trop de bruit.', unread: true });
                    const badge = document.getElementById('badge-web');
                    if(badge && Math.random() < 0.5) badge.classList.remove('hidden');
                }
                AI_STATE.cameraHijacks++;
                AI_STATE.lastActionAt = Date.now();
                pulseAI();
            }
            schedule();
        }, delay);
    };
    schedule();
    enableVignette();
    ensureStaticOn();
}

function pulseAI() {
    const idleMs = Date.now() - AI_STATE.lastActionAt;
    if(idleMs > 30000) AI_STATE.mood.doubt = Math.min(5, AI_STATE.mood.doubt + 1);
    if(AI_STATE.cameraHijacks > 3) AI_STATE.mood.fatigue = Math.min(5, AI_STATE.mood.fatigue + 1);
}

function initBrowser() {
    const doSearch = () => {
        const q = document.getElementById('web-search');
        if(!q) return;
        searchWeb(q.value.toLowerCase().trim());
    };
    const go = document.getElementById('web-go');
    const inp = document.getElementById('web-search');
    if(go) go.onclick = doSearch;
    if(inp) inp.addEventListener('keyup', (e) => { if(e.key === 'Enter') doSearch(); });
}

const webPages = {
    journal_lea: { title: "Journal de Léa", body: "Je ne dors plus. Il est là. Cherche la caméra avant d'ouvrir." },
    code_1411: { title: "Erreur #1411", body: "Code observé dans données corrompues. Note et garde-le en tête." },
    rex: { title: "Rex", body: "Rex (2012). Un mot de passe doit vivre dans la mémoire." },
    villain: { title: "Surveillance", body: "Caméra compromise. Ne lui ouvre pas. Regarde l'œil rouge." },
    cryptex: { title: "CRYPTE-X", body: "Décrypte avec un code. Cherche le numéro dans la galerie." }
};

function searchWeb(q) {
    const results = document.getElementById('web-results');
    const view = document.getElementById('web-view');
    if(!results || !view) return;
    results.innerHTML = '';
    view.classList.add('hidden');
    const r = [];
    if(!q) return;
    completeQuest('search_web');
    if(q.includes('conscience') || q.includes('copie') || q.includes('journal')) completeQuest('open_browser_journal');
    if(Math.random() < 0.12) {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `<div class='result-title' style='color:red'>NOUS TE VOYONS</div><div class='result-snippet'>Ne cherche pas.</div>`;
        results.appendChild(item);
        glitchScreen();
        return;
    }
    if(q.includes('session') || q.includes('lea')) r.push({ id:'journal_lea', title:webPages.journal_lea.title, snippet:"Fragments du journal" });
    if(q.includes('1411') || q.includes('erreur')) r.push({ id:'code_1411', title:webPages.code_1411.title, snippet:"Référence système" });
    if(q.includes('rex') || q.includes('2012')) r.push({ id:'rex', title:webPages.rex.title, snippet:"Mémoire et clés" });
    if(q.includes('villain') || q.includes('caméra')) r.push({ id:'villain', title:webPages.villain.title, snippet:"Intrusion webcam" });
    if(q.includes('crypt') || q.includes('décrypt')) r.push({ id:'cryptex', title:webPages.cryptex.title, snippet:"Procédure de décryptage" });
    if(r.length === 0) {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `<div class='result-title'>Aucun résultat</div><div class='result-snippet'>Essaye: 'Session Lea', '1411', 'Rex 2012'.</div>`;
        results.appendChild(item);
        return;
    }
    r.forEach(res => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `<div class='result-title'>${res.title}</div><div class='result-snippet'>${res.snippet}</div>`;
        item.onclick = () => openWebPage(res.id);
        results.appendChild(item);
    });
}

function openWebPage(id) {
    const p = webPages[id];
    const view = document.getElementById('web-view');
    if(!p || !view) return;
    view.classList.remove('hidden');
    view.innerHTML = `<h3 style='margin-bottom:8px'>${p.title}</h3><div>${p.body}</div><div style='margin-top:10px; font-size:12px; color:#888'>Indice: cherche '${nextHint(id)}'</div>`;
    if(!state.chaptersShown.iii && (id === 'journal_lea' || id === 'villain')) {
        if(!canAdvanceToChapter('II')) { return; }
        setChapter(L.chapter_iii, () => {});
        state.chaptersShown.iii = true;
    }
    if(id === 'journal_lea') completeQuest('open_browser_journal');
    if(id === 'code_1411') completeQuest('find_error_1411');
}

function nextHint(id) {
    if(id === 'journal_lea') return 'caméra';
    if(id === 'villain') return '1411';
    if(id === 'code_1411') return 'crypte';
    if(id === 'cryptex') return 'rex 2012';
    if(id === 'rex') return 'session lea';
    return 'scan';
}

function glitchScreen() {
    document.body.classList.add('global-glitch');
    document.getElementById('noise').classList.add('noise-boost');
    playSfx('glitch');
    playSfx('static');
    setTimeout(() => {
        document.body.classList.remove('global-glitch');
        document.getElementById('noise').classList.remove('noise-boost');
    }, 400);
}

function injectUnknownChat() {
    const escal = (AI_STATE.panic + AI_STATE.mood.anger) >= 3;
    const pool = escal ? DIALOGUES.inconnu_high : DIALOGUES.inconnu_low;
    const m = pool[Math.floor(Math.random() * pool.length)];
    sendIscordMsg("INCONNU", m);
    const win = document.getElementById('win-iscord');
    if(!win.classList.contains('hidden')) {
        const deskRect = ui.screens.desktop.getBoundingClientRect();
        const r = win.getBoundingClientRect();
        const x = Math.max(10, r.right - deskRect.left - 160);
        const y = Math.max(10, r.top - deskRect.top + 10);
        spawnPostIt("Je te vois", { variant: 'danger', life: 5000, parentEl: ui.screens.desktop, x, y });
    }
    AI_STATE.panic = Math.min(5, AI_STATE.panic + 1);
    AI_STATE.mood.anger = Math.min(5, AI_STATE.mood.anger + 1);
}

function cameraFlick() {
    playSfx('camera');
    openWindow('win-camera');
    const deskRect = ui.screens.desktop.getBoundingClientRect();
    const cam = document.getElementById('win-camera');
    const r = cam.getBoundingClientRect();
    const x = Math.max(10, r.left - deskRect.left + 20);
    const y = Math.max(10, r.top - deskRect.top + 10);
    spawnPostIt("Regarde la caméra", { life: 4000, parentEl: ui.screens.desktop, x, y });
    setTimeout(() => closeWin('win-camera'), 2500);
    AI_STATE.panic = Math.min(5, AI_STATE.panic + 1);
}

function enableVignette() {
    const v = document.getElementById('vignette');
    if(v) v.style.opacity = '1';
}

// Ouvrir une fenêtre
window.openWindow = function(id) {
    const win = document.getElementById(id);
    if(!win) return;
    if(!isAppAllowed(id)) { playSfx('key'); spawnPostIt("Termine le chapitre en cours", { life: 4000, parentEl: ui.screens.desktop }); return; }
    
    win.classList.remove('hidden');
    bringToFront(win);
    
    // Logique spécifique par app
    if(id === 'win-iscord') { ui.iscord.badge.classList.add('hidden'); renderContacts(); if(!state.flags.thomasThreadStarted) {/* noop */} completeQuest('open_iscord'); }
    if(id === 'win-email') ui.email.badge.classList.add('hidden');
    if(id === 'win-email') completeQuest('check_emails');
    if(id === 'win-police') {
        ui.police.badge.classList.add('hidden');
        const btn = document.getElementById('btn-call-17');
        if(btn) btn.onclick = () => window.startPoliceCall();
        if(!state.flags.policeContacted) window.startPoliceCall();
    }
    if(id === 'win-browser') { if(ui.web.search) ui.web.search.focus(); if(ui.web.badge) ui.web.badge.classList.add('hidden'); }
    
    if(id === 'win-word' && !state.flags.wordRead) {
        state.flags.wordRead = true;
        setTimeout(() => {
            document.getElementById('ghost-text').classList.remove('hidden');
            playSfx('glitch');
        }, 5000);
    }
    
    if(id === 'win-camera') {
        ui.video.currentTime = 0;
        ui.video.play().catch(e => console.log("Video play error", e));
        state.flags.cameraChecked = true;
        if(!state.chaptersShown.ii) {
            if(canAdvanceToChapter('I')) {
                setChapter("CHAPITRE II : SURVEILLANCE", () => {});
                state.chaptersShown.ii = true;
            } else {
                showToast("Termine les 3 tâches du Chapitre I");
            }
        }
        if(!state.eventsStarted) { startVillainEvents(); state.eventsStarted = true; }

        // Trigger événement si Thomas attendait
        if(document.getElementById('waiting-cam')) triggerThomasDeath();
        completeQuest('open_camera');
        addQuest('check_emails', "Consulter les nouveaux emails");
        addQuest('open_browser_journal', "Trouver la page Journal de Léa");
        addQuest('find_error_1411', "Trouver l'erreur #1411");
        addQuest('read_email_maman', "Lire l'email de Maman");
        updateDockLocks();
        showToast("Emails et Navigateur débloqués");
    }
    
    if(id === 'win-terminal') ui.terminal.inp.focus();
    updateDockLocks();
};

window.callPoliceFromMenu = function() {
    openWindow('win-police');
    startPoliceCall();
};

// Fermer une fenêtre
window.closeWin = function(id) {
    document.getElementById(id).classList.add('hidden');
    if(id === 'win-camera') ui.video.pause();
};

// Mettre la fenêtre au premier plan
function bringToFront(el) {
    state.zIndexCounter++;
    el.style.zIndex = state.zIndexCounter;
}

// Rendre une fenêtre déplaçable (Le FIX important)
function makeDraggable(el) {
    const header = el.querySelector('.title-bar');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // Quand on clique sur la barre
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Récupérer la position actuelle (gère les % et les px)
        const rect = el.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        bringToFront(el);
        header.style.cursor = "grabbing";
    });

    // Quand on bouge la souris
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        el.style.left = `${initialLeft + dx}px`;
        el.style.top = `${initialTop + dy}px`;
        
        // Retire le transform center/center du CSS si présent pour éviter les conflits
        el.style.transform = "none"; 
    });

    // Quand on relâche
    window.addEventListener('mouseup', () => {
        isDragging = false;
        header.style.cursor = "grab";
    });
}

// Visionneuse Photo
window.viewPhoto = function(src, caption) {
    const viewer = document.getElementById('photo-viewer');
    const img = document.getElementById('viewer-img');
    const txt = document.getElementById('viewer-caption');
    
    viewer.classList.remove('hidden');
    img.src = src;
    txt.innerText = caption;
    
    if(caption.includes("connais pas")) {
        state.flags.gallerySeen = true;
        txt.innerHTML = "Fichier corrompu.<br>Erreur système <span style='color:red; font-weight:bold'>#1411</span><br>(Note ce numéro...)";
        spawnPostIt("1411", { variant: 'danger', life: 7000 });
        completeQuest('find_code');
    }
    
    const closeViewer = () => {
        viewer.classList.add('hidden');
        img.src = "";
        txt.innerText = "";
        viewer.removeEventListener('click', onBackdropClick);
        document.removeEventListener('keydown', onEsc);
    };
    const onBackdropClick = (e) => {
        if(e.target.id === 'photo-viewer') closeViewer();
    };
    const onEsc = (e) => {
        if(e.key === 'Escape') closeViewer();
    };
    viewer.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onEsc);
};

function spawnPostIt(text, opts = {}) {
    const p = document.createElement('div');
    p.className = 'postit';
    if(opts.variant === 'danger') p.classList.add('postit-danger');
    p.innerText = text;
    const parent = opts.parentEl || ui.screens.desktop;
    parent.appendChild(p);
    const pr = parent.getBoundingClientRect();
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    const x = (opts.x !== undefined) ? opts.x : Math.floor(Math.random() * Math.max(1, width - 220));
    const y = (opts.y !== undefined) ? opts.y : Math.floor(Math.random() * Math.max(1, height - 180));
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.classList.add('glitch');
    const life = opts.life || 6000;
    setTimeout(() => { p.remove(); }, life);
}

function startPostItHints() {
    const hints = [
        "Ne lui ouvre pas",
        "Regarde la caméra",
        "Tape 'scan'",
        "Écoute le silence",
        "Il est derrière toi",
        "1411"
    ];
    const loop = () => {
        const delay = 20000 + Math.floor(Math.random() * 20000);
        setTimeout(() => {
            if(!ui.screens.desktop.classList.contains('hidden')) {
                const t = hints[Math.floor(Math.random() * hints.length)];
                spawnPostIt(t, { life: 6000, variant: t === '1411' ? 'danger' : undefined });
            }
            loop();
        }, delay);
    };
    loop();
}

/* =========================================
   4. SCÉNARIO ISCORD (CHAT)
   ========================================= */

let convos = { "Thomas ❤️": [], "Camille": [], "Prof Philo": [], "INCONNU": [] };
let activeContact = "Thomas ❤️";
let unread = { "Thomas ❤️": 0, "Camille": 0, "Prof Philo": 0, "INCONNU": 0 };

const AI_STATE = {
    stage: 'I',
    panic: 0,
    cameraHijacks: 0,
    lastActionAt: Date.now(),
    mood: { fatigue: 0, doubt: 1, anger: 0 }
};

const DIALOGUES = {
    thomas_intro: [
        "Bébé ? T'es là ?",
        "C'est bizarre dehors.",
        "Je crois qu'il nous regarde."
    ],
    camille_intro: [
        "Reste chez toi ce soir.",
        "Ferme les rideaux." 
    ],
    prof_intro: [
        "Tu as lu mes mails ?",
        "Le moi numérique n'est pas toi.",
        "Cherche le Journal de Léa."
    ],
    inconnu_low: ["Tu ne peux pas me fuir.", "Je te regarde.", "Ne tourne pas la tête."],
    inconnu_high: ["Je suis dans tes yeux.", "Ton souffle est le mien.", "Ouvre."]
};

function initIscordConvos() {
    renderContacts();
}

function renderContacts() {
    ui.iscord.contacts.innerHTML = "";
    Object.keys(convos).forEach(name => {
        const btn = document.createElement('div');
        btn.className = 'chat-contact' + (activeContact === name ? ' active' : '');
        const badgeTxt = unread[name] > 0 ? ` <span style="color:red">(${unread[name]})</span>` : '';
        btn.innerHTML = `${name}${badgeTxt}`;
        btn.onclick = () => { activeContact = name; unread[name] = 0; renderContacts(); renderChat(); if(name === 'Thomas ❤️' && !state.flags.thomasThreadStarted) startThomasThread(); if(name === 'Camille') { if(!hasQuest('parler_camille')) addQuest('parler_camille', "Ouvrir le fil Camille"); completeQuest('parler_camille'); if(!state.flags.camilleThreadStarted) startCamilleThread(); } if(name === 'Prof Philo') { if(!state.flags.profThreadStarted) startProfThread(); } };
        ui.iscord.contacts.appendChild(btn);
    });
    renderChat();
}

function renderChat() {
    ui.iscord.chat.innerHTML = "";
    convos[activeContact].forEach(m => {
        const msgDiv = document.createElement('div');
        msgDiv.className = m.cls || 'msg thomas';
        msgDiv.innerHTML = `<strong>${m.name}</strong><br>${m.txt}`;
        ui.iscord.chat.appendChild(msgDiv);
    });
    ui.iscord.chat.scrollTop = ui.iscord.chat.scrollHeight;
}

function sendIscordMsg(name, txt) {
    playSfx('key');
    const cls = name === 'INCONNU' ? 'msg thomas' : 'msg thomas';
    convos[name] = convos[name] || [];
    convos[name].push({ name, txt, cls });
    if(document.getElementById('win-iscord').classList.contains('hidden') || activeContact !== name) {
        unread[name] = (unread[name] || 0) + 1;
        ui.iscord.badge.classList.remove('hidden');
        renderContacts();
    } else {
        renderChat();
    }
    if(name === 'INCONNU' && !state.flags.unknownQuestAdded) { addQuest('menace_inconnu', "Recevoir une menace de l'INCONNU"); completeQuest('menace_inconnu'); state.flags.unknownQuestAdded = true; }
}

function startThomasThread() {
    state.flags.thomasThreadStarted = true;
    DIALOGUES.thomas_intro.forEach((line, i) => setTimeout(() => sendIscordMsg("Thomas ❤️", line), i * 1200));
    showChoices([
        { txt: "Qu'est-ce qu'il y a ?", next: 1 },
        { txt: "Je bosse sur ma dissert.", next: 1 }
    ]);
    updateDockLocks();
    completeQuest('open_iscord');
}

function startCamilleThread() {
    state.flags.camilleThreadStarted = true;
    DIALOGUES.camille_intro.forEach((line, i) => setTimeout(() => sendIscordMsg("Camille", line), i * 1200));
    showCamilleChoices([
        { txt: "Ça va, je verrouille tout.", next: 'ok' },
        { txt: "J'ai peur, je vais appeler.", next: 'call' }
    ]);
}

function showCamilleChoices(options) {
    ui.iscord.choices.innerHTML = "";
    ui.iscord.choices.classList.remove('hidden');
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "choice-btn";
        btn.innerText = opt.txt;
        btn.onclick = () => handleCamilleChoice(opt.next, opt.txt);
        ui.iscord.choices.appendChild(btn);
    });
}

function handleCamilleChoice(action, txtReponse) {
    convos[activeContact].push({ name: 'Moi', txt: txtReponse, cls: 'msg me' });
    ui.iscord.choices.classList.add('hidden');
    renderChat();
    if(action === 'ok') {
        sendIscordMsg("Camille", "Tiens bon. Évite les fenêtres.");
    }
    if(action === 'call') {
        sendIscordMsg("Camille", "Bonne idée. Appelle vite.");
        openWindow('win-police');
        startPoliceCall();
    }
}

function startProfThread() {
    state.flags.profThreadStarted = true;
    DIALOGUES.prof_intro.forEach((line, i) => setTimeout(() => sendIscordMsg("Prof Philo", line), i * 1200));
    showProfChoices([
        { txt: "Explique la copie de soi.", next: 'copy' },
        { txt: "J'ai un code à déchiffrer.", next: 'code' }
    ]);
}

function showProfChoices(options) {
    ui.iscord.choices.innerHTML = "";
    ui.iscord.choices.classList.remove('hidden');
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "choice-btn";
        btn.innerText = opt.txt;
        btn.onclick = () => handleProfChoice(opt.next, opt.txt);
        ui.iscord.choices.appendChild(btn);
    });
}

function handleProfChoice(action, txtReponse) {
    convos[activeContact].push({ name: 'Moi', txt: txtReponse, cls: 'msg me' });
    ui.iscord.choices.classList.add('hidden');
    renderChat();
    if(action === 'copy') {
        sendIscordMsg("Prof Philo", "Une copie n'est pas toi.");
        setTimeout(() => sendIscordMsg("Prof Philo", "Cherche 'Journal de Léa'."), 1000);
        if(!hasQuest('open_browser_journal')) addQuest('open_browser_journal', "Trouver la page Journal de Léa");
    }
    if(action === 'code') {
        sendIscordMsg("Prof Philo", "Un code vit dans la mémoire.");
        setTimeout(() => sendIscordMsg("Prof Philo", "Observe la galerie."), 1000);
        if(!hasQuest('find_code')) addQuest('find_code', "Trouver le code 1411");
    }
}

// Quêtes
let quests = [];
function initQuests() {
    quests = [];
    addQuest('open_iscord', "Ouvrir Iscord");
    addQuest('repondre_thomas', "Répondre à Thomas");
    renderQuests();
}
function renderQuests() {
    const panel = document.getElementById('quest-panel');
    const list = document.getElementById('quest-list');
    if(!panel || !list) return;
    panel.classList.remove('hidden');
    list.innerHTML = '';
    quests.forEach(q => {
        const li = document.createElement('li');
        li.className = 'quest-item' + (q.done ? ' done' : '');
        li.innerHTML = `<span class='quest-check'></span>${q.label}`;
        list.appendChild(li);
    });
}
function completeQuest(id) {
    const q = quests.find(x => x.id === id);
    if(q && !q.done) { q.done = true; renderQuests(); showToast(`Quête terminée: ${q.label}`); playSfx('key'); adjustAIOnQuest(id); }
}
function addQuest(id, label) {
    if(quests.find(x => x.id === id)) return;
    quests.push({ id, label, done: false });
    renderQuests();
}
function hasQuest(id) {
    return !!quests.find(x => x.id === id);
}
function isQuestDone(id) {
    const q = quests.find(x => x.id === id);
    return !!(q && q.done);
}

const CHAPTER_REQS = {
    I: ['open_iscord', 'repondre_thomas', 'parler_camille'],
    II: ['open_camera', 'check_emails', 'open_browser_journal'],
    III: ['open_browser_journal', 'find_code', 'search_web']
};
function canAdvanceToChapter(prev) {
    const reqs = CHAPTER_REQS[prev];
    if(!reqs) return true;
    return reqs.every(r => isQuestDone(r));
}

function showToast(txt) {
    const cont = document.getElementById('toast-container');
    if(!cont) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerText = txt;
    cont.appendChild(t);
    setTimeout(() => { t.remove(); }, 3500);
}
function showChoices(options) {
    ui.iscord.choices.innerHTML = "";
    ui.iscord.choices.classList.remove('hidden');
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "choice-btn";
        btn.innerText = opt.txt;
        btn.onclick = () => handleChoice(opt.next, opt.txt);
        ui.iscord.choices.appendChild(btn);
    });
    ui.iscord.chat.scrollTop = ui.iscord.chat.scrollHeight;
}

function startPoliceCall() {
    state.flags.policeContacted = true;
    ui.police.chat.innerHTML = '';
    ui.police.choices.innerHTML = '';
    sendPoliceMsg("Police 17", "Quelle est votre urgence ?");
    showPoliceMenu();
}

function sendPoliceMsg(name, txt) {
    const msgDiv = document.createElement('div');
    msgDiv.className = name === 'Police 17' ? 'msg police' : (name === 'INCONNU' ? 'msg inconnu' : 'msg thomas');
    msgDiv.innerHTML = `<strong>${name}</strong><br>${txt}`;
    ui.police.chat.appendChild(msgDiv);
    ui.police.chat.scrollTop = ui.police.chat.scrollHeight;
}

function showPoliceChoices(options) {
    ui.police.choices.innerHTML = '';
    ui.police.choices.classList.remove('hidden');
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = opt.txt;
        btn.onclick = () => handlePoliceChoice(opt.next, opt.txt);
        ui.police.choices.appendChild(btn);
    });
}

function showPoliceMenu() {
    ui.police.choices.innerHTML = '';
    ui.police.choices.classList.remove('hidden');
    const menu = [
        { txt: "Décrire le suspect", next: 'describe' },
        { txt: "Donner l'adresse", next: 'address' },
        { txt: "Signaler l'intrusion PC", next: 'intrusion' },
        { txt: "Demander aide immédiate", next: 'help' }
    ];
    menu.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = opt.txt;
        btn.onclick = () => handlePoliceMenu(opt.next);
        ui.police.choices.appendChild(btn);
    });
}

let policeState = { address: null, suspect: null, intrusion: false };
function handlePoliceMenu(action) {
    if(action === 'describe') {
        sendPoliceMsg('Police 17', "Décrivez: taille, vêtements, comportement.");
        sendPoliceMsg('Moi', "Grand, capuche noire, immobile.");
        policeState.suspect = 'capuche noire';
        completeQuest('police_describe');
    } else if(action === 'address') {
        sendPoliceMsg('Police 17', "Indiquez votre adresse.");
        sendPoliceMsg('Moi', "12 rue des Lilas, 1er étage.");
        policeState.address = '12 rue des Lilas';
        completeQuest('police_address');
    } else if(action === 'intrusion') {
        sendPoliceMsg('Police 17', "Décrivez l'écran.");
        sendPoliceMsg('Moi', "Messages étranges, caméra contrôlée.");
        policeState.intrusion = true;
        completeQuest('police_intrusion');
    } else if(action === 'help') {
        sendPoliceMsg('Police 17', "Patrouille en route. Restez à l'intérieur.");
        completeQuest('police_help');
    }
    ui.police.chat.scrollTop = ui.police.chat.scrollHeight;
    if(policeState.suspect && policeState.address && policeState.intrusion) addQuest('police_complete', "Dossier Police complété");
    if(policeState.suspect && policeState.address && policeState.intrusion) completeQuest('police_complete');
}

function handlePoliceChoice(step, txtReponse) {
    const myMsg = document.createElement('div');
    myMsg.className = 'msg me';
    myMsg.innerText = txtReponse;
    ui.police.chat.appendChild(myMsg);
    ui.police.choices.classList.add('hidden');
    ui.police.chat.scrollTop = ui.police.chat.scrollHeight;
    if(step === 1) {
        setTimeout(() => sendPoliceMsg('Police 17', "Restez à l'intérieur. Donnez votre adresse."), 1500);
        setTimeout(villainHijacksPolice, 4000);
    }
    if(step === 2) {
        setTimeout(() => sendPoliceMsg('Police 17', "Coupez le réseau si possible. Que voyez-vous à l'écran ?"), 1500);
        setTimeout(villainHijacksPolice, 4000);
    }
    if(step === 3) {
        setTimeout(() => sendPoliceMsg('Police 17', "Respirez. Verrouillez les portes. Décrivez la menace."), 1500);
        setTimeout(villainHijacksPolice, 4000);
    }
}

function villainHijacksPolice() {
    playSfx('glitch');
    sendPoliceMsg('INCONNU', "Elle ne vous doit rien.");
    setTimeout(() => sendPoliceMsg('Police 17', "Qui parle ?"), 1200);
    setTimeout(() => sendPoliceMsg('INCONNU', "Regardez la caméra. Vous verrez."), 2500);
    setTimeout(() => sendPoliceMsg('Police 17', "Nous envoyons une patrouille."), 4200);
    addQuest('void_scene', "Affronter le vide (commande 'void')");
}

function handleChoice(step, txtReponse) {
    convos[activeContact].push({ name: 'Moi', txt: txtReponse, cls: 'msg me' });
    ui.iscord.choices.classList.add('hidden');
    renderChat();
    completeQuest('repondre_thomas');
    
    if(step === 1) {
        sendIscordMsg("Thomas ❤️", "Y'a une silhouette dans ton jardin.");
        sendIscordMsg("Thomas ❤️", "Merde, il regarde vers ta fenêtre.");
        sendIscordMsg("Thomas ❤️", "Je suis devant ta porte. Ouvre-moi vite !");
        showChoices([
            { txt: "J'arrive tout de suite !", next: 2 },
            { txt: "Attends, je regarde la caméra d'abord...", next: 3 }
        ]);
    }
    
    if(step === 2) {
        sendIscordMsg("Thomas ❤️", "POURQUOI TU N'OUVRES PAS ???");
        openWindow('win-camera');
        triggerThomasDeath();
    }
    
    if(step === 3) {
        const marker = document.createElement('div');
        marker.id = 'waiting-cam';
        document.body.appendChild(marker);
        state.flags.cameraUnlocked = true;
        sendIscordMsg("Thomas ❤️", "DÉPÊCHE TOI ! IL EST LÀ !");
        updateDockLocks();
    }
}

function updateDockLocks() {
    const map = {
        'icon-word': true,
        'icon-iscord': true,
        'icon-camera': true,
        'icon-email': true,
        'icon-browser': true,
        'icon-gallery': true,
        'icon-terminal': true
    };
    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        if(map[id]) el.classList.remove('locked'); else el.classList.add('locked');
    });
}

function isAppAllowed(id) {
    return true;
}

function triggerThomasDeath() {
    const marker = document.getElementById('waiting-cam');
    if(marker) marker.remove();
    
    state.flags.thomasDead = true;
    
    setTimeout(() => {
        const sysMsg = document.createElement('div');
        sysMsg.className = "msg";
        sysMsg.style.borderLeft = "3px solid red";
        sysMsg.style.background = "black";
        sysMsg.style.color = "red";
        sysMsg.innerHTML = "<strong>SYSTEM</strong><br>CONNEXION PERDUE AVEC THOMAS.";
        ui.iscord.chat.appendChild(sysMsg);
        ui.iscord.chat.scrollTop = ui.iscord.chat.scrollHeight;
        
        playSfx('glitch');
        
        setTimeout(() => {
            sendIscordMsg("INCONNU", "Tu es la prochaine.");
            playSfx('glitch');
            setTimeout(() => sendIscordMsg("INCONNU", "Si tu veux comprendre, utilise le TERMINAL."), 2000);
            setTimeout(() => spawnPostIt("Ne lui ouvre pas", { variant: 'danger', life: 7000 }), 2500);
            // police quest removed
        }, 4000);
    }, 4000); // Thomas meurt après 4s de visionnage
}

/* =========================================
   5. TERMINAL (GAMEPLAY FINAL)
   ========================================= */

ui.terminal.inp.addEventListener('keyup', (e) => {
    if(e.key === 'Enter') {
        const input = ui.terminal.inp.value.toLowerCase().trim();
        const line = document.createElement('div');
        line.innerText = `C:\\Users\\Lea> ${input}`;
        ui.terminal.out.appendChild(line);
        ui.terminal.inp.value = "";
        addHistory(input);
        processCommand(input);
    }
});

ui.terminal.inp.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowUp') {
        const prev = getHistory(-1);
        if(prev !== null) ui.terminal.inp.value = prev;
        e.preventDefault();
    }
    if(e.key === 'ArrowDown') {
        const next = getHistory(1);
        if(next !== null) ui.terminal.inp.value = next;
        e.preventDefault();
    }
});

document.getElementById('win-terminal').addEventListener('click', () => {
    ui.terminal.inp.focus();
});

window.addEventListener('keydown', (e) => {
    const termWin = document.getElementById('win-terminal');
    if(!termWin.classList.contains('hidden') && document.activeElement !== ui.terminal.inp) {
        ui.terminal.inp.focus();
    }
});

function printTerm(text, color = "#0f0", delay = 0) {
    setTimeout(() => {
        const div = document.createElement('div');
        div.style.color = color;
        div.innerHTML = text;
        ui.terminal.out.appendChild(div);
        ui.terminal.out.scrollTop = ui.terminal.out.scrollHeight;
    }, delay);
}

function processCommand(cmd) {
    if(cmd === "help") {
        printTerm("COMMANDES DISPONIBLES :");
        printTerm("- scan : Analyse système");
        printTerm("- list : Affiche les fichiers cachés");
        printTerm("- decrypt [code] : Déchiffre un fichier");
        printTerm("- exit : Fermer le terminal");
        printTerm("- clear : Nettoie l'écran");
        printTerm("- echo [texte] : Affiche le texte");
        printTerm("- whoami : Identité système");
        printTerm("- status : État du système");
        printTerm("- hint : Liste des objectifs");
        printTerm("- mirror : Miroir écran");
        printTerm("- void : ???");
        printTerm("- call 17 : Appeler la Police 17");
    }
    else if(cmd === "scan") {
        printTerm("Analyse en cours...", "yellow");
        printTerm("[...] Recherche de menaces...", "yellow", 1000);
        printTerm("ALERTE CRITIQUE DÉTECTÉE.", "red", 2000);
        printTerm("L'entité 'VILLAIN' a pris le contrôle de la webcam.", "red", 2500);
    }
    else if(cmd === "list") {
        printTerm("Répertoire de C:\\Users\\Lea\\Secret");
        printTerm("----------------------------------");
        printTerm("18/11/2023  <DIR>  .");
        printTerm("18/11/2023  <FILE>  truth.enc (CRYPTE)");
        printTerm("indice : Le code se trouve dans une photo corrompue.", "gray");
    }
else if(cmd.startsWith("decrypt")) {
    const args = cmd.split(" ");
    if(args.length < 2) {
        printTerm("Erreur : Veuillez spécifier le code. Ex: decrypt 1234", "red");
        return;
    }
        
        if(args[1] === CONFIG.code_decrypt) {
            printTerm("CODE ACCEPTÉ.", "#0f0");
            printTerm("Déchiffrement du fichier truth.enc...", "#0f0", 1000);
            printTerm("----------------------------------", "white", 2000);
            printTerm("CONTENU DU FICHIER :", "white", 2200);
            printTerm("'Tu n'es pas enfermée avec moi.'", "red", 3000);
            printTerm("'Je suis enfermé avec toi.'", "red", 4000);
            printTerm("'Regarde derrière toi.'", "red", 5000);
            setTimeout(() => { if(!state.chaptersShown.iv) { setChapter(L.chapter_iv, () => {}); state.chaptersShown.iv = true; } }, 4500);
            
            setTimeout(triggerEnding, 6000);
        } else {
            printTerm("CODE INCORRECT. ACCÈS REFUSÉ.", "red");
        }
    }
    else if(cmd === "clear") {
        ui.terminal.out.innerHTML = "";
    }
    else if(cmd.startsWith("echo ")) {
        printTerm(cmd.slice(5));
    }
    else if(cmd === "whoami") {
        printTerm("Utilisateur: Lea");
        printTerm("Identité: CORROMPUE", "red");
        printTerm("Processus: VILLAIN(1) attaché", "yellow");
    }
    else if(cmd === "status") {
        printTerm("Réseau: ISOLÉ");
        printTerm("Caméra: CONTRÔLÉE", "red");
        printTerm("Micro: ECOUTE", "yellow");
        printTerm("Intégrité: 37%", "red");
    }
    else if(cmd === "hint") {
        listQuestsInTerminal();
    }
    else if(cmd === "mirror") {
        document.body.classList.toggle('mirror');
        printTerm("Mode miroir basculé.");
    }
    else if(cmd === "void") {
        triggerVoidScene();
    }
    else if(cmd === "call" || cmd === "call 17") {
        printTerm("Service non disponible.");
    }
    else if(cmd === "exit") closeWin('win-terminal');
    else printTerm(`'${cmd}' n'est pas reconnu. Tapez 'help'.`, "red");
}

// Historique de commandes
let termHistory = [];
let histIndex = -1;
function addHistory(cmd) {
    if(!cmd) return;
    termHistory.push(cmd);
    histIndex = termHistory.length;
}
function getHistory(delta) {
    if(termHistory.length === 0) return null;
    histIndex += delta;
    if(histIndex < 0) histIndex = 0;
    if(histIndex > termHistory.length) histIndex = termHistory.length;
    if(histIndex === termHistory.length) return "";
    return termHistory[histIndex];
}

/* =========================================
   6. FIN (BSOD)
   ========================================= */

function triggerEnding() {
    ui.audio.bg.pause();
    playSfx('glitch');
    
    document.getElementById('bsod').classList.remove('hidden');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15);
        if(progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                showTruthScroll();
            }, 2000);
        }
        document.querySelector('.loader').innerText = progress + "% complet";
    }, 800);
}

function showTruthScroll() {
    document.getElementById('bsod').classList.add('hidden');
    const ov = document.getElementById('truth-overlay');
    const box = document.getElementById('truth-lines');
    if(!ov || !box) return;
    ov.classList.remove('hidden');
    box.innerHTML = '';
    const lines = [
        "Tu n'as jamais été seule.",
        "Chaque reflet sur l'écran était un regard.",
        "Thomas a frappé à la porte. Ce n'était pas Thomas.",
        "Camille t'a dit de rester cachée. Elle savait.",
        "Le code 1411 n'était pas un mot de passe.",
        "C'était l'heure exacte où l'œil s'est ouvert.",
        "Tu as obéi au TERMINAL. Le TERMINAL n'obéissait à personne.",
        "La caméra n'a pas été compromise. Elle t'a révélée.",
        "Tu as décrypté la vérité. Elle s'est glissée chez toi.",
        "Ne tourne pas la tête. Il est derrière toi."
    ];
    lines.forEach(t => {
        const d = document.createElement('div');
        d.innerText = t;
        box.appendChild(d);
    });
    setTimeout(() => { ov.classList.add('hidden'); showCredits(); }, 20000);
}

function showCredits() {
    const ov = document.getElementById('credits-overlay');
    const t = document.getElementById('credits-title');
    const s = document.getElementById('credits-summary');
    const l = document.getElementById('credits-list');
    if(!ov || !t || !s || !l) { returnToMenu(); return; }
    ov.classList.remove('hidden');
    t.innerText = 'SESSION_LEA';
    s.innerHTML = "Merci d'avoir joué.<br>Tu as suivi les traces: Iscord → Caméra → Web → Galerie → Terminal. La vérité était là, derrière toi.";
    l.innerHTML = "Crédits:<br>CLS Studio — Design, Développement, Histoire, Musique";
    setTimeout(() => { ov.classList.add('hidden'); returnToMenu(); }, 8000);
}

function returnToMenu() {
    try { ui.screens.desktop.classList.add('hidden'); } catch(e) {}
    try { ui.screens.login.classList.add('hidden'); } catch(e) {}
    try { ui.screens.intro.classList.remove('hidden'); } catch(e) {}
    try { ui.audio.bg.pause(); ui.audio.static.pause(); ui.audio.breath.pause(); } catch(e) {}
}

function triggerVoidScene() {
    const ov = document.getElementById('void-overlay');
    const vv = document.getElementById('void-video');
    if(!ov || !vv) return;
    ov.classList.remove('hidden');
    vv.currentTime = 0;
    vv.play().catch(() => {});
    playSfx('scream');
    spawnBlood(20);
    setTimeout(() => {
        ov.classList.add('hidden');
    }, 6000);
}

function spawnBlood(n) {
    const cont = document.getElementById('blood-drops');
    if(!cont) return;
    cont.innerHTML = '';
    const w = cont.clientWidth || window.innerWidth;
    for(let i=0;i<n;i++) {
        const d = document.createElement('div');
        d.className = 'blood-drop';
        const x = Math.floor(Math.random() * (w - 20));
        d.style.left = x + 'px';
        d.style.animationDelay = (Math.random() * 1.5) + 's';
        cont.appendChild(d);
    }
}

function listQuestsInTerminal() {
    if(typeof quests === 'undefined' || !quests.length) { printTerm("Aucune quête."); return; }
    printTerm("Objectifs:");
    quests.forEach(q => {
        const mark = q.done ? "[x]" : "[ ]";
        printTerm(`${mark} ${q.label}`);
    });
}
function playIntroStory(onDone) {
    const lines = L.prologue_lines;
    ui.prologueEl.classList.remove('hidden');
    ui.prologueTxt.innerText = '';
    ui.prologueTxt.classList.add('type-caret');
    let i = 0;
    const typeLine = () => {
        if(i >= lines.length) {
            ui.prologueTxt.classList.remove('type-caret');
            if(typeof onDone === 'function') onDone();
            return;
        }
        let idx = 0;
        const s = lines[i];
        ui.prologueTxt.innerText = '';
        const it = setInterval(() => {
            ui.prologueTxt.innerText += s[idx] || '';
            idx++;
            if(idx >= s.length) {
                clearInterval(it);
                setTimeout(() => { i++; typeLine(); }, 1200);
            }
        }, 35);
    };
    typeLine();
}
function adjustAIOnQuest(id) {
    if(id === 'open_iscord') AI_STATE.mood.doubt = Math.max(0, AI_STATE.mood.doubt - 1);
    if(id === 'open_camera') AI_STATE.mood.anger = Math.min(5, AI_STATE.mood.anger + 1);
    if(id === 'search_web') AI_STATE.mood.doubt = Math.max(0, AI_STATE.mood.doubt - 1);
    if(id === 'find_code') {
        AI_STATE.mood.anger = Math.min(5, AI_STATE.mood.anger + 2);
        sendIscordMsg('INCONNU', "Tu l'as vu.");
    }
    if(id === 'read_email_maman') { sendIscordMsg('Camille', "Réponds à ta mère. Reste cachée."); replyToMom(); }
}

function ensureStaticOn() {
    if(ui.audio && ui.audio.static) {
        try {
            ui.audio.static.loop = true;
            if(ui.audio.static.paused) { ui.audio.static.currentTime = 0; ui.audio.static.play(); }
        } catch(e) {}
    }
}

function replyToMom() {
    const momIdx = emails.findIndex(m => m.from === 'Maman');
    const subj = momIdx !== -1 ? `Re: ${emails[momIdx].subject}` : 'Re: ...';
    const body = "Maman, il se passe quelque chose d’étrange. Des messages apparaissent, la caméra est contrôlée. Je reste à l’intérieur et je verrouille tout. Je te tiens au courant.";
    pushEmail({ from: 'Moi', subject: subj, body, unread: false });
    openWindow('win-email');
    openEmail(0);
}
