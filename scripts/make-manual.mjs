// Génère le manuel + fiche commerciale « Aux Terrasses de Troinex » en PDF.
// Maquettes d'écran dessinées en vectoriel (couleurs exactes de l'app).
import PDFDocument from 'pdfkit';
import fs from 'fs';

const OUT = 'Manuel-Aux-Terrasses-de-Troinex.pdf';

const C = {
  cream: '#f4efe3', tile: '#fbf8f1', paper: '#ffffff',
  ink: '#201f1b', ink2: '#433f36', sub: '#7a7263',
  border: '#e7e0d1', line: '#ded6c4',
  teal: '#3f7a6e', tealD: '#356458', gold: '#c19a45',
  olive: '#7d9a5f', brique: '#b0574a', ocre: '#c0894a',
  branch: '#6f7d49', oliveFill: '#5a6b34',
  tint: '#f3f5ef', tintGold: '#f7f1e2',
};

const PAGE = { w: 595.28, h: 841.89 };
const M = 52;
const CW = PAGE.w - M * 2;

const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 18, left: M, right: M }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// ---------- helpers ----------
function rr(x, y, w, h, r) { return doc.roundedRect(x, y, w, h, r); }
function fillPage(color) { doc.save().rect(0, 0, PAGE.w, PAGE.h).fill(color).restore(); }
function checkMark(cx, cy, s, color = '#fff', lw = 1.6) {
  doc.save().lineWidth(lw).strokeColor(color).lineJoin('round').lineCap('round')
     .moveTo(cx - s, cy).lineTo(cx - s * 0.25, cy + s * 0.75).lineTo(cx + s, cy - s * 0.7).stroke().restore();
}

function drawBranch(tx, ty, s, colBranch = C.branch, colOlive = C.oliveFill, lw = 1.6) {
  const LEAF = 'M0 0 Q11 -5 22 0 Q11 5 0 0 Z';
  const leaves = [[160,28,115],[176,20,100],[192,15,92],[210,15,82],[228,21,68],[242,29,55]];
  doc.save();
  doc.translate(tx, ty).scale(s).translate(-150, -8);
  doc.lineWidth(lw).strokeColor(colBranch);
  doc.path('M150 32 Q200 8 250 32').stroke();
  leaves.forEach(([x, y, r]) => {
    doc.save().translate(x, y).rotate(r).path(LEAF).stroke().restore();
  });
  // stems + olives
  doc.moveTo(195, 12).lineTo(197, 20).stroke();
  doc.moveTo(208, 13).lineTo(206, 21).stroke();
  doc.save().ellipse(195, 11, 3.4, 4.2).fill(colOlive).restore();
  doc.save().ellipse(208, 12, 3.4, 4.2).fill(colOlive).restore();
  doc.restore();
}

function kicker(txt, x, y, color = C.teal) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(color)
     .text(txt.toUpperCase(), x, y, { characterSpacing: 2.2 });
}
function h1(txt, x, y, size = 27, color = C.ink) {
  doc.font('Times-Bold').fontSize(size).fillColor(color).text(txt, x, y, { width: CW });
  return doc.y;
}
function sectionHeader(kick, title) {
  kicker(kick, M, 58);
  h1(title, M, 72);
  doc.save().moveTo(M, 108).lineTo(M + 42, 108).lineWidth(3).strokeColor(C.gold).stroke().restore();
}

