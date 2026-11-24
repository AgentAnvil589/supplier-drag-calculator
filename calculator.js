/* Supplier Drag Calculator. Made by AgentAnvil (www.agentanvil.co.uk). MIT licence, see LICENSE. */
(function () {
"use strict";

/* ===CALC-START=== Pure maths. No DOM, no network. */
/* Default hourly rates: ONS, Annual Survey of Hours and Earnings (ASHE), 2026 provisional edition
   (published 22 October 2026, pay period including a date in April 2026).
   Table 2.5a "Hourly pay - Gross", all employee jobs, United Kingdom, MEDIAN, SOC 2020 groups. */
var ASHE = {
  edition: "2026 provisional",
  published: "22 October 2026",
  table: "Table 2.5a Hourly pay - Gross (occupation by two-digit SOC, ASHE Table 2), all employee jobs, United Kingdom, median",
  url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation2digitsocashetable2/2026provisional",
  bulletinUrl: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/annualsurveyofhoursandearnings/2026"
};
var ROLES = [
  { id: "dir", label: "Director or senior manager", soc: "SOC 11", socName: "Corporate managers and directors", ashe: 31.90, q: 1 },
  { id: "mgr", label: "Manager", soc: "SOC 1", socName: "Managers, directors and senior officials", ashe: 28.72, q: 2 },
  { id: "pro", label: "Professional or specialist", soc: "SOC 2", socName: "Professional occupations", ashe: 27.59, q: 3 },
  { id: "ana", label: "Analyst or associate", soc: "SOC 3", socName: "Associate professional occupations", ashe: 19.83, q: 0 },
  { id: "adm", label: "Admin or support", soc: "SOC 4", socName: "Administrative and secretarial occupations", ashe: 16.02, q: 0 },
  { id: "cus", label: "Custom role", soc: "", socName: "Your own figure", ashe: 30, q: 0, custom: true }
];

var FIELDS = [
  { g: "work", id: "suppliers", label: "Suppliers you use on projects", unit: "number", def: 12, min: 1, step: 1, hint: "Firms you regularly send work out to." },
  { g: "work", id: "projects", label: "Projects sent out each year", unit: "number", def: 60, min: 0, step: 1, hint: "All suppliers added together." },
  { g: "work", id: "value", label: "Average project value", unit: "£", def: 25000, min: 0, step: 100, hint: "What you typically pay a supplier per project." },
  { g: "work", id: "rate", label: "Loaded hourly cost of your staff", unit: "£ per hour", def: 45, min: 0, step: 1, hint: "Pay plus employer costs, per hour, for the people who manage suppliers. Roughly a yearly salary divided by 1,650 hours, plus a quarter on top." },

  { g: "calls", id: "callsPerWeek", label: "Alignment and status calls per live project", unit: "per week", def: 1, min: 0, step: 0.5, hint: "Video calls to brief, catch up or realign. Half a call a week is 0.5." },
  { g: "calls", id: "callMins", label: "Length of a call", unit: "minutes", def: 45, min: 0, step: 5, hint: "" },
  { g: "calls", id: "attendees", label: "Your people on each call", unit: "number", def: 3, min: 0, step: 1, hint: "Your side only. The supplier's time is not counted, so this stays on the cautious side." },
  { g: "calls", id: "prepMins", label: "Prep and write-up around each call", unit: "minutes in total", def: 30, min: 0, step: 5, hint: "Agendas, slides, notes and follow-up emails, all your people added together." },

  { g: "admin", id: "briefHrs", label: "Briefing the supplier", unit: "hours per project", def: 6, min: 0, step: 0.5, hint: "Writing up the job and explaining it." },
  { g: "admin", id: "chaseHrs", label: "Chasing for updates", unit: "hours per project", def: 5, min: 0, step: 0.5, hint: "Emails, messages and calls that start with 'any news?'." },
  { g: "admin", id: "checkHrs", label: "Checking what comes back", unit: "hours per project", def: 6, min: 0, step: 0.5, hint: "Reading, testing and reviewing the delivered work." },

  { g: "speed", id: "weeksActual", label: "How long a project really takes", unit: "weeks", def: 10, min: 0, step: 1, hint: "From sending it out to having it accepted." },
  { g: "speed", id: "weeksIdeal", label: "How long it ought to take", unit: "weeks", def: 6, min: 0, step: 1, hint: "If nothing was lost in hand-offs and waiting." },
  { g: "speed", id: "delayCost", label: "Cost of one project running one week late", unit: "£ per project-week", def: 250, min: 0, step: 50, hint: "Idle staff, knock-on costs, penalties, lost sales. Put 0 if you cannot put a figure on it." },

  { g: "quality", id: "reworkPct", label: "Projects that need reworking", unit: "%", def: 20, min: 0, max: 100, step: 1, hint: "Roughly how many come back wrong, incomplete or misunderstood." },
  { g: "quality", id: "reworkHrs", label: "Your staff time per rework", unit: "hours", def: 15, min: 0, step: 1, hint: "Spotting it, explaining it, re-checking it." },
  { g: "quality", id: "reworkExtraPct", label: "Extra money spent per rework", unit: "% of project value", def: 5, min: 0, max: 100, step: 1, hint: "Re-work paid for, credits given, or work thrown away." },

  { g: "assume", id: "wasteCallsPct", label: "Share of call and prep time that is avoidable", unit: "%", def: 35, min: 0, max: 100, step: 5, hint: "Calls that repeat work already done or realign something misunderstood." },
  { g: "assume", id: "wasteAdminPct", label: "Share of briefing, chasing and checking that is avoidable", unit: "%", def: 40, min: 0, max: 100, step: 5, hint: "Some checking is always needed. This is the part that is not." },
  { g: "assume", id: "agenticSharePct", label: "Share of your supplier work that could go agentic", unit: "%", def: 50, min: 0, max: 100, step: 5, hint: "Not every job suits it. Be cautious." },
  { g: "assume", id: "cutLowPct", label: "Possible cut in drag on that work: low case", unit: "%", def: 15, min: 0, max: 100, step: 5, hint: "A placeholder, not evidence. Change it." },
  { g: "assume", id: "cutHighPct", label: "Possible cut in drag on that work: high case", unit: "%", def: 40, min: 0, max: 100, step: 5, hint: "A placeholder, not evidence. Change it." },
  { g: "assume", id: "feePerJob", label: "Platform fee per job, your own placeholder", unit: "£", def: 0, min: 0, step: 1, hint: "AgentAnvil's flat fee is not set yet. Put in a figure to see it taken off." },
  { g: "assume", id: "hoursPerFte", label: "Productive hours in a person's year", unit: "hours", def: 1650, min: 1, step: 50, hint: "Used only to turn hours into 'full-time people'." },
  { g: "assume", id: "hoursPerDay", label: "Hours in a working day", unit: "hours", def: 7.5, min: 1, step: 0.5, hint: "Used only to turn hours into working days." }
];

ROLES.forEach(function (r) {
  FIELDS.push({ g: "mtg", id: "q_" + r.id, label: r.label + ": people", unit: "people", def: r.q, min: 0, step: 1, hint: "" });
  FIELDS.push({ g: "mtg", id: "r_" + r.id, label: r.label + ": pay per hour", unit: "£ per hour", def: r.ashe, min: 0, step: 0.5, hint: "" });
});
FIELDS.push(
  { g: "mtg", id: "mtgUse", label: "Price my calls from the meeting builder", unit: "switch", def: 1, min: 0, max: 1, step: 1, hidden: true },
  { g: "mtg", id: "mtgMins", label: "Length of the call", unit: "minutes", def: 60, min: 0, step: 5, hint: "" },
  { g: "mtg", id: "mtgCallsPerWeek", label: "How many of these calls a week", unit: "per week", def: 6, min: 0, step: 0.5, hint: "Across all your supplier work. A call every other week is 0.5." },
  { g: "mtg", id: "mtgWeeks", label: "Weeks a year these calls run", unit: "weeks", def: 46, min: 1, max: 52, step: 1, hint: "46 allows for holidays and bank holidays." },
  { g: "mtg", id: "mtgPrepMins", label: "Prep and write-up around each call", unit: "minutes in total", def: 30, min: 0, step: 5, hint: "Agenda, slides, notes and follow-up emails, all added together." },
  { g: "mtg", id: "mtgOnCostPct", label: "On-cost uplift on pay", unit: "%", def: 30, min: 0, max: 100, step: 5, hint: "" }
);

var PRESETS = {
  small: { q_dir: 0, q_mgr: 1, q_pro: 1, q_ana: 0, mtgMins: 30, mtgCallsPerWeek: 3, mtgPrepMins: 15, suppliers: 5, projects: 20, value: 8000, rate: 35, callsPerWeek: 1, callMins: 30, attendees: 2, prepMins: 15, briefHrs: 3, chaseHrs: 3, checkHrs: 3, weeksActual: 6, weeksIdeal: 4, delayCost: 150, reworkPct: 15, reworkHrs: 8, reworkExtraPct: 3 },
  mid: {},
  large: { q_dir: 1, q_mgr: 1, q_pro: 2, q_ana: 0, mtgMins: 60, mtgCallsPerWeek: 45, mtgPrepMins: 45, suppliers: 40, projects: 300, value: 60000, rate: 55, callsPerWeek: 1.5, callMins: 60, attendees: 4, prepMins: 45, briefHrs: 8, chaseHrs: 8, checkHrs: 10, weeksActual: 14, weeksIdeal: 8, delayCost: 1000, reworkPct: 20, reworkHrs: 20, reworkExtraPct: 6 }
};

function clean(v, f) {
  var n = parseFloat(String(v).replace(/,/g, ""));
  if (!isFinite(n)) n = 0;
  if (n < 0) n = 0;
  if (f && f.max !== undefined && n > f.max) n = f.max;
  return n;
}

/* Cost of one typical call, built role by role. Pay per hour comes from the role rows (ONS medians by default),
   uplifted by the on-cost %. Prep is priced at the average loaded rate of the people on the call. */
function meetingCost(i) {
  var u = 1 + (i.mtgOnCostPct || 0) / 100;
  var n = 0, loadedSum = 0, baseSum = 0;
  ROLES.forEach(function (r) {
    var q = i["q_" + r.id] || 0, rate = i["r_" + r.id] || 0;
    n += q; loadedSum += q * rate * u; baseSum += q * rate;
  });
  var avgLoaded = n > 0 ? loadedSum / n : 0;
  var peopleHours = n * i.mtgMins / 60;
  var peopleCost = loadedSum * i.mtgMins / 60;
  var prepHours = n > 0 ? i.mtgPrepMins / 60 : 0;
  var prepCost = prepHours * avgLoaded;
  var perCall = peopleCost + prepCost;
  var hoursPerCall = peopleHours + prepHours;
  var callsYear = i.mtgCallsPerWeek * i.mtgWeeks;
  var cutCalls = Math.min(1, i.mtgCallsPerWeek);
  return {
    headcount: n, avgLoaded: avgLoaded, avgBase: n > 0 ? baseSum / n : 0,
    peopleHours: peopleHours, peopleCost: peopleCost, prepHours: prepHours, prepCost: prepCost,
    perCall: perCall, hoursPerCall: hoursPerCall,
    callsYear: callsYear, perWeek: perCall * i.mtgCallsPerWeek, perYear: perCall * callsYear,
    hoursWeek: hoursPerCall * i.mtgCallsPerWeek, hoursYear: hoursPerCall * callsYear,
    cutSaveYear: perCall * cutCalls * i.mtgWeeks, cutSaveHours: hoursPerCall * cutCalls * i.mtgWeeks
  };
}

function calc(i) {
  var P = i.projects, H = i.rate, V = i.value;
  var callsPerProject, callCount, callHours, prepHours, callsHours, callsCost;
  var m = meetingCost(i);
  if (i.mtgUse) {
    callCount = m.callsYear;
    callsPerProject = P > 0 ? callCount / P : 0;
    callHours = callCount * m.peopleHours;
    prepHours = callCount * m.prepHours;
    callsHours = callHours + prepHours;
    callsCost = callCount * m.perCall;
  } else {
    callsPerProject = i.callsPerWeek * i.weeksActual;
    callCount = P * callsPerProject;
    callHours = callCount * i.attendees * i.callMins / 60;
    prepHours = callCount * i.prepMins / 60;
    callsHours = callHours + prepHours;
    callsCost = callsHours * H;
  }

  var adminHours = P * (i.briefHrs + i.chaseHrs + i.checkHrs);
  var adminCost = adminHours * H;

  var reworkCount = P * i.reworkPct / 100;
  var reworkHours = reworkCount * i.reworkHrs;
  var reworkDirect = reworkCount * V * i.reworkExtraPct / 100;
  var reworkCost = reworkHours * H + reworkDirect;

  var delayWeeks = Math.max(0, i.weeksActual - i.weeksIdeal);
  var delayCost = P * delayWeeks * i.delayCost;

  var callsDrag = callsCost * i.wasteCallsPct / 100;
  var adminDrag = adminCost * i.wasteAdminPct / 100;
  var reworkDrag = reworkCost;
  var delayDrag = delayCost;
  var drag = callsDrag + adminDrag + reworkDrag + delayDrag;
  var cautious = drag - delayDrag;

  var dragHours = callsHours * i.wasteCallsPct / 100 + adminHours * i.wasteAdminPct / 100 + reworkHours;
  var spend = P * V;

  var share = i.agenticSharePct / 100;
  var eligible = drag * share;
  var feeTotal = P * share * i.feePerJob;
  var lowCut = Math.min(i.cutLowPct, i.cutHighPct), highCut = Math.max(i.cutLowPct, i.cutHighPct);
  var grossLow = eligible * lowCut / 100, grossHigh = eligible * highCut / 100;

  return {
    callsPerProject: callsPerProject, callCount: callCount, callHours: callHours, prepHours: prepHours,
    callsHours: callsHours, callsCost: callsCost, adminHours: adminHours, adminCost: adminCost,
    reworkCount: reworkCount, reworkHours: reworkHours, reworkDirect: reworkDirect, reworkCost: reworkCost,
    delayWeeks: delayWeeks, delayCost: delayCost,
    callsDrag: callsDrag, adminDrag: adminDrag, reworkDrag: reworkDrag, delayDrag: delayDrag,
    drag: drag, cautious: cautious, dragHours: dragHours,
    days: dragHours / i.hoursPerDay, fte: dragHours / i.hoursPerFte,
    perProject: P > 0 ? drag / P : 0, perSupplier: i.suppliers > 0 ? drag / i.suppliers : 0,
    pctOfSpend: spend > 0 ? drag / spend * 100 : 0, spend: spend,
    eligible: eligible, feeTotal: feeTotal, lowCut: lowCut, highCut: highCut,
    grossLow: grossLow, grossHigh: grossHigh, netLow: grossLow - feeTotal, netHigh: grossHigh - feeTotal,
    mPerCall: m.perCall, mPerWeek: m.perWeek, mPerYear: m.perYear, mHoursYear: m.hoursYear, mHoursPerCall: m.hoursPerCall,
    mHeadcount: m.headcount, mCutSaveYear: m.cutSaveYear, mCutSaveHours: m.cutSaveHours
  };
}
function levers(i) {
  var base = calc(i).drag;
  function sav(change) {
    var j = {}; Object.keys(i).forEach(function (k) { j[k] = i[k]; });
    change(j);
    return Math.max(0, base - calc(j).drag);
  }
  var mtg = !!i.mtgUse;
  var list = [
    { n: "Halve the number of status calls", note: "Fewer, sharper calls, with a written update in between.", v: sav(function (j) { if (mtg) j.mtgCallsPerWeek = i.mtgCallsPerWeek / 2; else j.callsPerWeek = i.callsPerWeek / 2; }) },
    { n: "Take 15 minutes off every call", note: "A shorter call with a clear purpose.", v: sav(function (j) { if (mtg) j.mtgMins = Math.max(0, i.mtgMins - 15); else j.callMins = Math.max(0, i.callMins - 15); }) },
    { n: "One fewer person on every call", note: "Send the notes to the rest.", v: sav(function (j) {
      if (!mtg) { j.attendees = Math.max(0, i.attendees - 1); return; }
      var best = null; ROLES.forEach(function (r) { if (!best || (i["q_" + r.id] || 0) > (i["q_" + best.id] || 0)) best = r; });
      if (best) j["q_" + best.id] = Math.max(0, (i["q_" + best.id] || 0) - 1);
    }) },
    { n: "Halve the chasing", note: "Agree in advance when updates will land.", v: sav(function (j) { j.chaseHrs = i.chaseHrs / 2; }) },
    { n: "Halve the rework", note: "Clearer briefs, and checking earlier.", v: sav(function (j) { j.reworkPct = i.reworkPct / 2; }) },
    { n: "Finish projects two weeks sooner", note: "Never goes below your 'ideal' length.", v: sav(function (j) { j.weeksActual = Math.max(i.weeksIdeal, i.weeksActual - 2); }) }
  ];
  list.sort(function (a, b) { return b.v - a.v; });
  return list;
}


/* Readiness self-check. Pure scoring, no DOM, no network, no storage. */
var READY_THRESHOLD = 50000;
var READY_IDS = ["drag50k", "trusted", "senior", "pilotOpen", "priority", "testSoon"];

function autoDrag50k(drag) {
  var n = Math.round(Number(drag));
  if (!isFinite(n)) n = 0;
  return n >= READY_THRESHOLD ? "yes" : "no";
}

function readinessScore(answers) {
  var points = 0, answered = 0;
  READY_IDS.forEach(function (id) {
    var a = answers && answers[id];
    if (a === "yes") { points += 2; answered += 1; }
    else if (a === "maybe") { points += 1; answered += 1; }
    else if (a === "no") { answered += 1; }
  });
  var complete = answered === READY_IDS.length;
  var band = null;
  if (complete) {
    if (points >= 9) band = "pilot-ready";
    else if (points >= 5) band = "worth-a-chat";
    else band = "not-yet";
  }
  return { points: points, answered: answered, complete: complete, band: band, max: READY_IDS.length * 2 };
}
/* ===CALC-END=== */

if (typeof document === "undefined") { return; }

var GROUPS = [
  { key: "work", title: "Your supplier work", desc: "The size of the picture." },
  { key: "mtg", title: "Who\u2019s on your supplier calls?", desc: "" },
  { key: "calls", title: "Calls: the simple version", desc: "Used only if you choose a single hourly cost for your supplier calls instead of the meeting builder above." },
  { key: "admin", title: "Briefing, chasing and checking", desc: "The quiet hours between the calls." },
  { key: "speed", title: "Speed", desc: "How long things take against how long they ought to." },
  { key: "quality", title: "Mistakes and rework", desc: "What it costs when work comes back not right." },
  { key: "assume", title: "Assumptions you can change", desc: "These are our starting guesses, in plain sight. Change any of them. They shape the report, so adjust them to your own view." }
];
var byId = {};
FIELDS.forEach(function (f) { byId[f.id] = f; });

var el = function (id) { return document.getElementById(id); };
var isExample = true;

var dragBar = el("drag-bar");
var dragBarTotal = el("drag-bar-total");
var dragBarLast = "";
var formInView = false;
var reportFigInView = false;

function syncDragBarSpace() {
  var show = formInView && !reportFigInView;
  dragBar.hidden = !show;
  document.documentElement.classList.toggle("has-drag-bar", show);
  document.body.classList.toggle("has-drag-bar", show);
  if (show) {
    document.documentElement.style.setProperty("--drag-bar-space", dragBar.offsetHeight + "px");
  } else {
    document.documentElement.style.removeProperty("--drag-bar-space");
  }
}

function updateDragBar(drag) {
  var txt = money(drag);
  if (txt !== dragBarLast) {
    var changed = dragBarLast !== "";
    dragBarTotal.textContent = txt;
    if (changed && !dragBar.hidden) {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        dragBarTotal.classList.remove("is-tick");
        void dragBarTotal.offsetWidth;
        dragBarTotal.classList.add("is-tick");
      }
    }
    dragBarLast = txt;
  }
}

function goToReport() {
  update();
  el("report").scrollIntoView({ behavior: "smooth", block: "start" });
  el("report").setAttribute("tabindex", "-1");
  el("report").focus({ preventScroll: true });
}


function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function render() {
  var out = "";
  GROUPS.forEach(function (g, gi) {
    if (g.key === "mtg") { out += meetingGroupHTML(); return; }
    out += '<fieldset class="group" id="grp-' + g.key + '"><legend>' + esc(g.title) + '</legend><p class="gdesc">' + esc(g.desc) + '</p><div class="fgrid">';
    FIELDS.filter(function (f) { return f.g === g.key && !f.hidden; }).forEach(function (f) {
      var hid = f.hint ? ' aria-describedby="h-' + f.id + '"' : "";
      var maxA = f.max !== undefined ? ' max="' + f.max + '"' : "";
      out += '<div class="field"><label for="f-' + f.id + '">' + esc(f.label) + ' <span class="unit">(' + esc(f.unit) + ')</span></label>' +
        (f.hint ? '<span class="hint" id="h-' + f.id + '">' + esc(f.hint) + '</span>' : "") +
        '<input type="number" inputmode="decimal" id="f-' + f.id + '" min="' + f.min + '"' + maxA + ' step="' + f.step + '" value="' + f.def + '"' + hid + '></div>';
    });
    out += "</div></fieldset>";
  });
  el("groups").innerHTML = out;
}


function numInput(id, aria) {
  var f = byId[id];
  var maxA = f.max !== undefined ? ' max="' + f.max + '"' : "";
  return '<input type="number" inputmode="decimal" id="f-' + id + '" min="' + f.min + '"' + maxA + ' step="' + f.step + '" value="' + f.def + '"' + (aria ? ' aria-label="' + esc(aria) + '"' : "") + '>';
}
function field(id, hint) {
  var f = byId[id];
  return '<div class="field"><label for="f-' + id + '">' + esc(f.label) + ' <span class="unit">(' + esc(f.unit) + ')</span></label>' +
    (hint ? '<span class="hint" id="h-' + id + '">' + esc(hint) + '</span>' : "") + numInput(id) + '</div>';
}
function meetingGroupHTML() {
  var h = '<fieldset class="group meet" id="grp-mtg"><legend>Who&rsquo;s on your supplier calls?</legend>' +
    '<p class="gdesc">Build a typical call with a third-party contractor or specialist you outsource to, person by person, and see what it costs your business. Pay rates start at UK averages from official figures. They are rough, so change them to suit your own people. You can use the same builder for everyday internal calls too.</p>' +
    '<input type="hidden" id="f-mtgUse" value="1">' +
    '<div class="meet-roles" role="group" aria-label="Who is on a typical supplier call">' +
    '<span class="hd">Role</span><span class="hd h-ppl">People on the call</span><span class="hd h-rate">Pay per hour (£)</span>';
  ROLES.forEach(function (r) {
    h += '<div class="rl"><label for="f-q_' + r.id + '">' + esc(r.label) + '</label>' + (r.custom ? '<small>Put in your own £ per hour.</small>' : '<small>ONS ' + esc(r.soc) + ': ' + esc(r.socName) + '</small>') + '</div>' +
      '<div class="field">' + numInput("q_" + r.id, r.label + ": number of people") + '</div>' +
      '<div class="field">' + numInput("r_" + r.id, r.label + ": pay per hour in pounds") + (r.custom ? "" : '<span class="asheq">ONS median ' + gbp2.format(r.ashe) + '</span>') + '</div>';
  });
  h += '</div><div class="fgrid">' +
    field("mtgMins") + field("mtgCallsPerWeek", byId.mtgCallsPerWeek.hint) + field("mtgPrepMins", byId.mtgPrepMins.hint) + field("mtgWeeks", byId.mtgWeeks.hint) +
    field("mtgOnCostPct", "Pay is not the whole cost of a person. On top come employer National Insurance, employer pension contributions and overheads such as kit, space and software. 30% is a rough starting guess. Set it to 0 to price pay only.") +
    '</div>' +
    '<div class="meet-out" id="meet-out" role="group" aria-label="The true cost of this supplier call"></div>' +
    '<div class="meet-use" role="radiogroup" aria-label="What the report should use for calls">' +
    '<label><input type="radio" name="mtguse" id="use-mtg" value="1"><span><b>Use these supplier calls in my report.</b> The report prices your calls from the people, pay, length, number and prep above.</span></label>' +
    '<label><input type="radio" name="mtguse" id="use-simple" value="0"><span><b>Use the simple version instead.</b> One hourly cost for everyone, from the Calls section further down.</span></label>' +
    '</div>' +
    '<details class="how-calc src-note" open id="src-note"><summary>Where these figures come from</summary>' + sourceNoteHTML() + '</details>' +
    '</fieldset>';
  return h;
}
function sourceNoteHTML() {
  var rows = ROLES.filter(function (r) { return !r.custom; }).map(function (r) {
    return '<tr><td>' + esc(r.label) + '</td><td>' + esc(r.soc) + ': ' + esc(r.socName) + '</td><td>' + gbp2.format(r.ashe) + '</td></tr>';
  }).join("");
  return '<p>The starting pay rates are <strong>median gross hourly pay for all UK employee jobs</strong>, taken from the Office for National Statistics (ONS) <strong>Annual Survey of Hours and Earnings (ASHE), ' + esc(ASHE.edition) + ' edition</strong>, published ' + esc(ASHE.published) + ', for the pay period that included a date in April 2026. The table used is <strong>ASHE Table 2, Table 2.5a &ldquo;Hourly pay - Gross&rdquo;</strong> (occupation by two-digit SOC 2020), the &ldquo;All&rdquo; sheet, median column. ' +
    '<a href="' + ASHE.url + '" rel="noopener">ASHE Table 2, 2026 provisional edition (ONS)</a> and the <a href="' + ASHE.bulletinUrl + '" rel="noopener">ONS &ldquo;Employee earnings in the UK: 2026&rdquo; bulletin</a>.</p>' +
    '<table><thead><tr><th>Role in this calculator</th><th>Nearest ONS group (SOC 2020)</th><th>Median £ per hour</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<p><strong>Treat these as rough national averages, not exact figures.</strong> They are the middle value across the whole UK, so your own people may earn more or less, and pay differs by sector, region and firm. We have picked the nearest ONS group for each role, which is a judgement. The mean is higher than the median, especially for senior roles. ASHE covers employees, not self-employed contractors. The 2026 figures are provisional and ONS expects to publish final figures in October 2027. Every rate above is editable.</p>' +
    '<p>ASHE counts pay only, so the on-cost uplift is added on top to get closer to what a person really costs. The supplier&rsquo;s own people are not counted anywhere, which keeps the result on the cautious side. Contains public sector information from the Office for National Statistics, licensed under the Open Government Licence v3.0.</p>';
}

function meetOutHTML(i, m, showAvoid, r) {
  var u = '<p class="meet-title">The true cost of this supplier call</p>';
  if (m.headcount <= 0) return u + '<p class="meet-empty">Add at least one person to the call above to see what it costs.</p>';
  var who = nf1.format(m.headcount) + (m.headcount === 1 ? " person" : " people");
  var days = i.hoursPerDay > 0 ? m.hoursYear / i.hoursPerDay : 0;
  return u +
    '<div class="meet-grid">' +
    '<div><span class="meet-fig">' + money(m.perCall) + '</span><span class="meet-cap">One call</span><span class="meet-sub">' + who + ' for ' + nf1.format(i.mtgMins) + ' minutes, plus ' + nf1.format(i.mtgPrepMins) + ' minutes of prep</span></div>' +
    '<div><span class="meet-fig">' + money(m.perWeek) + '</span><span class="meet-cap">Every week</span><span class="meet-sub">' + nf1.format(i.mtgCallsPerWeek) + (i.mtgCallsPerWeek === 1 ? " call" : " calls") + ' a week</span></div>' +
    '<div><span class="meet-fig">' + money(m.perYear) + '</span><span class="meet-cap">Every year</span><span class="meet-sub">' + nf.format(Math.round(m.callsYear)) + ' calls over ' + nf1.format(i.mtgWeeks) + ' weeks</span></div>' +
    '<div><span class="meet-fig">' + hrs(m.hoursYear) + '</span><span class="meet-cap">Person-hours a year</span><span class="meet-sub">about ' + nf.format(Math.round(days)) + ' working days of people&rsquo;s time</span></div>' +
    '</div>' +
    '<p class="meet-ask">Before the next one: does this call need to happen? Could the work just be sent and checked?</p>' +
    '<p class="meet-about"><b>Meetings about meetings.</b> Cut just one of these calls a week and you could save about <strong>' + money(m.cutSaveYear) + '</strong> and ' + hrs(m.cutSaveHours) + ' person-hours a year.</p>' +
    (showAvoid ? '<p class="meet-fine">Your report counts ' + i.wasteCallsPct + '% of this, ' + money(r.callsDrag) + ', as avoidable drag. The rest is treated as calls that were worth having.</p>' : '') +
    '<p class="meet-fine">Rough national averages from ONS figures, plus ' + nf1.format(i.mtgOnCostPct) + '% on top for employer costs. Editable, and not exact. Only your own side is counted.</p>';
}

function read() {
  var i = {};
  FIELDS.forEach(function (f) { i[f.id] = clean(el("f-" + f.id).value, f); });
  if (i.hoursPerFte < 1) i.hoursPerFte = 1;
  if (i.hoursPerDay < 1) i.hoursPerDay = 1;
  return i;
}

function setValues(map) {
  FIELDS.forEach(function (f) {
    el("f-" + f.id).value = (map && map[f.id] !== undefined) ? map[f.id] : f.def;
  });
}

var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
var gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });
var nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
var nf1 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
function money(n) { return (n < 0 ? "-" : "") + gbp.format(Math.abs(Math.round(n))); }
function hrs(n) { return nf.format(Math.round(n)); }

