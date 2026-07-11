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
    tiles.forEach(([n, c, tb]) => {
      const th = 40;
      rr(zx + colW - 7, ty + 3, 6, th - 6, 3).fill(accent);
      rr(zx, ty, colW - 9, th, 7).fill(C.tile); rr(zx, ty, colW - 9, th, 7).lineWidth(0.7).stroke(C.border);
      tbox(n, zx + 7, ty + 4, colW - 20, 14, { font: 'Helvetica-Bold', size: 8, color: C.ink });
      bwBadge(zx + 7, ty + 19, c);
      bwBadge(zx + colW - 34, ty + 19, tb);
      ty += th + 6;
    });
  };
  zone(10, '–30 %', [['Mme Dupont', '4', '12'], ['Famille Sart', '5', '15']], C.gold);
  zone(20 + colW, 'PLEIN TARIF', [['M. Bernard', '2', '07'], ['M. Léon', '2', '09']], C.teal);
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
const stats = [['6', 'écrans métier'], ['2', 'profils : directeur & staff'], ['1', 'appli, tous vos appareils'], ['0', 'papier, 0 double-saisie']];
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
  'Applique les remises et attribue les tables.',
  'Reçoit les notifications push.',
]);
roleCard(M + half + 18, half, 'Staff / Salle', C.olive, [
  'Vue « Arrivée » simplifiée, centrée sur le service.',
  'Pointe les clients présents d’un seul geste.',
  'Peut proposer une réservation…',
  '…soumise à la validation du directeur.',
]);
y += 150 + 22;

kicker('La barre de navigation', M, y, C.gold); y += 16;
y = para('Sur téléphone, tout est au pouce : le bouton + à gauche pour créer, les écrans au centre, et « Valider » à droite avec une pastille rouge qui compte les réservations en attente. Sur ordinateur, la même navigation passe dans une colonne latérale.', M, y, CW, { size: 10.5, lineGap: 3.4 });
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
  'Placer la salle, zone par zone',
  'Le Plan répartit les réservations du service par zone de remise. On visualise l’occupation et on attribue les tables en un geste.',
  [
    'Deux colonnes claires, triées par nombre de couverts décroissant.',
    'Chaque tuile rappelle le nom, les couverts et le numéro de table.',
    'À l’ouverture d’une fiche, le numéro de table est déjà sélectionné.',
    'Date et service se règlent en haut, au « – / + ».',
  ],
  'Exemple concret',
  'Service du soir : la grande tablée de 8 (Entreprise Roca) s’affiche en tête de colonne. Vous ouvrez, la table est pré-remplie, vous confirmez le placement. Suivant.',
  'Les plus grosses tables remontent d’elles-mêmes : vous placez le plus difficile en premier.',
  drawPlan, 6, C.gold);

// PAGE 7 — Arrivée
featurePage(
  'Écran · Arrivée',
  'Le service, sans stylo',
  'L’écran Arrivée est fait pour l’instant du service : la liste des attendus, classée par ordre alphabétique, prête à pointer.',
  [
    'Bascule Midi / Soir ; par défaut, le bon service selon l’heure.',
    'Grandes tuiles lisibles : nom et table en gros.',
    'Un bouton « Installé » pour pointer l’arrivée d’un geste.',
    'Les clients installés passent en bas, grisés — la liste reste nette.',
  ],
  'Exemple concret',
  'La famille Bernard arrive. Le staff appuie sur « Installé » : la tuile file en bas de liste, grisée. En un regard, on sait qui est là et qui reste attendu.',
  'Pensé pour le staff : aucune formation, un seul bouton pour l’essentiel.',
  drawArrivee, 7, C.olive);

// =========================================================
// PAGE 8 — Valider · Clients · Notifications
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
footer(8);

// =========================================================
// PAGE 9 — Ce qui simplifie la vie + Roadmap
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
footer(9);

// =========================================================
// PAGE 10 — Clôture
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