function para(str, x, y, w, opt = {}) {
  const { font = 'Helvetica', size = 10.5, color = C.ink2, lineGap = 3.2, align = 'left' } = opt;
  doc.font(font).fontSize(size).fillColor(color).text(str, x, y, { width: w, align, lineGap });
  return doc.y;
}
function bullet(str, x, y, w, opt = {}) {
  const size = opt.size || 10;
  doc.save().circle(x + 2.4, y + size / 2 + 0.5, 1.7).fill(opt.dot || C.gold).restore();
  doc.font(opt.font || 'Helvetica').fontSize(size).fillColor(opt.color || C.ink2)
     .text(str, x + 12, y, { width: w - 12, lineGap: 2.6 });
  return doc.y + 5;
}
function callout(x, y, w, label, body, accent = C.teal, bg = C.tint) {
  doc.font('Helvetica').fontSize(9.5);
  const bodyH = doc.heightOfString(body, { width: w - 26, lineGap: 2.6 });
  const h = bodyH + 30;
  rr(x, y, w, h, 9).fill(bg);
  rr(x, y, 3.5, h, 2).fill(accent);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(accent)
     .text(label.toUpperCase(), x + 14, y + 9, { characterSpacing: 1.6 });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.ink2)
     .text(body, x + 14, y + 21, { width: w - 26, lineGap: 2.6 });
  return y + h;
}
function tbox(str, x, y, w, h, opt = {}) {
  const { font = 'Helvetica', size = 9, color = C.ink, align = 'left' } = opt;
  doc.font(font).fontSize(size).fillColor(color);
  const ty = y + (h - size) / 2 - 0.5;
  doc.text(str, x, ty, { width: w, align, lineBreak: false });
}
function footer(n) {
  doc.save();
  doc.moveTo(M, PAGE.h - 40).lineTo(PAGE.w - M, PAGE.h - 40).lineWidth(0.6).strokeColor(C.line).stroke();
  doc.font('Helvetica').fontSize(7.5).fillColor(C.sub);
  doc.text('Aux Terrasses de Troinex — Tableau de bord des réservations', M, PAGE.h - 34, { lineBreak: false });
  doc.text('t2t.master.corsica', PAGE.w - M - 160, PAGE.h - 34, { width: 160, align: 'right', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.sub)
     .text(String(n), PAGE.w / 2 - 10, PAGE.h - 34, { width: 20, align: 'center', lineBreak: false });
  doc.restore();
}

// ===== phone frame =====
function phone(x, y, w, h, draw) {
  doc.save();
  rr(x, y, w, h, 24).fill('#26251f');
  const pad = 6, sx = x + pad, sy = y + pad, sw = w - pad * 2, sh = h - pad * 2;
  rr(sx, sy, sw, sh, 18).fill(C.cream);
  // notch
  rr(x + w / 2 - 22, y + 3, 44, 7, 3.5).fill('#26251f');
  doc.save();
  rr(sx, sy, sw, sh, 18).clip();
  doc.translate(sx, sy);
  draw(sw, sh);
  doc.restore();
  doc.restore();
}

// ===== mockup building blocks (relative to screen 0,0) =====
function mBanner(w, label = 'D') {
  doc.rect(0, 0, w, 32).fill(C.tile);
  doc.moveTo(0, 32).lineTo(w, 32).lineWidth(0.7).strokeColor(C.border).stroke();
  doc.save().circle(17, 16, 9).fill(C.teal).restore();
  tbox(label, 8, 7, 18, 18, { font: 'Helvetica-Bold', size: 8, color: '#fff', align: 'center' });
  // wordmark
  doc.font('Times-Bold').fontSize(7).fillColor(C.ink)
     .text('Aux Terrasses de Troinex', 30, 12, { width: w - 60, align: 'center', lineBreak: false });
  // bell
  doc.save().translate(w - 18, 10).lineWidth(1.2).strokeColor(C.olive);
  doc.path('M0 8 Q0 1 5 1 Q10 1 10 8 L11 10 L-1 10 Z').stroke();
  doc.circle(5, 12, 1.3).fill(C.olive);
  doc.restore();
}
function pill(x, y, w, h, txt, sel, base = C.teal) {
  if (sel) { rr(x, y, w, h, h / 2).fill(base); tbox(txt, x, y, w, h, { font: 'Helvetica-Bold', size: 7.5, color: '#fff', align: 'center' }); }
  else { rr(x, y, w, h, h / 2).fill('#fff'); rr(x, y, w, h, h / 2).lineWidth(0.8).stroke(C.border); tbox(txt, x, y, w, h, { size: 7.5, color: C.sub, align: 'center' }); }
}
function bwBadge(x, y, txt) { // couverts / table — noir & blanc
  const w = 16, h = 15;
  rr(x, y, w, h, 4).fill('#fff'); rr(x, y, w, h, 4).lineWidth(1).stroke(C.ink);
  tbox(txt, x, y, w, h, { font: 'Helvetica-Bold', size: 8, color: C.ink, align: 'center' });
}
function stepper(x, y, w, h, txt) {
  rr(x, y, w, h, 7).fill('#fff'); rr(x, y, w, h, 7).lineWidth(0.8).stroke(C.border);
  // minus
  doc.save().lineWidth(1.4).strokeColor(C.teal).moveTo(x + 8, y + h / 2).lineTo(x + 16, y + h / 2).stroke().restore();
  // plus
  const px = x + w - 12;
  doc.save().lineWidth(1.4).strokeColor(C.teal).moveTo(px - 4, y + h / 2).lineTo(px + 4, y + h / 2).moveTo(px, y + h / 2 - 4).lineTo(px, y + h / 2 + 4).stroke().restore();
  tbox(txt, x + 18, y, w - 36, h, { font: 'Helvetica-Bold', size: 8.5, color: C.ink, align: 'center' });
}

// ---- AGENDA (Liste) ----
function drawAgenda(w) {
  mBanner(w);
  let y = 40;
  // search
  rr(10, y, w - 20, 17, 8).fill('#fff'); rr(10, y, w - 20, 17, 8).lineWidth(0.8).stroke(C.border);
  doc.save().circle(20, y + 8.5, 3).lineWidth(1).stroke(C.sub); doc.moveTo(22, y + 10.5).lineTo(24, y + 12.5).stroke().restore();
  tbox('Rechercher un nom…', 28, y, w - 40, 17, { size: 7.5, color: C.sub });
  y += 24;
  // date stepper + service
  stepper(10, y, 96, 18, 'Ven. 11 juil.');
  pill(w - 74, y, 30, 18, 'Midi', true, C.teal);
  pill(w - 42, y, 32, 18, 'Soir', false);
  y += 25;
  // recap
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.teal).text('MIDI', 10, y, { characterSpacing: 1 });
  doc.font('Helvetica').fontSize(7.5).fillColor(C.sub).text('4 réservations · 18 couverts', 34, y, { lineBreak: false });
  y += 16;
  // section label
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.ink).text('VENDREDI 11 JUILLET — MIDI', 10, y, { characterSpacing: 0.8 });
  y += 13;
  const rows = [
    ['12:00', 'Mme Dupont', '4', '12', C.gold],
    ['12:30', 'M. Bernard', '2', '07', C.teal],
    ['13:00', 'Ent. Roca', '8', '03', C.brique],
    ['13:15', 'M. Léon', '2', '09', C.teal],
    ['13:30', 'Famille Sart', '5', '15', C.gold],
  ];
  rows.forEach(([t, n, c, tb, strip]) => {
    const rh = 30;
    // colored strip peeking on the right (behind tile)
    rr(w - 14, y + 3, 8, rh - 6, 3).fill(strip);
    rr(10, y, w - 26, rh, 8).fill(C.tile);
    rr(10, y, w - 26, rh, 8).lineWidth(0.7).stroke(C.border);
    tbox(t, 18, y, 34, rh, { font: 'Helvetica-Bold', size: 9, color: C.ink });
    tbox(n, 52, y, 70, rh, { size: 8.5, color: C.ink2 });
    bwBadge(w - 62, y + 7.5, c);
    bwBadge(w - 43, y + 7.5, tb);
    y += rh + 6;
  });
}

// ---- FORMULAIRE ----
function drawForm(w) {
  // header
  doc.rect(0, 0, w, 30).fill(C.teal);
  tbox('Nouvelle réservation', 12, 0, w - 40, 30, { font: 'Times-Bold', size: 11, color: '#fff' });
  doc.save().lineWidth(1.4).strokeColor('#fff').moveTo(w - 20, 11).lineTo(w - 12, 19).moveTo(w - 12, 11).lineTo(w - 20, 19).stroke().restore();
  let y = 40;
  const lab = (t, yy) => doc.font('Helvetica-Bold').fontSize(7).fillColor(C.sub).text(t.toUpperCase(), 12, yy, { characterSpacing: 0.8 });
  // civilité
  lab('Civilité', y); y += 11;
  pill(12, y, 34, 17, 'M.', false); pill(50, y, 42, 17, 'Mme', true); pill(96, y, 66, 17, 'Entreprise', false);
  y += 26;
  // nom + autocomplete
  lab('Nom', y); y += 11;
  rr(12, y, w - 24, 18, 6).fill('#fff'); rr(12, y, w - 24, 18, 6).lineWidth(0.8).stroke(C.teal);
  tbox('Dup', 18, y, w - 40, 18, { size: 8.5, color: C.ink });
  y += 18;
  // dropdown
  rr(12, y + 2, w - 24, 34, 6).fill('#fff'); rr(12, y + 2, w - 24, 34, 6).lineWidth(0.8).stroke(C.border);
  tbox('Mme Dupont', 18, y + 3, w - 90, 16, { font: 'Helvetica-Bold', size: 8, color: C.ink });
  tbox('06 12 34 56 78', 18, y + 3, w - 30, 16, { size: 7, color: C.sub, align: 'right' });
  doc.moveTo(18, y + 19).lineTo(w - 18, y + 19).lineWidth(0.5).stroke(C.border);
  tbox('M. Dupré', 18, y + 19, w - 90, 16, { font: 'Helvetica-Bold', size: 8, color: C.ink });
  tbox('06 98 76 54 32', 18, y + 19, w - 30, 16, { size: 7, color: C.sub, align: 'right' });
  y += 46;
  // couverts
  lab('Couverts', y); y += 11;
  stepper(12, y, 90, 20, '4'); y += 28;
  // date
  lab('Date', y); y += 11;
  stepper(12, y, w - 24, 20, 'Sam. 12 juil.'); y += 28;
  // heure
  lab('Heure', y); y += 11;
  pill(12, y, 40, 18, 'Midi', false); pill(55, y, 40, 18, 'Soir', true, C.gold);
  stepper(99, y, w - 111, 18, '20:00'); y += 27;
  // remise
  lab('Remise', y); y += 11;
  pill(12, y, 42, 17, 'Plein', false);
  rr(58, y, 48, 17, 8.5).fill('#f2e6c9'); tbox('–30 %', 58, y, 48, 17, { font: 'Helvetica-Bold', size: 7.5, color: C.ocre, align: 'center' });
  pill(110, y, 48, 17, '–50 %', false);
  y += 26;
  // save
  rr(12, y, w - 24, 22, 8).fill(C.teal);
  tbox('Enregistrer la réservation', 12, y, w - 24, 22, { font: 'Helvetica-Bold', size: 8.5, color: '#fff', align: 'center' });
}