function sentenceBiggest(r) {
  var parts = [
    { n: "calls and call prep", v: r.callsDrag },
    { n: "briefing, chasing and checking", v: r.adminDrag },
    { n: "rework", v: r.reworkDrag },
    { n: "delay", v: r.delayDrag }
  ].sort(function (a, b) { return b.v - a.v; });
  return parts[0];
}

function update() {
  var i = read(), r = calc(i), m = meetingCost(i);
  var inputsEcho = i;
  var useM = !!i.mtgUse;
  el("use-mtg").checked = useM; el("use-simple").checked = !useM;
  el("grp-calls").hidden = useM;
  el("meet-out").innerHTML = meetOutHTML(i, m, false, r);
  var rm = el("r-meet");
  rm.hidden = !useM;
  rm.innerHTML = useM ? '<h4>The true cost of your supplier calls</h4><div class="meet-out">' + meetOutHTML(i, m, true, r) + '</div>' : "";

  el("when").textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  el("example-flag").hidden = !isExample;
  el("r-total").textContent = money(r.drag);
  updateDragBar(r.drag);
  el("r-sub").textContent = "That is about " + money(r.perProject) + " on each project and " + money(r.perSupplier) + " for each supplier. Leaving delay out, the cautious figure is " + money(r.cautious) + ".";

  var warn = el("r-warn");
  var msgs = [];
  if (i.projects === 0) msgs.push("You have put 0 projects, so everything comes out as nothing.");
  if (r.pctOfSpend > 50) msgs.push("That is more than half of what you spend with suppliers. It is possible, but have another look at the delay cost and the hours, which are the usual culprits.");
  if (i.weeksActual < i.weeksIdeal) msgs.push("You have said projects finish faster than ideal, so no delay cost is counted.");
  if (i.cutLowPct > i.cutHighPct) msgs.push("Your low case is higher than your high case, so we have swapped them.");
  warn.hidden = msgs.length === 0;
  warn.textContent = msgs.join(" ");

  el("r-tiles").innerHTML =
    '<div class="tile"><b>' + hrs(r.dragHours) + ' hours</b><span>of your team&rsquo;s time lost a year to avoidable calls, admin and rework</span></div>' +
    '<div class="tile"><b>' + nf.format(Math.round(r.days)) + ' working days</b><span>or about ' + nf1.format(r.fte) + ' full-time ' + (Math.round(r.fte * 10) / 10 === 1 ? "person" : "people") + '</span></div>' +
    '<div class="tile"><b>' + nf1.format(r.pctOfSpend) + '%</b><span>on top of the ' + money(r.spend) + ' you spend with suppliers</span></div>' +
    '<div class="tile"><b>' + nf.format(Math.round(r.callCount)) + ' calls</b><span>a year, about ' + nf1.format(r.callsPerProject) + ' per project</span></div>';

  var cats = [
    { c: "c1", n: "Calls and call prep", v: r.callsDrag, how: (useM ?
      "Calls: " + nf.format(Math.round(r.callCount)) + " a year (" + nf1.format(i.mtgCallsPerWeek) + " a week), " + nf1.format(m.headcount) + " of your people by role, " + nf1.format(i.mtgMins) + " minutes, plus " + nf1.format(i.mtgPrepMins) + " minutes of prep. At " + money(m.perCall) + " a call, all of that costs " + money(r.callsCost) + ". We count " + i.wasteCallsPct + "% as avoidable." :
      "Calls: " + nf.format(Math.round(r.callCount)) + " a year, " + i.attendees + " of your people, " + i.callMins + " minutes, plus " + i.prepMins + " minutes of prep. All of that costs " + money(r.callsCost) + ". We count " + i.wasteCallsPct + "% as avoidable.") },
    { c: "c2", n: "Briefing, chasing and checking", v: r.adminDrag, how: hrs(r.adminHours) + " hours a year costs " + money(r.adminCost) + ". We count " + i.wasteAdminPct + "% as avoidable." },
    { c: "c3", n: "Rework", v: r.reworkDrag, how: nf1.format(r.reworkCount) + " projects a year reworked: " + hrs(r.reworkHours) + " hours of your time (" + money(r.reworkHours * i.rate) + ") plus " + money(r.reworkDirect) + " in extra spend. All of it counted." },
    { c: "c4", n: "Delay", v: r.delayDrag, how: nf1.format(r.delayWeeks) + " weeks late on each project, at " + money(i.delayCost) + " a week, across " + nf.format(i.projects) + " projects. All of it counted. The least certain figure, so we show the cautious total too." }
  ];
  var tot = r.drag;
  el("r-stack").innerHTML = tot > 0 ? cats.map(function (c) { return '<i class="' + c.c + '" style="width:' + (c.v / tot * 100) + '%"></i>'; }).join("") : "";
  var maxV = Math.max.apply(null, cats.map(function (c) { return c.v; })) || 1;
  el("r-rows").innerHTML = cats.map(function (c) {
    var pct = tot > 0 ? c.v / tot * 100 : 0;
    return '<div class="row"><span class="nm"><span class="sw ' + c.c + '"></span>' + c.n + '</span><span class="val">' + money(c.v) + ' · ' + nf.format(Math.round(pct)) + '%</span>' +
      '<span class="bar"><i class="' + c.c + '" style="width:' + (c.v / maxV * 100) + '%"></i></span><span class="how">' + esc(c.how) + '</span></div>';
  }).join("");

  var big = sentenceBiggest(r);
  var wake = '<h4>The wake-up</h4>';
  if (r.drag <= 0) {
    wake += '<p>On these figures there is nothing to flag. Put in your own numbers above and the report will fill in.</p>';
  } else {
    wake += '<p>On your figures, working with suppliers the slow way could be costing you around <strong>' + money(r.drag) + ' a year</strong>. That is about ' + hrs(r.dragHours) + ' hours of your own people&rsquo;s time, roughly ' + nf1.format(r.fte) + ' full-time ' + (Math.round(r.fte * 10) / 10 === 1 ? "person" : "people") + ', spent on calls, chasing and fixing, plus ' + money(r.delayDrag) + ' for the waiting.</p>' +
      '<p>The biggest slice is <strong>' + big.n + '</strong>, at ' + money(big.v) + '. Most of this never shows up as a line in the books. It is hidden inside salaries, overruns and &ldquo;quick catch-ups&rdquo;, which is why it so rarely gets looked at.</p>' +
      (big.n === "delay" ? '<p>Delay is the shakiest number here, because it rests on your own cost per week late. Check it first. Without it, the cautious figure is <strong>' + money(r.cautious) + '</strong>.</p>' : '') + '<p>The question for a business head is not &ldquo;are our suppliers any good?&rdquo; They may be excellent. It is &ldquo;how much does it cost us to work with them the way we do now?&rdquo;</p>';
  }
  el("r-wake").innerHTML = wake;

  var rng = '<h4>What could change, illustratively</h4>';
  if (r.eligible <= 0) {
    rng += '<p>Nothing to show yet, because the drag above is nil.</p>';
  } else {
    rng += '<p>Suppose ' + i.agenticSharePct + '% of your supplier work moved to a trusted supplier&rsquo;s agent on AgentAnvil, and the drag on that work fell by ' + r.lowCut + '% to ' + r.highCut + '%. That <em>could</em> be worth:</p>' +
      '<span class="fig2">' + money(r.netLow) + ' to ' + money(r.netHigh) + ' a year</span>';
    if (i.feePerJob > 0) {
      rng += '<p>After your placeholder platform fee of ' + gbp2.format(i.feePerJob) + ' on ' + nf.format(Math.round(i.projects * i.agenticSharePct / 100)) + ' jobs (' + money(r.feeTotal) + ' a year). Before the fee it would be ' + money(r.grossLow) + ' to ' + money(r.grossHigh) + '.</p>';
    } else {
      rng += '<p>That is before any platform fee. AgentAnvil charges a small flat fee per job, never a percentage, and pricing is still to be confirmed. Put your own placeholder in the assumptions to see it taken off.</p>';
    }
    if (r.netLow < 0) rng += '<p>At these settings the low case is below zero, so the fee would outweigh the saving. That is a useful thing to know too.</p>';
    rng += '<p class="muted small">These percentages are placeholders you can change, not evidence and not a forecast. AgentAnvil is on testnet with pretend money and has no live customer results yet. Any saving is a &ldquo;could&rdquo;, never a promise.</p>';
  }
  el("r-range").innerHTML = rng;

  var lv = levers(i), lvMax = Math.max.apply(null, lv.map(function (x) { return x.v; })) || 1;
  el("r-levers").innerHTML = r.drag <= 0 ? "<p class=\"muted small\">Nothing to show until there is some drag to cut.</p>" : lv.map(function (x) {
    return '<div class="lv"><span class="nm">' + esc(x.n) + '</span><span class="val">saves about ' + money(x.v) + ' a year</span><span class="bar"><i style="width:' + (x.v / lvMax * 100) + '%"></i></span><span class="nt">' + esc(x.note) + '</span></div>';
  }).join("");

  var moves = [];
  if (big.n === "calls and call prep") {
    moves.push("Pick your three busiest supplier relationships and look at the last month of calls. How many were repeating something already written down?");
    moves.push("Switch routine status calls to a short written update on a fixed day, and keep calls for decisions.");
    moves.push("Cap attendees, and send notes to everyone else.");
  } else if (big.n === "briefing, chasing and checking") {
    moves.push("Agree with each supplier, up front, when updates will arrive, so nobody needs to ask.");
    moves.push("Write every job brief in the same simple layout: what, by when, what 'done' looks like.");
    moves.push("Check work in stages, not all at the end.");
  } else if (big.n === "rework") {
    moves.push("Look at your last three reworked projects. Was the cause a vague brief, a missed change or a late check?");
    moves.push("Add a short 'play it back' step at the start: the supplier says in their own words what they will deliver.");
    moves.push("Agree what 'done' looks like before work begins, in writing.");
  } else {
    moves.push("Check the cost of a week late first. It drives this whole number, and it is your own estimate.");
    moves.push("Find where projects sit waiting: for your answers, for sign-off, or for the supplier.");
    moves.push("Agree turnaround times for your own side too. Delay is rarely only the supplier's doing.");
  }
  el("r-moves").innerHTML = moves.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");
  el("r-questions").innerHTML = [
    "How long does a typical job take you from our brief to something we can accept?",
    "What do you most often have to ask us to clarify, and could we answer it up front?",
    "How do you want to give us updates, so we do not have to chase?",
    "What are your agentic ways of working, are you set up for it yet, and how can we help you get there together?",
    "Would you be open to a specialist agent of your own that can take a clearly described job and report back, with a person on each side still in charge?",
    "What would you need to see before you tried it?"
  ].map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("");

  el("r-formulas").innerHTML = [
    useM ? "<b>Calls a year</b> = calls a week × weeks a year the calls run." : "<b>Calls a year</b> = projects × calls per project per week × weeks a project really takes.",
    useM ? "<b>Cost of one call</b> = for each person, pay per hour × (1 + on-cost %) × call minutes ÷ 60, added up across everyone on the call, plus prep minutes ÷ 60 × the average loaded hourly rate of the people on the call." : "<b>Call hours</b> = calls × your people on each call × minutes ÷ 60, plus calls × prep minutes ÷ 60.",
    useM ? "<b>Cost of calls</b> = calls a year × cost of one call. Person-hours = calls a year × (people × minutes ÷ 60 + prep minutes ÷ 60). Cutting one call a week saves one call's cost × weeks a year." : "",
    "<b>Briefing, chasing and checking hours</b> = projects × (briefing + chasing + checking hours).",
    "<b>Rework</b> = projects × rework rate × (staff hours × hourly cost + project value × extra spend %).",
    "<b>Delay</b> = projects × (real weeks − ideal weeks, never below zero) × cost of a week late.",
    useM ? "<b>Cost of admin</b> = hours × loaded hourly cost. For calls and admin, only the share you call avoidable counts towards drag." : "<b>Cost of calls and admin</b> = hours × loaded hourly cost. Only the share you call avoidable counts towards drag.",
    "<b>Yearly drag</b> = avoidable calls + avoidable admin + rework + delay. The cautious total leaves delay out.",
    "<b>Where a small change could bite</b> = your yearly drag, less the drag recalculated with just that one change made.",
    "<b>Illustrative range</b> = drag × share of work that could go agentic × the low or high cut, less any placeholder fee × jobs moved."
  ].filter(function (t) { return t; }).map(function (t) { return "<li>" + t + "</li>"; }).join("");

  var rows = "";
  GROUPS.forEach(function (g) {
    if (g.key === "mtg") {
      rows += '<tr><th colspan="2">Who&rsquo;s on your supplier calls?' + (useM ? "" : " (not used in the report)") + '</th></tr>';
      ROLES.forEach(function (ro) {
        var q = i["q_" + ro.id];
        if (q > 0) rows += '<tr><td>' + esc(ro.label) + ' <span class="muted">(people × pay per hour)</span></td><td>' + nf1.format(q) + ' × ' + gbp2.format(i["r_" + ro.id]) + '</td></tr>';
      });
      ["mtgMins", "mtgCallsPerWeek", "mtgPrepMins", "mtgWeeks", "mtgOnCostPct"].forEach(function (id) {
        var f = byId[id], v = i[id];
        rows += '<tr><td>' + esc(f.label) + ' <span class="muted">(' + esc(f.unit) + ')</span></td><td>' + (f.unit === "%" ? v + "%" : nf1.format(v)) + '</td></tr>';
      });
      return;
    }
    if (g.key === "calls" && useM) return;
    rows += '<tr><th colspan="2">' + esc(g.title) + '</th></tr>';
    FIELDS.filter(function (f) { return f.g === g.key; }).forEach(function (f) {
      var v = inputsEcho[f.id];
      var shown = f.unit.charAt(0) === "£" ? gbp2.format(v) : (f.unit.indexOf("%") === 0 ? v + "%" : nf1.format(v));
      rows += '<tr><td>' + esc(f.label) + ' <span class="muted">(' + esc(f.unit) + ')</span></td><td>' + shown + '</td></tr>';
    });
  });
  document.querySelector("#r-echo tbody").innerHTML = rows;

  syncReady(r);
}

