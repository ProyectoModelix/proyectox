(function() {
    'use strict';

    const I18N = window.OPTIMA_I18N || { en: {}, ui: { es: {}, en: {} } };
    const navbar = document.querySelector('.navbar');
    const contactForm = document.querySelector('.contact-form');
    const SVG_NS = 'http://www.w3.org/2000/svg';

    let currentLang = 'es';
    const langListeners = [];

    function ui() {
        return I18N.ui[currentLang] || I18N.ui.es;
    }

    /* ======================================================
       Idioma / Language
       ====================================================== */
    function initI18n() {
        const textEls = document.querySelectorAll('[data-i18n]');
        const phEls = document.querySelectorAll('[data-i18n-ph]');
        const es = {};

        // El español original vive en el HTML
        textEls.forEach(el => {
            const key = el.dataset.i18n;
            if (!(key in es)) es[key] = el.innerHTML;
        });
        phEls.forEach(el => {
            const key = el.dataset.i18nPh;
            if (!(key in es)) es[key] = el.getAttribute('placeholder');
        });
        const dict = { es: es, en: I18N.en };
        const metaDesc = document.querySelector('meta[name="description"]');
        const meta = {
            es: { title: document.title, desc: metaDesc ? metaDesc.content : '' },
            en: {
                title: 'OPTIMA | Mathematical Optimization & Optimal Decisions',
                desc: 'OPTIMA - Turning complex problems into optimal decisions through scientific modeling, mathematical optimization, and tailored software.'
            }
        };

        function apply(lang) {
            currentLang = lang === 'en' ? 'en' : 'es';
            const d = dict[currentLang];

            textEls.forEach(el => {
                const v = d[el.dataset.i18n];
                if (v !== undefined) el.innerHTML = v;
            });
            phEls.forEach(el => {
                const v = d[el.dataset.i18nPh];
                if (v !== undefined) el.setAttribute('placeholder', v);
            });

            document.documentElement.lang = currentLang;
            document.title = meta[currentLang].title;
            if (metaDesc) metaDesc.content = meta[currentLang].desc;

            document.querySelectorAll('.lang-btn').forEach(btn => {
                const on = btn.dataset.lang === currentLang;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });

            try { localStorage.setItem('optima-lang', currentLang); } catch (e) { /* noop */ }
            langListeners.forEach(fn => fn(currentLang));
        }

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => apply(btn.dataset.lang));
        });

        let initial = 'es';
        try {
            const saved = localStorage.getItem('optima-lang');
            if (saved) initial = saved;
            else if ((navigator.language || '').toLowerCase().startsWith('en')) initial = 'en';
        } catch (e) { /* noop */ }
        apply(initial);
    }

    /* ======================================================
       Scroll reveal, nav, menú
       ====================================================== */
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    function scrollToTarget(target) {
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        let top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        // El hero ocupa 400vh: "Inicio" siempre vuelve al principio
        if (target.id === 'inicio') top = 0;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const id = this.getAttribute('href');
                if (id.length < 2) return;
                const target = document.querySelector(id);
                if (target) {
                    e.preventDefault();
                    scrollToTarget(target);
                }
            });
        });
    }

    function initNavbarScroll() {
        const sections = Array.from(document.querySelectorAll('main section[id], #contacto'));
        const links = Array.from(document.querySelectorAll('.nav-links a'));

        function onScroll() {
            if (navbar) navbar.classList.toggle('scrolled', window.pageYOffset > 50);

            const probe = window.innerHeight * 0.35;
            let activeId = null;
            sections.forEach(sec => {
                const r = sec.getBoundingClientRect();
                if (r.top <= probe && r.bottom > probe) activeId = sec.id;
            });
            links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + activeId));
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function initMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (!btn || !navLinks) return;

        btn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            btn.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                btn.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    /* ======================================================
       Formulario
       ====================================================== */
    function initContactForm() {
        if (!contactForm) return;
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fd = new FormData(this);
            const nombre = (fd.get('nombre') || '').trim();
            const email = (fd.get('email') || '').trim();

            if (!nombre || !email) return showNotification(ui().formRequired, 'error');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showNotification(ui().formEmail, 'error');

            showNotification(ui().formOk, 'success');
            this.reset();
        });
    }

    function showNotification(message, type) {
        const old = document.querySelector('.notification');
        if (old) old.remove();

        const n = document.createElement('div');
        n.className = 'notification notification-' + (type || 'info');
        n.setAttribute('role', 'status');
        const msg = document.createElement('span');
        msg.textContent = message;
        const close = document.createElement('button');
        close.className = 'notification-close';
        close.setAttribute('aria-label', 'Cerrar');
        close.innerHTML = '&times;';
        close.addEventListener('click', () => n.remove());
        n.append(msg, close);
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 5000);
    }

    /* ======================================================
       Visualizaciones decorativas (SVG)
       ====================================================== */
    function svgEl(tag, attrs, parent) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(el);
        return el;
    }

    function rng(seed) {
        let s = seed;
        return function() {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    const VIZ = {
        optimization(host) {
            const svg = svgEl('svg', { viewBox: '0 0 420 240', 'aria-hidden': 'true' });
            const cx = 285, cy = 105;
            for (let i = 7; i >= 1; i--) {
                svgEl('ellipse', {
                    cx: cx, cy: cy, rx: i * 26, ry: i * 15,
                    transform: 'rotate(-18 ' + cx + ' ' + cy + ')',
                    class: 'v-contour', style: '--o:' + (0.08 + (7 - i) * 0.035)
                }, svg);
            }
            // Región factible
            svgEl('polygon', { points: '40,215 40,120 120,60 250,150 220,215', class: 'v-region' }, svg);
            svgEl('line', { x1: 20, y1: 135, x2: 150, y2: 37, class: 'v-constraint' }, svg);
            svgEl('line', { x1: 95, y1: 25, x2: 275, y2: 165, class: 'v-constraint' }, svg);
            // Trayectoria del algoritmo
            svgEl('polyline', {
                points: '62,200 80,170 118,160 140,128 176,124 196,110 214,122 238,140 250,150',
                class: 'v-path draw'
            }, svg);
            svgEl('circle', { cx: 250, cy: 150, r: 6, class: 'v-opt' }, svg);
            svgEl('circle', { cx: 250, cy: 150, r: 14, class: 'v-opt-ring' }, svg);
            const t1 = svgEl('text', { x: 18, y: 28, class: 'v-math' }, svg);
            t1.textContent = 'min  cᵀx';
            const t2 = svgEl('text', { x: 18, y: 48, class: 'v-math v-math--muted' }, svg);
            t2.textContent = 's.a.  Ax ≤ b,  x ≥ 0';
            const t3 = svgEl('text', { x: 262, y: 176, class: 'v-label' }, svg);
            t3.textContent = 'x*';
            host.appendChild(svg);
        },

        simulation(host) {
            const svg = svgEl('svg', { viewBox: '0 0 420 240', 'aria-hidden': 'true' });
            const r = rng(42);
            svgEl('line', { x1: 30, y1: 210, x2: 400, y2: 210, class: 'v-axis' }, svg);
            svgEl('line', { x1: 30, y1: 20, x2: 30, y2: 210, class: 'v-axis' }, svg);
            svgEl('line', { x1: 30, y1: 70, x2: 400, y2: 70, class: 'v-target' }, svg);
            let best = null, bestY = Infinity;
            const paths = [];
            for (let p = 0; p < 16; p++) {
                let y = 150, pts = [];
                for (let x = 30; x <= 400; x += 14) {
                    pts.push(x + ',' + y.toFixed(1));
                    y += (r() - 0.53) * 22;
                    y = Math.max(28, Math.min(205, y));
                }
                const dist = Math.abs(y - 70);
                paths.push(pts.join(' '));
                if (dist < bestY) { bestY = dist; best = p; }
            }
            paths.forEach((pts, i) => {
                svgEl('polyline', { points: pts, class: i === best ? 'v-walk v-walk--best draw' : 'v-walk' }, svg);
            });
            const lastPt = paths[best].split(' ').pop().split(',');
            svgEl('circle', { cx: lastPt[0], cy: lastPt[1], r: 5, class: 'v-opt' }, svg);
            const t = svgEl('text', { x: 40, y: 34, class: 'v-math' }, svg);
            t.textContent = 'E[f(x, ξ)] → min';
            host.appendChild(svg);
        },

        gis(host) {
            const svg = svgEl('svg', { viewBox: '0 0 320 220', 'aria-hidden': 'true' });
            const cols = 11, rows = 7, w = 26, h = 26, ox = 17, oy = 18;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const v = 0.5 + 0.5 * Math.sin(i * 0.7 + j * 0.4) * Math.cos(j * 0.9 - i * 0.25);
                    const level = v > 0.72 ? 3 : v > 0.48 ? 2 : v > 0.25 ? 1 : 0;
                    svgEl('rect', {
                        x: ox + i * (w + 1.5), y: oy + j * (h + 1.5), width: w, height: h, rx: 2,
                        class: 'v-cell v-cell--' + level,
                        style: '--d:' + ((i + j) * 25) + 'ms'
                    }, svg);
                }
            }
            svgEl('path', { d: 'M12 14 L300 10 L306 208 L16 212 Z', class: 'v-field' }, svg);
            host.appendChild(svg);
        },

        gantt(host) {
            const svg = svgEl('svg', { viewBox: '0 0 320 220', 'aria-hidden': 'true' });
            const rows = [[0, 4, 7, 10], [2, 5, 8, 12], [1, 3, 6, 9], [4, 7, 11, 13], [0, 2, 5, 8], [3, 6, 10, 13]];
            for (let d = 0; d <= 14; d++) {
                svgEl('line', { x1: 30 + d * 19.5, y1: 14, x2: 30 + d * 19.5, y2: 206, class: 'v-grid' }, svg);
            }
            rows.forEach((r, i) => {
                const y = 22 + i * 31;
                const lbl = svgEl('text', { x: 4, y: y + 15, class: 'v-label' }, svg);
                lbl.textContent = 'L' + (i + 1);
                svgEl('rect', { x: 30 + r[0] * 19.5, y: y, width: (r[1] - r[0]) * 19.5 - 3, height: 20, rx: 3, class: 'v-bar v-bar--a', style: '--d:' + (i * 90) + 'ms' }, svg);
                svgEl('rect', { x: 30 + r[2] * 19.5, y: y, width: (r[3] - r[2]) * 19.5 - 3, height: 20, rx: 3, class: 'v-bar v-bar--b', style: '--d:' + (i * 90 + 200) + 'ms' }, svg);
            });
            host.appendChild(svg);
        },

        routes(host) {
            const svg = svgEl('svg', { viewBox: '0 0 320 220', 'aria-hidden': 'true' });
            const depot = [160, 112];
            const routes = [
                [[160, 112], [110, 70], [62, 44], [40, 98], [86, 128], [160, 112]],
                [[160, 112], [214, 58], [272, 40], [292, 104], [236, 120], [160, 112]],
                [[160, 112], [120, 166], [70, 186], [180, 198], [258, 176], [214, 150], [160, 112]]
            ];
            const r = rng(7);
            for (let i = 0; i < 26; i++) {
                svgEl('circle', { cx: 14 + r() * 292, cy: 14 + r() * 192, r: 1.4, class: 'v-dot' }, svg);
            }
            routes.forEach((route, i) => {
                svgEl('polyline', { points: route.map(p => p.join(',')).join(' '), class: 'v-route v-route--' + i + ' draw' }, svg);
                route.slice(1, -1).forEach(p => svgEl('circle', { cx: p[0], cy: p[1], r: 4.5, class: 'v-stop v-stop--' + i }, svg));
            });
            svgEl('rect', { x: depot[0] - 7, y: depot[1] - 7, width: 14, height: 14, class: 'v-depot' }, svg);
            host.appendChild(svg);
        }
    };

    function initVisuals() {
        document.querySelectorAll('[data-viz]').forEach(host => {
            const fn = VIZ[host.dataset.viz];
            if (fn) fn(host);
        });
        // Longitud de trazos para animación de dibujo
        document.querySelectorAll('.draw').forEach(p => {
            const len = typeof p.getTotalLength === 'function' ? p.getTotalLength() : 800;
            p.style.setProperty('--len', Math.ceil(len));
        });
    }

    /* ======================================================
       Demo de optimización de producción
       ====================================================== */
    function initDemo() {
        const root = document.getElementById('demoConsole');
        if (!root) return;

        const inputEl = document.getElementById('demoInput');
        const logEl = document.getElementById('demoLog');
        const resultsEl = document.getElementById('demoResults');
        const kpiEl = document.getElementById('demoKpis');
        const chartEl = document.getElementById('demoChart');
        const legendEl = document.getElementById('demoLegend');
        const readingEl = document.getElementById('demoReading');
        const statusEl = document.getElementById('demoStatus');
        const runBtn = document.getElementById('demoRun');
        const slider = document.getElementById('demoScenario');
        const sliderOut = document.getElementById('demoScenarioOut');
        const sliderLabel = document.getElementById('demoSliderLabel');
        const steps = document.querySelectorAll('.demo-step');

        const BASE_DEMAND = [420, 460, 510, 600, 740, 820, 700, 620, 560, 500, 600, 720];
        const CAPACITY = [600, 600, 600, 650, 650, 650, 600, 550, 600, 600, 650, 650];
        const INV0 = 120;
        const SS = 80;

        let state = 'idle'; // idle | running | done
        let result = null;
        let timers = [];

        function demand() {
            const f = Number(slider.value) / 100;
            return BASE_DEMAND.map(d => Math.round(d * f));
        }

        function simulate(prod, dem) {
            let inv = INV0, short = 0;
            const invs = [];
            const shorts = [];
            prod.forEach((p, t) => {
                inv += p - dem[t];
                let s = 0;
                if (inv < 0) { s = -inv; short += s; inv = 0; }
                invs.push(inv);
                shorts.push(s);
            });
            return { inv: invs, shortByMonth: shorts, short: short };
        }

        function solve() {
            const dem = demand();
            const T = dem.length;

            // Plan sin optimizar: lote a lote (produce lo del mes)
            const basePlan = [];
            let inv = INV0;
            for (let t = 0; t < T; t++) {
                const p = Math.min(CAPACITY[t], Math.max(0, dem[t] + SS - inv));
                basePlan.push(p);
                inv = Math.max(0, inv + p - dem[t]);
            }
            const base = simulate(basePlan, dem);

            // Plan optimizado: requerimientos netos + adelanto de producción hacia atrás
            const req = dem.slice();
            req[0] = Math.max(0, dem[0] + SS - INV0);
            for (let t = T - 1; t > 0; t--) {
                if (req[t] > CAPACITY[t]) {
                    req[t - 1] += req[t] - CAPACITY[t];
                    req[t] = CAPACITY[t];
                }
            }
            const prod = req.map((r, t) => Math.min(r, CAPACITY[t]));
            const opt = simulate(prod, dem);

            const totalD = dem.reduce((a, b) => a + b, 0);
            const totalP = prod.reduce((a, b) => a + b, 0);
            const totalC = CAPACITY.reduce((a, b) => a + b, 0);

            return {
                dem: dem,
                prod: prod,
                inv: opt.inv,
                shortByMonth: opt.shortByMonth,
                fill: (totalD - opt.short) / totalD * 100,
                baseFill: (totalD - base.short) / totalD * 100,
                baseShort: base.short,
                phases: findPhases(dem, prod),
                avoided: Math.max(0, base.short - opt.short),
                util: totalP / totalC * 100,
                avgInv: opt.inv.reduce((a, b) => a + b, 0) / T
            };
        }

        /* Agrupa meses consecutivos marcados en rangos [inicio, fin] */
        function toRanges(flags) {
            const out = [];
            let start = -1;
            flags.forEach((f, i) => {
                if (f && start < 0) start = i;
                if (start >= 0 && (!f || i === flags.length - 1)) {
                    out.push([start, f ? i : i - 1]);
                    start = -1;
                }
            });
            return out;
        }

        /* Etapas del plan: picos (demanda > capacidad) y acumulación previa */
        function findPhases(dem, prod) {
            const peaks = toRanges(dem.map((d, i) => d > CAPACITY[i]));
            let build = null;
            if (peaks.length) {
                const p0 = peaks[0][0];
                let i = p0 - 1;
                while (i >= 0 && prod[i] > dem[i]) i--;
                if (i + 1 <= p0 - 1) build = [i + 1, p0 - 1];
            }
            return { peaks: peaks, build: build };
        }

        function rangeLabel(r) {
            const m = ui().months;
            return r[0] === r[1] ? m[r[0]] : m[r[0]] + '–' + m[r[1]];
        }

        function joinList(items) {
            if (items.length <= 1) return items.join('');
            return items.slice(0, -1).join(', ') + ui().and + items[items.length - 1];
        }

        function renderReading(r) {
            const u = ui();
            const items = [];
            const ph = r.phases;

            if (!ph.peaks.length) {
                items.push(['none', u.nNoPeak]);
            } else {
                if (ph.build) {
                    let maxI = 0;
                    r.inv.forEach((v, i) => { if (v > r.inv[maxI]) maxI = i; });
                    items.push(['build', u.nBuild
                        .replace('{range}', rangeLabel(ph.build))
                        .replace('{max}', fmt(r.inv[maxI]))
                        .replace('{month}', u.months[maxI])]);
                }
                let peakText = u.nPeak.replace('{range}', joinList(ph.peaks.map(rangeLabel)));
                const shortMonths = [];
                let shortTotal = 0;
                r.shortByMonth.forEach((s, i) => { if (s > 0) { shortMonths.push(u.months[i]); shortTotal += s; } });
                if (shortTotal > 0) {
                    peakText += u.nShort.replace('{months}', joinList(shortMonths)).replace('{n}', fmt(shortTotal));
                }
                items.push(['peak', peakText]);
            }

            items.push(['result', u.nResult
                .replace('{fill}', fmt(r.fill, 1))
                .replace('{base}', fmt(r.baseFill, 1))
                .replace('{baseShort}', r.baseShort > 0 ? u.nBaseShort.replace('{n}', fmt(r.baseShort)) : '')]);

            readingEl.innerHTML =
                '<h4 class="reading-title">' + u.readTitle + '</h4><ol class="reading-list">' +
                items.map((it, i) => '<li class="reading--' + it[0] + '" style="--i:' + i + '"><span class="reading-n">' + (i + 1) + '</span><p>' + it[1] + '</p></li>').join('') +
                '</ol>';
        }

        function setStep(n) {
            steps.forEach(s => s.classList.toggle('is-active', Number(s.dataset.step) <= n));
            steps.forEach(s => s.classList.toggle('is-current', Number(s.dataset.step) === n));
        }

        function setStatus() {
            const u = ui();
            const map = { idle: u.statusReady, running: u.statusRunning, done: u.statusDone };
            statusEl.textContent = map[state];
            statusEl.dataset.state = state;
        }

        const compactMQ = window.matchMedia('(max-width: 640px)');
        const isCompact = () => compactMQ.matches;

        function renderInput() {
            const u = ui();
            const dem = demand();
            if (isCompact()) {
                let g = '<div class="data-grid-key"><span class="k k-d">' + u.demand + '</span><span class="k k-c">' + u.capacity + '</span></div><div class="data-grid">';
                dem.forEach((d, i) => {
                    g += '<div class="dg-cell"><span class="dg-m">' + u.months[i] + '</span><span class="dg-d">' + d + '</span><span class="dg-c">' + CAPACITY[i] + '</span></div>';
                });
                g += '</div>';
                g += '<dl class="data-params"><div><dt>' + u.initInv + '</dt><dd>' + INV0 + ' ' + u.units + '</dd></div>' +
                     '<div><dt>' + u.safety + '</dt><dd>' + SS + ' ' + u.units + '</dd></div></dl>';
                inputEl.innerHTML = g;
                sliderLabel.textContent = u.scenario;
                sliderOut.textContent = slider.value + '%';
                return;
            }
            let html = '<div class="data-table-wrap"><table class="data-table"><thead><tr><th>' + u.month + '</th>';
            u.months.forEach(m => { html += '<th>' + m + '</th>'; });
            html += '</tr></thead><tbody><tr><th>' + u.demand + '</th>';
            dem.forEach(d => { html += '<td>' + d + '</td>'; });
            html += '</tr><tr><th>' + u.capacity + '</th>';
            CAPACITY.forEach(c => { html += '<td>' + c + '</td>'; });
            html += '</tr></tbody></table></div>';
            html += '<dl class="data-params"><div><dt>' + u.initInv + '</dt><dd>' + INV0 + ' ' + u.units + '</dd></div>' +
                    '<div><dt>' + u.safety + '</dt><dd>' + SS + ' ' + u.units + '</dd></div></dl>';
            inputEl.innerHTML = html;
            sliderLabel.textContent = u.scenario;
            sliderOut.textContent = slider.value + '%';
        }

        function fmt(n, dec) {
            return n.toLocaleString(currentLang === 'en' ? 'en-US' : 'es-AR', {
                minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0
            });
        }

        function renderKpis(r) {
            const u = ui();
            const cards = [
                { label: u.kpiFill, value: fmt(r.fill, 1) + '%', sub: u.kpiFillSub.replace('{b}', fmt(r.baseFill, 1)), hl: true },
                { label: u.kpiShort, value: fmt(r.avoided), sub: u.kpiShortSub },
                { label: u.kpiUtil, value: fmt(r.util, 1) + '%', sub: u.kpiUtilSub },
                { label: u.kpiInv, value: fmt(r.avgInv), sub: u.kpiInvSub }
            ];
            kpiEl.innerHTML = cards.map(c =>
                '<div class="kpi' + (c.hl ? ' kpi--hl' : '') + '"><span class="kpi-label">' + c.label +
                '</span><span class="kpi-value">' + c.value + '</span><span class="kpi-sub">' + c.sub + '</span></div>'
            ).join('');
        }

        function renderChart(r, animate) {
            const u = ui();
            const compact = isCompact();
            const W = compact ? 360 : 960;
            const H = compact ? 440 : 372;
            const padL = compact ? 46 : 48, padR = compact ? 4 : 16;
            const padT = compact ? 46 : 52, padB = compact ? 28 : 36;
            const T = r.dem.length;
            const maxV = Math.ceil(Math.max.apply(null, r.dem.concat(r.prod, CAPACITY, r.inv)) * 1.12 / 100) * 100;
            const cw = (W - padL - padR) / T;
            const y = v => padT + (H - padT - padB) * (1 - v / maxV);
            const x = i => padL + cw * i + cw / 2;

            const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart' + (compact ? ' chart--compact' : '') + (animate ? ' chart--animate' : ''), role: 'img', 'aria-label': u.production });

            const ticks = compact ? 2 : 4;
            for (let v = 0; v <= maxV; v += maxV / ticks) {
                svgEl('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: 'c-grid' }, svg);
                const t = svgEl('text', { x: padL - (compact ? 6 : 10), y: y(v) + 4, class: 'c-tick', 'text-anchor': 'end' }, svg);
                t.textContent = fmt(v);
            }

            // Etapas del plan (franjas de fondo con etiqueta)
            const bands = [];
            if (r.phases.build) bands.push({ r: r.phases.build, cls: 'build', long: u.phaseBuild, short: u.phaseBuildShort, n: 1 });
            r.phases.peaks.forEach(pk => bands.push({ r: pk, cls: 'peak', long: u.phasePeak, short: u.phasePeakShort, n: r.phases.build ? 2 : 1 }));
            bands.forEach((b, k) => {
                const x0 = padL + cw * b.r[0] + 2;
                const x1 = padL + cw * (b.r[1] + 1) - 2;
                const months = b.r[1] - b.r[0] + 1;
                const g = svgEl('g', { class: 'c-band c-band--' + b.cls, style: '--k:' + k }, svg);
                svgEl('rect', { x: x0, y: 8, width: x1 - x0, height: y(0) - 8, rx: 4, class: 'c-band-bg' }, g);
                svgEl('line', { x1: x0, x2: x1, y1: 8, y2: 8, class: 'c-band-top' }, g);
                const label = svgEl('text', { x: (x0 + x1) / 2, y: 28, 'text-anchor': 'middle', class: 'c-band-label' }, g);
                if (compact) label.textContent = months >= 3 ? b.n + ' · ' + b.short : String(b.n);
                else label.textContent = (months >= 3 ? b.n + ' · ' + b.long : (months === 2 ? b.n + ' · ' + b.short : b.short));
            });

            // Inventario (área)
            let area = 'M' + x(0) + ',' + y(0);
            r.inv.forEach((v, i) => { area += ' L' + x(i) + ',' + y(v); });
            area += ' L' + x(T - 1) + ',' + y(0) + ' Z';
            svgEl('path', { d: area, class: 'c-inv-area' }, svg);
            svgEl('polyline', { points: r.inv.map((v, i) => x(i) + ',' + y(v)).join(' '), class: 'c-inv-line' }, svg);

            // Producción (barras) + capacidad
            r.prod.forEach((p, i) => {
                const bw = cw * (compact ? 0.62 : 0.52);
                const g = svgEl('g', { class: 'c-bar-g', style: '--i:' + i }, svg);
                const bar = svgEl('rect', { x: x(i) - bw / 2, y: y(p), width: bw, height: y(0) - y(p), rx: 2, class: 'c-bar' }, g);
                const tt = svgEl('title', {}, bar);
                tt.textContent = u.months[i] + ' · ' + u.production + ': ' + fmt(p) + ' · ' + u.capacity + ': ' + fmt(CAPACITY[i]);
                svgEl('line', { x1: x(i) - cw * 0.38, x2: x(i) + cw * 0.38, y1: y(CAPACITY[i]), y2: y(CAPACITY[i]), class: 'c-cap' }, svg);
                if (r.shortByMonth[i] > 0) {
                    if (compact) {
                        svgEl('circle', { cx: x(i), cy: y(p) - 8, r: 3.5, class: 'c-short c-short-g' }, svg);
                    } else {
                    const sg = svgEl('g', { class: 'c-short-g' }, svg);
                    svgEl('circle', { cx: x(i), cy: y(p) - 10, r: 4, class: 'c-short' }, sg);
                    const st = svgEl('text', { x: x(i), y: y(p) + 18, 'text-anchor': 'middle', class: 'c-short-label' }, sg);
                    st.textContent = '−' + fmt(r.shortByMonth[i]);
                    }
                }
                const ml = svgEl('text', { x: x(i), y: H - 12, class: 'c-tick', 'text-anchor': 'middle' }, svg);
                ml.textContent = compact ? u.months[i].charAt(0) : u.months[i];
            });

            // Demanda (línea)
            const dl = svgEl('polyline', { points: r.dem.map((v, i) => x(i) + ',' + y(v)).join(' '), class: 'c-dem' }, svg);
            r.dem.forEach((v, i) => svgEl('circle', { cx: x(i), cy: y(v), r: compact ? 2.8 : 3.5, class: 'c-dem-dot', style: '--i:' + i }, svg));

            chartEl.innerHTML = '';
            chartEl.appendChild(svg);
            dl.style.setProperty('--len', Math.ceil(dl.getTotalLength ? dl.getTotalLength() : 1200));

            legendEl.innerHTML =
                '<span class="lg lg-prod">' + u.production + '</span>' +
                '<span class="lg lg-dem">' + u.demand + '</span>' +
                '<span class="lg lg-cap">' + u.capacity + '</span>' +
                '<span class="lg lg-inv">' + u.inventory + '</span>' +
                (r.shortByMonth.some(s => s > 0) ? '<span class="lg lg-short">' + u.shortage + '</span>' : '');
        }

        function renderLog(count, done) {
            const lines = ui().log;
            logEl.innerHTML = lines.slice(0, count).map((l, i) => {
                const last = i === lines.length - 1;
                const cls = last && done ? ' log-ok' : (i === count - 1 && !done ? ' log-active' : '');
                return '<div class="log-line' + cls + '"><span class="log-prompt">' + (last && done ? '✓' : '›') + '</span>' + l + '</div>';
            }).join('');
        }

        function clearTimers() {
            timers.forEach(clearTimeout);
            timers = [];
        }

        function reset() {
            clearTimers();
            state = 'idle';
            result = null;
            root.classList.remove('has-results', 'is-running');
            logEl.innerHTML = '';
            setStatus();
            setStep(1);
            runBtn.disabled = false;
        }

        function run() {
            clearTimers();
            state = 'running';
            root.classList.remove('has-results');
            root.classList.add('is-running');
            runBtn.disabled = true;
            setStatus();
            setStep(2);

            const total = ui().log.length;
            for (let i = 1; i <= total; i++) {
                timers.push(setTimeout(() => renderLog(i, i === total), (i - 1) * 520));
            }
            timers.push(setTimeout(() => {
                result = solve();
                state = 'done';
                setStatus();
                setStep(3);
                renderKpis(result);
                renderChart(result, true);
                renderReading(result);
                root.classList.remove('is-running');
                root.classList.add('has-results');
                runBtn.disabled = false;
            }, total * 520 + 150));
        }

        runBtn.addEventListener('click', run);
        slider.addEventListener('input', () => {
            renderInput();
            if (state !== 'idle') reset();
        });

        langListeners.push(() => {
            renderInput();
            setStatus();
            if (state === 'done' && result) {
                renderLog(ui().log.length, true);
                renderKpis(result);
                renderChart(result, false);
                renderReading(result);
            } else if (state === 'running') {
                renderLog(logEl.children.length, false);
            }
        });

        const onBreakpoint = () => {
            renderInput();
            if (state === 'done' && result) renderChart(result, false);
        };
        if (compactMQ.addEventListener) compactMQ.addEventListener('change', onBreakpoint);
        else compactMQ.addListener(onBreakpoint);

        renderInput();
        setStatus();
        setStep(1);
    }

    /* ======================================================
       Hero: animación de frames por scroll (sin cambios)
       ====================================================== */
    function initHeroFrameAnimation() {
        const canvas = document.getElementById('heroCanvas');
        const scrollContainer = document.querySelector('.hero-scroll-container');
        const heroContent = document.querySelector('.hero-content');
        const scrollIndicator = document.querySelector('.hero-scroll-indicator');

        if (!canvas || !scrollContainer) return;

        const ctx = canvas.getContext('2d');
        const totalFrames = 192;
        const frames = [];
        let loadedCount = 0;
        let currentFrame = 0;
        let isReady = false;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (isReady && frames[currentFrame]) {
                drawFrame(currentFrame);
            }
        }

        function drawFrame(index) {
            const img = frames[index];
            if (!img || !img.complete) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasRatio > imgRatio) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgRatio;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawHeight = canvas.height;
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }

        function onScroll() {
            if (!isReady) return;

            const rect = scrollContainer.getBoundingClientRect();
            const scrollableHeight = scrollContainer.offsetHeight - window.innerHeight;
            const scrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
            const frameIndex = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));

            if (frameIndex !== currentFrame && frames[frameIndex]) {
                currentFrame = frameIndex;
                requestAnimationFrame(() => drawFrame(currentFrame));
            }

            if (heroContent) {
                const fadeStart = 0.6;
                const fadeEnd = 0.85;
                if (progress > fadeStart) {
                    const fadeProgress = Math.min(1, (progress - fadeStart) / (fadeEnd - fadeStart));
                    heroContent.style.opacity = 1 - fadeProgress;
                    heroContent.style.transform = `translateY(${-fadeProgress * 60}px)`;
                } else {
                    heroContent.style.opacity = '';
                    heroContent.style.transform = '';
                }
            }

            if (scrollIndicator) {
                const indicatorFade = Math.min(1, progress * 5);
                scrollIndicator.style.opacity = 1 - indicatorFade;
            }
        }

        function preloadFrames() {
            for (let i = 1; i <= totalFrames; i++) {
                const img = new Image();
                const num = String(i).padStart(3, '0');
                img.src = `assets/img/hero/ezgif-frame-${num}.jpg`;
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === 1) {
                        isReady = true;
                        resizeCanvas();
                        drawFrame(0);
                        onScroll();
                    }
                };
                frames[i - 1] = img;
            }
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('scroll', onScroll, { passive: true });

        preloadFrames();
    }

    /* ======================================================
       Contacto: animación de frames en loop (sin cambios)
       ====================================================== */
    function initCtaFrameAnimation() {
        const canvas = document.getElementById('ctaCanvas');
        const section = document.querySelector('.cta-section');

        if (!canvas || !section) return;

        const ctx = canvas.getContext('2d');
        const totalFrames = 64;
        const fps = 24;
        const interval = 1000 / fps;
        const frames = [];
        let loadedCount = 0;
        let currentFrame = 0;
        let isReady = false;
        let lastTime = 0;

        function resizeCanvas() {
            canvas.width = section.offsetWidth;
            canvas.height = section.offsetHeight;
            if (isReady && frames[currentFrame]) {
                drawFrame(currentFrame);
            }
        }

        function drawFrame(index) {
            const img = frames[index];
            if (!img || !img.complete) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasRatio > imgRatio) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgRatio;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawHeight = canvas.height;
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }

        function animate(timestamp) {
            requestAnimationFrame(animate);

            if (!isReady) return;

            const delta = timestamp - lastTime;
            if (delta < interval) return;

            lastTime = timestamp - (delta % interval);
            currentFrame = (currentFrame + 1) % totalFrames;

            if (frames[currentFrame] && frames[currentFrame].complete) {
                drawFrame(currentFrame);
            }
        }

        function preloadFrames() {
            for (let i = 1; i <= totalFrames; i++) {
                const img = new Image();
                const num = String(i).padStart(3, '0');
                img.src = `assets/img/section/ezgif-frame-${num}.jpg`;
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalFrames) {
                        isReady = true;
                        resizeCanvas();
                        drawFrame(0);
                        requestAnimationFrame(animate);
                    }
                };
                frames[i - 1] = img;
            }
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        preloadFrames();
    }

    function init() {
        initVisuals();
        initDemo();
        initI18n();
        initScrollAnimations();
        initSmoothScroll();
        initNavbarScroll();
        initMobileMenu();
        initContactForm();
        initHeroFrameAnimation();
        initCtaFrameAnimation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