// ---- PLAN ----
function drawPlan(w) {
  mBanner(w);
  let y = 40;
  stepper(10, y, w - 92, 18, 'Ven. 11 juil.');
  pill(w - 78, y, 30, 18, 'Midi', true);
  pill(w - 46, y, 36, 18, 'Soir', false);
  y += 26;
  const colW = (w - 30) / 2;
  const zone = (zx, title, tiles, accent) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(accent).text(title, zx, y, { width: colW, align: 'center', characterSpacing: 0.5 });
    let ty = y + 13;
    tiles.forEach(([n, c, tb, z]) => {
      const th = 40;
      rr(zx + colW - 7, ty + 3, 6, th - 6, 3).fill(accent);
      rr(zx, ty, colW - 9, th, 7).fill(C.tile); rr(zx, ty, colW - 9, th, 7).lineWidth(0.7).stroke(C.border);
      tbox(n, zx + 7, ty + 4, colW - 20, 14, { font: 'Helvetica-Bold', size: 8, color: C.ink });
      bwBadge(zx + 7, ty + 19, c);
      if (z) {
        const cw2 = 24;
        rr(zx + colW - 9 - cw2 - 4, ty + 20, cw2, 14, 7).fill(C.teal);
        tbox(z, zx + colW - 9 - cw2 - 4, ty + 20, cw2, 14, { font: 'Helvetica-Bold', size: 7.5, color: '#fff', align: 'center' });
      } else if (tb) {
        bwBadge(zx + colW - 34, ty + 19, tb);
      }
      ty += th + 6;
    });
  };
  zone(10, '–30 %', [['Mme Dupont', '4', '12'], ['Famille Sart', '5', '', 'T2']], C.gold);
  zone(20 + colW, 'PLEIN TARIF', [['M. Bernard', '2', '07'], ['M. Léon', '2', '', 'S1']], C.teal);
}

// Grille de zones 4×2 (T1–T4 / S1–S4) — relative à l'origine courante.
function zoneGrid(x, y, cellW, cellH, gap, active) {
  const labels = ['T1', 'T2', 'T3', 'T4', 'S1', 'S2', 'S3', 'S4'];
  labels.forEach((z, i) => {
    const zx = x + (i % 4) * (cellW + gap);
    const zy = y + Math.floor(i / 4) * (cellH + gap);
    const sel = z === active;
    if (sel) {
      rr(zx, zy, cellW, cellH, 5).fill(C.teal);
      tbox(z, zx, zy, cellW, cellH, { font: 'Helvetica-Bold', size: 8, color: '#fff', align: 'center' });
    } else {
      rr(zx, zy, cellW, cellH, 5).fill('#fff');
      rr(zx, zy, cellW, cellH, 5).lineWidth(0.8).stroke(C.border);
      tbox(z, zx, zy, cellW, cellH, { font: 'Helvetica-Bold', size: 8, color: C.sub, align: 'center' });
    }
  });
}

// ---- MODAL D'INSTALLATION (clic « Installé » sur Arrivée) ----
function drawInstallModal(w) {
  doc.rect(0, 0, w, 400).fill('#e9e3d5');
  const mx = 8, mw = w - 16, my = 20;
  rr(mx, my, mw, 344, 14).fill('#fff'); rr(mx, my, mw, 344, 14).lineWidth(1).stroke(C.border);
  let y = my + 16;
  doc.font('Times-Bold').fontSize(13).fillColor(C.ink).text('Mme Dupont', mx + 14, y, { lineBreak: false });
  y += 17;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.sub).text('20:00 · installation', mx + 14, y, { lineBreak: false });
  y += 17;
  const lab = (t, yy) => doc.font('Helvetica-Bold').fontSize(7).fillColor(C.sub).text(t.toUpperCase(), mx + 14, yy, { characterSpacing: 0.6, lineBreak: false });
  // couverts
  lab('Couverts', y); y += 11;
  rr(mx + 14, y, mw - 28, 18, 6).fill('#fff'); rr(mx + 14, y, mw - 28, 18, 6).lineWidth(0.8).stroke(C.border);
  tbox('4', mx + 14, y, mw - 28, 18, { font: 'Helvetica-Bold', size: 9, color: C.ink, align: 'center' });
  y += 25;
  // remise
  lab('Remise', y); y += 11;
  pill(mx + 14, y, 42, 16, 'Plein', false);
  rr(mx + 60, y, 46, 16, 8).fill('#f2e6c9'); tbox('–30 %', mx + 60, y, 46, 16, { font: 'Helvetica-Bold', size: 7, color: C.ocre, align: 'center' });
  pill(mx + 110, y, 44, 16, '–50 %', false);
  y += 24;
  // n° table (mis en avant)
  lab('N° table', y); y += 11;
  rr(mx + 14, y, mw - 28, 26, 7).fill('#fff'); rr(mx + 14, y, mw - 28, 26, 7).lineWidth(1.2).stroke(C.teal);
  tbox('12', mx + 14, y, mw - 28, 26, { font: 'Helvetica-Bold', size: 14, color: C.ink, align: 'center' });
  y += 34;
  // zone (exclusive du numéro)
  lab('Zone', y); y += 11;
  const cellW = (mw - 28 - 3 * 6) / 4;
  zoneGrid(mx + 14, y, cellW, 17, 6, null);
  y += 17 * 2 + 6 + 12;
  // valider
  rr(mx + 14, y, mw - 28, 24, 8).fill(C.teal);
  tbox('Valider l’installation', mx + 14, y, mw - 28, 24, { font: 'Helvetica-Bold', size: 8.5, color: '#fff', align: 'center' });
}