var readyQ1Manual = false;

function readReadyAnswers() {
  var a = {};
  READY_IDS.forEach(function (id) {
    var box = document.querySelector('input[name="ready-' + id + '"]:checked');
    if (box) a[id] = box.value;
  });
  return a;
}

function setReadyRadio(id, value) {
  var box = document.querySelector('input[name="ready-' + id + '"][value="' + value + '"]');
  if (box) box.checked = true;
}

function clearReadyAnswers() {
  readyQ1Manual = false;
  READY_IDS.forEach(function (id) {
    Array.prototype.forEach.call(document.querySelectorAll('input[name="ready-' + id + '"]'), function (box) { box.checked = false; });
  });
}

function readyNote(drag) {
  var note = el("ready-auto-note");
  var shown = money(drag);
  note.hidden = false;
  if (!readyQ1Manual) {
    note.textContent = "Filled in from your yearly drag figure above (" + shown + "). You can change it.";
  } else {
    note.textContent = "You changed this. Your yearly drag figure above is " + shown + ".";
  }
}

function syncReady(r) {
  var auto = autoDrag50k(r.drag);
  if (!readyQ1Manual) setReadyRadio("drag50k", auto);
  readyNote(r.drag);
  renderReadyResult();
}

function renderReadyResult() {
  var s = readinessScore(readReadyAnswers());
  var box = el("ready-result");
  var wait = el("ready-wait");
  if (!s.complete) {
    box.hidden = true;
    box.innerHTML = "";
    wait.hidden = false;
    return;
  }
  wait.hidden = true;
  box.hidden = false;
  var title, body, ctas, links;
  if (s.band === "pilot-ready") {
    title = "Pilot-ready";
    body = "On these answers, a small, low-risk test looks like a fair next step. If you would like to request a pilot, you can. It is optional, and nothing is sent unless you choose to get in touch.";
    ctas = '<a class="btn btn-gold" href="https://www.agentanvil.co.uk/request-access/?ref=calculator-ready">Request a pilot</a>';
    links = "Request a pilot: https://www.agentanvil.co.uk/request-access/?ref=calculator-ready";
  } else if (s.band === "worth-a-chat") {
    title = "Worth a chat";
    body = "You are in a fair place to start exploring this. The starter kit can help you open the conversation with suppliers. If you would like a person to talk it through, that door is open. It is optional, and nothing is sent unless you choose to get in touch.";
    ctas = '<a class="btn btn-gold" href="https://www.agentanvil.co.uk/supplier-starter-kit/">Get the free supplier conversation starter kit</a>' +
           '<a class="btn btn-ghost" href="https://www.agentanvil.co.uk/request-access/">Happy to talk it through</a>';
    links = "Starter kit: https://www.agentanvil.co.uk/supplier-starter-kit/ &middot; Happy to talk it through: https://www.agentanvil.co.uk/request-access/";
  } else {
    title = "Not yet";
    body = "That is alright. You do not have to be ready today. A good next step is to start a conversation with the suppliers you already work with. The free starter kit has wording you can copy into an email. No sign-up, no strings, and nobody will chase you.";
    ctas = '<a class="btn btn-gold" href="https://www.agentanvil.co.uk/supplier-starter-kit/">Get the free supplier conversation starter kit</a>';
    links = "Starter kit: https://www.agentanvil.co.uk/supplier-starter-kit/";
  }
  box.innerHTML = "<h5>" + title + "</h5><p>" + body + "</p>" +
    '<div class="ready-ctas">' + ctas + "</div>" +
    '<p class="ready-print-links">' + links + "</p>";
}