// ---- STATISTIQUES ----
function drawStats(w) {
  mBanner(w);
  let y = 40;
  doc.font('Times-Bold').fontSize(11).fillColor(C.ink).text('Statistiques', 10, y, { lineBreak: false });
  y += 17;
  const kpis = [
    ['Couverts auj.', '86', 'Midi 32 · Soir 54'],
    ['Résa du jour', '9', 'tables attendues'],
    ['7 prochains j.', '612', '~87 / jour'],
    ['À valider', '2', 'en attente'],
  ];
  const gw = (w - 30) / 2, gh = 44;
  kpis.forEach((kk, i) => {
    const kx = 10 + (i % 2) * (gw + 10);
    const ky = y + Math.floor(i / 2) * (gh + 8);
    const alert = kk[0] === 'À valider';
    rr(kx, ky, gw, gh, 8).fill(alert ? '#fbeee9' : C.tile);
    rr(kx, ky, gw, gh, 8).lineWidth(0.7).stroke(alert ? C.brique : C.border);
    doc.font('Helvetica-Bold').fontSize(6).fillColor(C.sub).text(kk[0].toUpperCase(), kx + 8, ky + 6, { characterSpacing: 0.4, lineBreak: false });
    doc.font('Times-Bold').fontSize(17).fillColor(alert ? C.brique : C.ink).text(kk[1], kx + 8, ky + 15, { lineBreak: false });
    doc.font('Helvetica').fontSize(6).fillColor(C.sub).text(kk[2], kx + 8, ky + 35, { width: gw - 14, lineBreak: false });
  });
  y += gh * 2 + 8 + 12;
  // jauge remplissage
  rr(10, y, w - 20, 40, 8).fill('#fff'); rr(10, y, w - 20, 40, 8).lineWidth(0.7).stroke(C.border);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.ink).text('Remplissage du jour', 18, y + 8, { lineBreak: false });
  doc.font('Helvetica').fontSize(6.5).fillColor(C.sub).text('86 / 145', 18, y + 8, { width: w - 36, align: 'right', lineBreak: false });
  rr(18, y + 22, w - 36, 8, 4).fill('#ece5d6');
  rr(18, y + 22, (w - 36) * 0.59, 8, 4).fill(C.teal);
  y += 50;
  // graphe couverts / jour
  rr(10, y, w - 20, 92, 8).fill('#fff'); rr(10, y, w - 20, 92, 8).lineWidth(0.7).stroke(C.border);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.ink).text('Couverts par jour', 18, y + 8, { lineBreak: false });
  doc.font('Helvetica').fontSize(6).fillColor(C.teal).text('■ Midi', w - 74, y + 9, { lineBreak: false });
  doc.font('Helvetica').fontSize(6).fillColor(C.gold).text('■ Soir', w - 42, y + 9, { lineBreak: false });
  const bx0 = 18, by0 = y + 26, bH = 48, n = 10;
  const bw = (w - 36) / n;
  const vals = [0.9, 0.6, 0.78, 0.5, 1.0, 0.7, 0.85, 0.55, 0.42, 0.66];
  vals.forEach((v, i) => {
    const bx = bx0 + i * bw;
    const hh = bH * v;
    const midi = hh * 0.4, soir = hh - midi;
    rr(bx + 1, by0 + bH - hh, bw - 3, soir, 1.5).fill(C.gold);
    rr(bx + 1, by0 + bH - midi, bw - 3, midi, 1.5).fill(C.teal);
  });
  doc.font('Helvetica-Bold').fontSize(5.5).fillColor(C.teal).text('auj.', bx0, by0 + bH + 3, { lineBreak: false });
}

// ---- PARTAGE SAFARI (« Sur l'écran d'accueil ») ----
function drawShareSheet(w) {
  doc.rect(0, 0, w, 400).fill(C.cream);
  mBanner(w);
  const py = 132, ph = 400 - py;
  rr(0, py, w, ph, 16).fill('#f5f2ea');
  rr(w / 2 - 16, py + 8, 32, 4, 2).fill('#cfc7b5');
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.ink).text('Aux Terrasses de Troinex', 14, py + 20, { lineBreak: false });
  doc.font('Helvetica').fontSize(6.5).fillColor(C.sub).text('t2t.master.corsica', 14, py + 32, { lineBreak: false });
  doc.moveTo(10, py + 48).lineTo(w - 10, py + 48).lineWidth(0.6).stroke(C.border);
  const row = (ry, label, icon, hi) => {
    if (hi) rr(8, ry - 3, w - 16, 24, 7).fill('#eaf1ec');
    rr(14, ry, 18, 18, 4).fill('#fff'); rr(14, ry, 18, 18, 4).lineWidth(0.8).stroke(hi ? C.teal : C.border);
    if (icon === 'plus') {
      doc.save().lineWidth(1.5).strokeColor(hi ? C.teal : C.ink).lineCap('round')
         .moveTo(19, ry + 9).lineTo(27, ry + 9).moveTo(23, ry + 5).lineTo(23, ry + 13).stroke().restore();
    } else if (icon === 'star') {
      doc.save().lineWidth(1).strokeColor(C.sub).circle(23, ry + 9, 5).stroke().restore();
    } else {
      doc.save().lineWidth(1).strokeColor(C.sub).rect(19, ry + 5, 8, 9).stroke().restore();
    }
    doc.font(hi ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(C.ink).text(label, 40, ry + 4, { lineBreak: false });
  };
  let ry = py + 60;
  row(ry, 'Copier', 'copy', false); ry += 30;
  row(ry, 'Ajouter aux favoris', 'star', false); ry += 30;
  row(ry, 'Sur l’écran d’accueil', 'plus', true);
}

// ---- ARRIVÉE ----
function drawArrivee(w) {
  mBanner(w, 'S');
  let y = 40;
  pill(10, y, (w - 24) / 2, 20, 'Midi', true);
  pill(14 + (w - 24) / 2, y, (w - 24) / 2, 20, 'Soir', false);
  y += 28;
  const tile = (n, tb, done) => {
    const th = 46;
    if (done) {
      rr(10, y, w - 20, th, 9).fill('#efece4'); rr(10, y, w - 20, th, 9).lineWidth(0.7).stroke(C.border);
      tbox(n, 20, y, w - 60, th, { font: 'Helvetica-Bold', size: 10, color: '#a49c8c' });
      doc.save().lineWidth(1.6).strokeColor(C.olive).moveTo(w - 34, y + th / 2).lineTo(w - 28, y + th / 2 + 5).lineTo(w - 20, y + th / 2 - 6).stroke().restore();
      doc.font('Helvetica').fontSize(7).fillColor('#a49c8c').text('Installé', w - 66, y + th - 13, { lineBreak: false });
    } else {
      rr(10, y, w - 20, th, 9).fill(C.tile); rr(10, y, w - 20, th, 9).lineWidth(0.7).stroke(C.border);
      doc.font('Times-Bold').fontSize(12).fillColor(C.ink).text(n, 20, y + 8, { lineBreak: false });
      doc.font('Helvetica').fontSize(7.5).fillColor(C.sub).text('Table ' + tb, 20, y + 26, { lineBreak: false });
      rr(w - 82, y + 12, 64, 22, 11).fill(C.olive);
      tbox('Installé', w - 82, y + 12, 64, 22, { font: 'Helvetica-Bold', size: 8, color: '#fff', align: 'center' });
    }
    y += th + 8;
  };
  tile('M. Bernard', '07', false);
  tile('Mme Dupont', '12', false);
  tile('M. Léon', '09', true);
}

// small "screen chip" used as inline illustration in text columns
function screenChip(x, y, w, h, drawFn) { phone(x, y, w, h, drawFn); }

// =========================================================
// PAGE 1 — COUVERTURE
// =========================================================
fillPage(C.cream);
// subtle top & bottom bands
doc.save().rect(0, 0, PAGE.w, 8).fill(C.teal).restore();
doc.save().rect(0, PAGE.h - 8, PAGE.w, 8).fill(C.gold).restore();

drawBranch(148, 150, 3.0, C.branch, C.oliveFill, 1.6);
doc.font('Times-Bold').fontSize(38).fillColor(C.ink)
   .text('AUX TERRASSES', 0, 250, { width: PAGE.w, align: 'center', characterSpacing: 3 });
doc.text('DE TROINEX', 0, 292, { width: PAGE.w, align: 'center', characterSpacing: 3 });
doc.font('Helvetica').fontSize(11).fillColor(C.sub)
   .text('R E S T A U R A N T', 0, 340, { width: PAGE.w, align: 'center', characterSpacing: 6 });

doc.save().moveTo(PAGE.w / 2 - 40, 372).lineTo(PAGE.w / 2 + 40, 372).lineWidth(2).strokeColor(C.gold).stroke().restore();

doc.font('Times-Bold').fontSize(21).fillColor(C.teal)
   .text('Tableau de bord des réservations', 0, 392, { width: PAGE.w, align: 'center' });
doc.font('Helvetica').fontSize(12.5).fillColor(C.ink2)
   .text('Le logiciel qui orchestre votre salle,\nde la première réservation à la dernière assiette.',
      0, 424, { width: PAGE.w, align: 'center', lineGap: 4 });

// hero phone
phone(PAGE.w / 2 - 95, 486, 190, 270, drawAgenda);

doc.font('Helvetica-Bold').fontSize(10).fillColor(C.sub)
   .text('MANUEL D’UTILISATION  &  PRÉSENTATION', 0, PAGE.h - 66, { width: PAGE.w, align: 'center', characterSpacing: 1.5 });
doc.font('Helvetica').fontSize(9).fillColor(C.sub)
   .text('t2t.master.corsica', 0, PAGE.h - 50, { width: PAGE.w, align: 'center' });

// =========================================================
// PAGE 2 — EN UN COUP D'ŒIL (pitch + bénéfices)
// =========================================================
doc.addPage();
sectionHeader('Présentation', 'Le logiciel en un coup d’œil');

let y = 124;
y = para(
  'Aux Terrasses de Troinex, chaque réservation compte. Ce tableau de bord réunit toute la vie de votre salle dans une seule application, pensée d’abord pour le téléphone : votre équipe prend, valide, place et accueille les clients en quelques gestes — sans papier, sans double-saisie, et en temps réel sur tous les appareils.',
  M, y, CW, { size: 11.5, lineGap: 4 });

y += 16;
// 4 benefit cards (2x2)
const cards = [
  ['100 % mobile', 'Conçu pour le téléphone d’abord. Utilisable debout en salle, une main sur le carnet — rapide, lisible, sans formation.', C.teal],
  ['Temps réel', 'Une réservation saisie en cuisine s’affiche à l’instant à l’accueil et sur le mobile du directeur. Tout le monde voit la même salle.', C.gold],
  ['Zéro double-saisie', 'Le fichier clients se remplit tout seul. Un habitué ? Son nom complète le formulaire automatiquement — téléphone compris.', C.olive],
  ['Vous êtes prévenu', 'Notification push dès qu’une réservation attend votre validation — même l’application fermée, même le téléphone en poche.', C.brique],
];
const cw = (CW - 18) / 2, ch = 96;
cards.forEach((c, i) => {
  const cx = M + (i % 2) * (cw + 18);
  const cy = y + Math.floor(i / 2) * (ch + 16);
  rr(cx, cy, cw, ch, 12).fill(C.paper);
  rr(cx, cy, cw, ch, 12).lineWidth(1).stroke(C.border);
  rr(cx, cy, cw, 5, 2).fill(c[2]);
  doc.save().circle(cx + 22, cy + 32, 11).fill(c[2]).restore();
  checkMark(cx + 22, cy + 32, 5, '#fff', 1.8);
  doc.font('Times-Bold').fontSize(13.5).fillColor(C.ink).text(c[0], cx + 40, cy + 22, { width: cw - 52, lineBreak: false });
  doc.font('Helvetica').fontSize(9.3).fillColor(C.ink2).text(c[2 - 2] ? c[1] : c[1], cx + 18, cy + 46, { width: cw - 34, lineGap: 2.6 });
});
y += ch * 2 + 16 + 22;