render();
update();

el("calc-form").addEventListener("input", function (e) {
  if (e.target && e.target.name === "mtguse") el("f-mtgUse").value = e.target.value;
  isExample = false; update();
});
el("r-ready").addEventListener("change", function (e) {
  var t = e.target;
  if (!t || !t.name || t.name.indexOf("ready-") !== 0) return;
  if (t.name === "ready-drag50k") {
    readyQ1Manual = t.value !== autoDrag50k(calc(read()).drag);
  }
  readyNote(calc(read()).drag);
  renderReadyResult();
});
el("show-report").addEventListener("click", goToReport);
el("reset").addEventListener("click", function () { clearReadyAnswers(); setValues({}); isExample = true; update(); });
Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
  b.addEventListener("click", function () { clearReadyAnswers(); setValues(PRESETS[b.getAttribute("data-preset")]); isExample = true; update(); });
});
el("print").addEventListener("click", function () { update(); window.print(); });

if ("IntersectionObserver" in window) {
  var dragBarIo = new IntersectionObserver(function (entries) {
    for (var di = 0; di < entries.length; di++) {
      var e = entries[di];
      if (e.target.id === "calc-form") formInView = e.isIntersecting;
      else if (e.target.id === "r-total") reportFigInView = e.isIntersecting;
    }
    syncDragBarSpace();
  }, { threshold: 0 });
  dragBarIo.observe(el("calc-form"));
  dragBarIo.observe(el("r-total"));
} else {
  function syncDragBarFallback() {
    var formBox = el("calc-form").getBoundingClientRect();
    var figBox = el("r-total").getBoundingClientRect();
    formInView = formBox.bottom > 0 && formBox.top < window.innerHeight;
    reportFigInView = figBox.bottom > 0 && figBox.top < window.innerHeight;
    syncDragBarSpace();
  }
  syncDragBarFallback();
  window.addEventListener("scroll", syncDragBarFallback, { passive: true });
}
window.addEventListener("resize", function () { if (!dragBar.hidden) syncDragBarSpace(); });
dragBarTotal.addEventListener("animationend", function () { dragBarTotal.classList.remove("is-tick"); });
el("drag-bar-report").addEventListener("click", goToReport);
el("calc-form").addEventListener("focusin", function (e) {
  if (dragBar.hidden) return;
  var t = e.target;
  if (!t || !t.getBoundingClientRect) return;
  var box = t.getBoundingClientRect();
  var clear = window.innerHeight - dragBar.offsetHeight;
  if (box.bottom > clear) t.scrollIntoView({ block: "center", behavior: "smooth" });
});

})();