// bandeau chiffres
rr(M, y, CW, 62, 12).fill(C.teal);
const stats = [['7', 'écrans métier'], ['2', 'profils : directeur & staff'], ['1', 'appli, tous vos appareils'], ['0', 'papier, 0 double-saisie']];
const sw = CW / stats.length;
stats.forEach((s, i) => {
  const sx = M + i * sw;
  doc.font('Times-Bold').fontSize(24).fillColor('#fff').text(s[0], sx, y + 12, { width: sw, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(8.5).fillColor('#dfeae5').text(s[1], sx + 8, y + 42, { width: sw - 16, align: 'center', lineBreak: false });
  if (i > 0) doc.save().moveTo(sx, y + 14).lineTo(sx, y + 48).lineWidth(0.7).strokeColor(C.tealD).stroke().restore();
});
footer(2);

// =========================================================
// PAGE 3 — PRISE EN MAIN (profils + navigation)
// =========================================================
doc.addPage();
sectionHeader('Prise en main', 'Deux profils, une navigation évidente');

y = 124;
y = para('Chacun ouvre l’application avec son identifiant personnel (e-mail + mot de passe). Selon le profil, l’application n’affiche que ce qui est utile — impossible de se perdre.', M, y, CW, { size: 11, lineGap: 3.6 });
y += 14;

const roleCard = (x, w2, title, color, lines) => {
  const h = 150;
  rr(x, y, w2, h, 12).fill(C.paper); rr(x, y, w2, h, 12).lineWidth(1).stroke(C.border);
  rr(x, y, w2, 34, 12).fill(color);
  doc.rect(x, y + 20, w2, 14).fill(color);
  doc.font('Times-Bold').fontSize(14).fillColor('#fff').text(title, x + 16, y + 9, { lineBreak: false });
  let ly = y + 46;
  lines.forEach((l) => { ly = bullet(l, x + 14, ly, w2 - 24, { size: 9.3, dot: color }); });
};
const half = (CW - 18) / 2;
roleCard(M, half, 'Directeur', C.teal, [
  'Accès complet : Liste, Plan, Arrivée, Clients, À valider.',
  'Valide ou refuse les réservations proposées par le staff.',
  'Applique remises, tables et zones de salle.',
  'Statistiques (via son badge) et notifications push.',
]);
roleCard(M + half + 18, half, 'Staff / Salle', C.olive, [
  'Vue « Arrivée » simplifiée, centrée sur le service.',
  'Pointe les clients présents d’un seul geste.',
  'Peut proposer une réservation…',
  '…soumise à la validation du directeur.',
]);
y += 150 + 22;

kicker('La barre de navigation', M, y, C.gold); y += 16;
y = para('Sur téléphone, tout est au pouce : le bouton + à gauche pour créer, les écrans au centre, et « Valider » à droite avec une pastille rouge qui compte les réservations en attente. On glisse aussi le doigt pour passer d’un écran à l’autre (effet cube 3D). Le badge rond en haut à gauche ouvre les Statistiques et la déconnexion. Sur ordinateur, la même navigation passe dans une colonne latérale.', M, y, CW, { size: 10.5, lineGap: 3.4 });
y += 12;

// nav bar illustration
const nb = ['Liste', 'Plan', 'Arrivée', 'Clients', 'Valider'];
const nbW = CW, nbH = 46, bx = M;
rr(bx, y, nbW, nbH, 12).fill(C.paper); rr(bx, y, nbW, nbH, 12).lineWidth(1).stroke(C.border);
// + fab
doc.save().circle(bx + 30, y + nbH / 2, 15).fill(C.teal).restore();
doc.save().lineWidth(2).strokeColor('#fff').moveTo(bx + 24, y + nbH / 2).lineTo(bx + 36, y + nbH / 2).moveTo(bx + 30, y + nbH / 2 - 6).lineTo(bx + 30, y + nbH / 2 + 6).stroke().restore();
const seg = (nbW - 70) / nb.length;
nb.forEach((n, i) => {
  const nx = bx + 60 + i * seg;
  const active = i === 0;
  doc.font(active ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(active ? C.teal : C.sub)
     .text(n, nx, y + 17, { width: seg, align: 'center', lineBreak: false });
  if (n === 'Valider') { doc.save().circle(nx + seg / 2 + 20, y + 15, 6.5).fill(C.brique).restore(); doc.font('Helvetica-Bold').fontSize(7).fillColor('#fff').text('2', nx + seg / 2 + 16, y + 12, { width: 9, align: 'center', lineBreak: false }); }
});
footer(3);

// =========================================================
// Feature page template
// =========================================================
function featurePage(kick, title, lead, how, exLabel, exBody, plus, drawFn, pageNo, exAccent = C.teal) {
  doc.addPage();
  sectionHeader(kick, title);
  const colW = 262;
  let yy = 124;
  yy = para(lead, M, yy, colW, { size: 11, lineGap: 3.6, color: C.ink2 });
  yy += 12;
  kicker('Comment ça marche', M, yy, C.gold); yy += 15;
  how.forEach((l) => { yy = bullet(l, M, yy, colW, { size: 9.6 }); });
  yy += 6;
  yy = callout(M, yy, colW, exLabel, exBody, exAccent, C.tintGold);
  yy += 14;
  // "le plus"
  rr(M, yy, colW, 46, 10).fill(C.teal);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#bfe0d6').text('LE PLUS QUI CHANGE TOUT', M + 14, yy + 9, { characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff').text(plus, M + 14, yy + 22, { width: colW - 28, lineGap: 2 });
  // phone on the right
  phone(M + colW + 26, 132, 190, 380, drawFn);
  footer(pageNo);
}

// PAGE 4 — Formulaire
featurePage(
  'Écran · Nouvelle réservation',
  'Créer une réservation en 10 secondes',
  'Un formulaire unique, le même pour créer et pour modifier. Tout tient sur un écran de téléphone, dans l’ordre logique du geste.',
  [
    'Civilité, nom, prénom — le nom se complète tout seul si le client est déjà venu.',
    'Couverts, date et heure réglés au « – / + », sans clavier.',
    'Créneau Midi ou Soir d’un tap ; le service se déduit de l’heure.',
    'Remise (Plein, –30 %, –50 %) et notes libres.',
  ],
  'Exemple concret',
  'Mme Dupont réserve pour 4 samedi soir, remise –30 %. Vous tapez « Dup »… l’application propose « Mme Dupont » et remplit son téléphone. Il ne reste qu’à choisir 4 couverts, Soir, –30 %. C’est envoyé.',
  'L’auto-complétion supprime la saisie des habitués et évite les fautes de téléphone.',
  drawForm, 4, C.gold);

// PAGE 5 — Liste / agenda
featurePage(
  'Écran · Liste',
  'L’agenda complet, toujours à jour',
  'La Liste, c’est votre carnet du jour, en continu. Les réservations sont groupées par date puis par service, avec des repères visuels immédiats.',
  [
    'Recherche par nom, saut de date au « – / + », filtre Midi / Soir.',
    'Chaque ligne : heure, nom, couverts et table en pastilles noir & blanc.',
    'Une tranche de couleur discrète à droite indique la remise.',
    'Un appui sur la ligne ouvre la fiche : on édite tout, même l’annulation.',
  ],
  'Exemple concret',
  'Un client appelle pour décaler à 13 h. Vous cherchez « Léon », ouvrez la fiche, réglez l’heure au « + », enregistrez. La modification est visible partout, aussitôt.',
  'La couleur de remise « qui dépasse » se lit d’un coup d’œil, sans surcharger l’écran.',
  drawAgenda, 5, C.teal);

// PAGE 6 — Plan de salle
featurePage(
  'Écran · Plan',
  'Placer la salle, table ou zone',
  'Le Plan répartit les réservations du service par remise. On visualise l’occupation et on place chaque table en un geste — par numéro précis ou par zone de salle.',
  [
    'Deux colonnes claires, triées par nombre de couverts décroissant.',
    'À l’ouverture d’une fiche, le numéro de table est déjà sélectionné.',
    'Sous le numéro, une grille de 8 zones : T1–T4 (terrasse) · S1–S4 (salle).',
    'Numéro OU zone, jamais les deux : choisir l’un efface l’autre.',
  ],
  'Exemple concret',
  'Une table de 2 sans emplacement fixe ? Vous ne mettez pas de numéro : un tap sur « T2 » et c’est réglé. Le vrai numéro se posera plus tard, à l’arrivée, si besoin.',
  'La zone dit OÙ, le numéro dit LAQUELLE : vous placez au feeling et affinez seulement quand c’est utile.',
  drawPlan, 6, C.gold);

// PAGE 7 — Arrivée
featurePage(
  'Écran · Arrivée',
  'Installer un client en un geste',
  'L’écran Arrivée est fait pour l’instant du service : la liste des attendus, classée par nom. Un appui sur « Installé » ouvre un récapitulatif éclair, prêt à confirmer.',
  [
    'Le récap s’ouvre : nom, couverts, remise et n° de table.',
    'Le numéro est déjà pré-rempli et sélectionné : à retaper seulement si besoin.',
    'La grille des zones (T1–T4 / S1–S4) est là aussi, sous le numéro.',
    'Un tap sur « Valider » : le client est installé et tout est enregistré.',
  ],
  'Exemple concret',
  'Mme Dupont arrive. « Installé » → le récap affiche 4 couverts, –30 %, table 12. Ce n’est pas la bonne table ? Vous tapez « 08 », validez. Installée, table changée, en base — d’un geste.',
  'Le même geste pointe l’arrivée ET corrige la table : plus besoin de repasser par le Plan.',
  drawInstallModal, 7, C.olive);

// PAGE 8 — Statistiques
featurePage(
  'Écran · Statistiques',
  'Votre salle en chiffres, en direct',
  'Un tableau de bord réservé au directeur, ouvert depuis le badge rond en haut à gauche. Tout se calcule tout seul à partir des réservations validées.',
  [
    'Tuiles clés : couverts du jour (midi / soir), réservations, 7 prochains jours, demandes à valider.',
    'Jauge de remplissage du jour, sur une capacité de référence de 145 couverts.',
    'Graphe des couverts par jour sur 14 jours, midi et soir empilés.',
    'Répartition des remises et des provenances (TheFork, Wix, directeur, staff).',
  ],
  'Exemple concret',
  'D’un coup d’œil le matin : 86 couverts prévus, dont 54 le soir, remplissage à 59 %. La semaine s’annonce à ~87 couverts/jour. Vous ajustez le personnel en conséquence.',
  'Aucune saisie : les chiffres naissent des réservations. Réservé au directeur, via son badge.',
  drawStats, 8, C.teal);

// =========================================================
// PAGE 9 — Valider · Clients · Notifications (illustration : liste Arrivée)
// =========================================================
doc.addPage();
sectionHeader('Trois atouts', 'Valider, fidéliser, être alerté');
y = 122;

const trioW = CW;
const block = (title, color, body, badge) => {
  doc.font('Times-Bold').fontSize(15).fillColor(color).text(title, M, y, { lineBreak: false });
  if (badge) { doc.save().circle(M + doc.widthOfString(title) + 16, y + 8, 8).fill(C.brique).restore(); doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff').text('2', M + doc.widthOfString(title) + 12, y + 4, { width: 9, align: 'center', lineBreak: false }); }
  y += 22;
  y = para(body, M, y, trioW, { size: 10.3, lineGap: 3.3 });
  y += 16;
};
doc.font('Times-Bold').fontSize(15);
block('À valider', C.teal,
  'Le staff peut proposer des réservations : elles arrivent ici, en attente. Le directeur valide ou refuse directement depuis la liste, sur le même modèle visuel que l’agenda. Une pastille rouge compte en permanence les demandes en attente, dans la navigation. Rien ne se perd, tout passe par un contrôle.',
  true);
block('Fichier clients', C.gold,
  'À chaque réservation, la fiche client se crée ou se met à jour toute seule (dédoublonnage par téléphone). Vous obtenez, sans effort, un vrai fichier consultable : coordonnées et historique des visites. Une base qui a de la valeur — pour rappeler un habitué, préparer un événement, ou fidéliser.');
block('Notifications push', C.olive,
  'Le directeur active les notifications d’un tap sur la cloche. Dès qu’une réservation attend une validation, le téléphone sonne — même application fermée. L’application s’installe aussi sur l’écran d’accueil (comme une vraie appli, en plein écran) : c’est une PWA, sans passer par un store.');

// mini illustration band
const iy = y + 4;
phone(M, iy, 160, 234, drawArrivee);
// callout to the right
const rx = M + 160 + 26, rw = CW - 160 - 26;
doc.font('Times-Italic').fontSize(12.5).fillColor(C.ink)
   .text('« Une réservation proposée à 11 h en cuisine, validée à 11 h 01 depuis le mobile du directeur, visible par toute la salle à 11 h 01. »',
      rx, iy + 20, { width: rw, lineGap: 4 });
doc.font('Helvetica-Bold').fontSize(9).fillColor(C.teal)
   .text('— Le temps réel, concrètement.', rx, doc.y + 8, { width: rw });
footer(9);

// =========================================================
// PAGE 10 — Ce qui simplifie la vie + Roadmap
// =========================================================
doc.addPage();
sectionHeader('En résumé', 'Ce qui vous simplifie la vie');
y = 122;

const wins = [
  ['Auto-complétion client', 'Les habitués se saisissent tout seuls. Fini le carnet et les numéros recopiés à la main.'],
  ['Un seul geste par action', 'Créer, valider, pointer une arrivée : chaque tâche courante tient en un tap.'],
  ['Temps réel partout', 'Cuisine, accueil, mobile du directeur : tout le monde voit la même salle, à la seconde.'],
  ['Zéro papier', 'Le carnet, les post-it et les doubles-saisies disparaissent. La journée est plus calme.'],
  ['Lecture instantanée', 'Remises en couleur, couverts et tables en pastilles : la salle se lit d’un coup d’œil.'],
  ['Contrôle du directeur', 'Rien ne se réserve sans validation. Les remises et les tables restent maîtrisées.'],
];
const wcw = (CW - 18) / 2;
wins.forEach((wgt, i) => {
  const wx = M + (i % 2) * (wcw + 18);
  const wy = y + Math.floor(i / 2) * 62;
  doc.save().circle(wx + 9, wy + 9, 8).fill(C.olive).restore();
  checkMark(wx + 9, wy + 9, 3.6, '#fff', 1.6);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.ink).text(wgt[0], wx + 24, wy + 1, { width: wcw - 26, lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.ink2).text(wgt[1], wx + 24, wy + 16, { width: wcw - 30, lineGap: 2.4 });
});
y += 3 * 62 + 14;

// Roadmap
kicker('Et demain', M, y, C.gold); y += 16;
h1('Bientôt, et sur demande', M, y, 18); y += 30;

const road = (title, tag, tagColor, body) => {
  const bh = 82;
  rr(M, y, CW, bh, 12).fill(C.paper); rr(M, y, CW, bh, 12).lineWidth(1).stroke(C.border);
  rr(M, y, 4, bh, 2).fill(tagColor);
  // tag pill (top-right, single line)
  doc.font('Helvetica-Bold').fontSize(7.5);
  const tw = doc.widthOfString(tag.toUpperCase()) + 22;
  rr(M + CW - tw - 14, y + 13, tw, 16, 8).fill(tagColor);
  doc.fillColor('#fff').text(tag.toUpperCase(), M + CW - tw - 14, y + 17, { width: tw, align: 'center', characterSpacing: 0.6, lineBreak: false });
  // title (single line, up to the tag)
  doc.font('Times-Bold').fontSize(13).fillColor(C.ink).text(title, M + 18, y + 13, { width: CW - tw - 46, lineBreak: false });
  // body
  doc.font('Helvetica').fontSize(9.5).fillColor(C.ink2).text(body, M + 18, y + 40, { width: CW - 36, lineGap: 2.6 });
  y += bh + 14;
};
road('Connexion aux plateformes (TheFork, Wix…)', 'En cours de développement', C.ocre,
  'Les réservations prises en ligne tomberont directement dans votre agenda, sans aucune ressaisie. Une seule liste, quelle que soit la provenance.');
road('Envoi de SMS et appel depuis l’application', 'Option disponible', C.teal,
  'Confirmez une réservation par SMS, ou appelez le client d’un geste depuis sa fiche — sans jamais quitter l’application ni chercher son numéro.');
footer(10);

// =========================================================
// PAGE 11 — Installer sur iPhone & notifications
// =========================================================
function stepBlock(x, y, w, num, title, body, color) {
  doc.save().circle(x + 10, y + 10, 10).fill(color).restore();
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff').text(String(num), x, y + 4.5, { width: 20, align: 'center', lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C.ink).text(title, x + 28, y + 1, { width: w - 28, lineBreak: false });
  const yy = para(body, x + 28, y + 15, w - 28, { size: 9, lineGap: 2.4 });
  return yy + 10;
}

doc.addPage();
sectionHeader('Mode d’emploi', 'Installer sur iPhone & recevoir les alertes');
let gy = 122;
gy = para('L’application est une « web-app » : ni store, ni téléchargement. En quelques touches, elle s’installe sur l’écran d’accueil comme une vraie appli — et le directeur peut activer les notifications push.', M, gy, CW, { size: 11, lineGap: 3.6 });
gy += 14;

const gCol = 294;
kicker('1 · Ajouter à l’écran d’accueil', M, gy, C.teal);
let sy = gy + 18;
[
  ['Ouvrez Safari', 'Sur iPhone, utilisez Safari : les autres navigateurs ne proposent pas l’installation.'],
  ['Allez sur t2t.master.corsica', 'Saisissez l’adresse, puis connectez-vous une première fois.'],
  ['Bouton Partager', 'Touchez l’icône Partager (un carré avec une flèche vers le haut), en bas de l’écran.'],
  ['« Sur l’écran d’accueil »', 'Faites défiler la liste des actions et touchez « Sur l’écran d’accueil ».'],
  ['Ajouter', 'Touchez « Ajouter » en haut à droite : l’icône se pose sur votre écran d’accueil.'],
].forEach((s, i) => { sy = stepBlock(M, sy, gCol, i + 1, s[0], s[1], C.teal); });

phone(M + gCol + 16, gy + 6, 172, 300, drawShareSheet);

let gyB = Math.max(sy, gy + 6 + 300) + 16;
kicker('2 · Activer les notifications (directeur)', M, gyB, C.olive);
const nsteps = [
  ['Installez d’abord l’app', 'Indispensable sur iPhone : les notifications ne fonctionnent que depuis l’app ajoutée à l’écran d’accueil (iOS 16.4 ou plus récent).'],
  ['Ouvrez-la par son icône', 'Lancez l’application depuis l’icône de l’écran d’accueil, puis connectez-vous en directeur.'],
  ['Touchez la cloche 🔔', 'En haut à droite du bandeau. Autorisez les notifications quand iOS le demande.'],
  ['C’est actif', 'La cloche affiche un point vert. Vous êtes alerté à chaque réservation proposée par le staff, même l’app fermée.'],
];
const bcw = (CW - 20) / 2;
nsteps.forEach((s, i) => {
  const bx = M + (i % 2) * (bcw + 20);
  const by = gyB + 18 + Math.floor(i / 2) * 66;
  stepBlock(bx, by, bcw, i + 1, s[0], s[1], C.olive);
});
const cy = gyB + 18 + 2 * 66 + 6;
callout(M, cy, CW, 'Bon à savoir',
  'Pour couper ou régler les alertes plus tard : Réglages iOS › Notifications › Aux Terrasses de Troinex. Tant que rien n’est activé, la cloche reste grise ; elle passe au vert une fois les notifications prêtes.',
  C.gold, C.tintGold);
footer(11);

// =========================================================
// PAGE 12 — Clôture
// =========================================================
doc.addPage();
fillPage(C.cream);
doc.save().rect(0, 0, PAGE.w, 8).fill(C.gold).restore();
doc.save().rect(0, PAGE.h - 8, PAGE.w, 8).fill(C.teal).restore();

drawBranch(148, 120, 2.4, C.branch, C.oliveFill, 1.6);
doc.font('Times-Bold').fontSize(26).fillColor(C.ink)
   .text('Prêt à l’emploi, dès aujourd’hui', 0, 208, { width: PAGE.w, align: 'center' });
doc.font('Helvetica').fontSize(12).fillColor(C.ink2)
   .text('Votre tableau de bord est en ligne et fonctionne sur tous vos appareils.',
      0, 244, { width: PAGE.w, align: 'center', lineGap: 4 });

// access card
const acx = M + 40, acw = CW - 80, acy = 300;
rr(acx, acy, acw, 150, 16).fill(C.paper); rr(acx, acy, acw, 150, 16).lineWidth(1).stroke(C.border);
doc.font('Helvetica-Bold').fontSize(9).fillColor(C.teal).text('ACCÈS', acx + 26, acy + 22, { characterSpacing: 2 });
doc.font('Times-Bold').fontSize(20).fillColor(C.ink).text('t2t.master.corsica', acx + 26, acy + 36, { lineBreak: false });
let ly = acy + 74;
[
  'Ouvrez l’adresse dans Safari ou Chrome, puis connectez-vous avec votre identifiant.',
  'Ajoutez l’application à l’écran d’accueil (bouton Partager, puis « Sur l’écran d’accueil ») : elle s’ouvre en plein écran, comme une vraie appli.',
  'Chaque membre de l’équipe a son propre accès, avec les droits de son profil.',
].forEach((l) => { ly = bullet(l, acx + 26, ly, acw - 52, { size: 9.6, dot: C.gold }); });

// closing line
doc.font('Times-Italic').fontSize(13).fillColor(C.teal)
   .text('De la première réservation à la dernière assiette —\ntoute votre salle, dans votre poche.',
      0, 496, { width: PAGE.w, align: 'center', lineGap: 5 });

drawBranch(148, 600, 1.6, C.branch, C.oliveFill, 1.4);
doc.font('Helvetica').fontSize(9).fillColor(C.sub)
   .text('Aux Terrasses de Troinex · Manuel d’utilisation & présentation', 0, PAGE.h - 60, { width: PAGE.w, align: 'center' });

doc.end();
console.log('PDF écrit :', OUT);
