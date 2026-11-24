# Supplier Drag Calculator

A free, open-source calculator for the hidden cost of working with your suppliers.

Most teams know what their suppliers charge. Far fewer know what it costs to manage them: the status calls, the briefing, the chasing, checking what comes back, the rework and the waiting. This calculator adds those up from your own figures and shows where the time and money could be going.

It is free to use, now and always. The version in this repository runs entirely in your browser. It does not send or store anything you type, and it makes no network requests (the links on the page only open web pages if you click them).

Made by [AgentAnvil](https://www.agentanvil.co.uk). A hosted version lives at https://www.agentanvil.co.uk/supplier-calculator/

## What is in this folder

| File | What it does |
| --- | --- |
| `index.html` | The calculator page |
| `calculator.js` | All the sums, the form and the report (plain JavaScript, no dependencies) |
| `calculator.css` | Calculator layout and print styles |
| `styles.css` | Base styles, colours and fonts |
| `assets/fonts/` | Poppins font files (woff2) |
| `assets/img/` | AgentAnvil mark and favicon |
| `LICENSE` | MIT licence (plus the trade marks note) |
| `assets/fonts/OFL.txt` | SIL Open Font License 1.1 for the Poppins fonts |

There is no build step, no framework and no package to install.

## How to use it

1. Download or clone this folder.
2. Open `index.html` in any modern browser. That is it; it works offline from a local file.
3. Pick an example starting point (smaller firm, mid-sized firm or large organisation), then replace the figures with your own.
4. Choose **Show my report**. Use **Print or save as PDF** to keep a copy.

### Host it anywhere

Because it is just static files, you can host it on any static web host or internal intranet server. Upload the whole folder and point people at `index.html`.

## How to embed it

Host the folder somewhere, then add an iframe to your page:

```html
<iframe
  src="https://your-site.example/supplier-drag-calculator/index.html"
  title="Supplier Drag Calculator"
  width="100%"
  height="1200"
  style="border:0; max-width:100%;"
  loading="lazy"></iframe>
```

The report is long, so give the iframe a generous height, or link to the calculator in a new tab instead. If your site sends a `frame-ancestors` or `X-Frame-Options` header, make sure it allows the page you are embedding into.

## How the maths works

Every figure comes from the numbers you type in, plus a handful of assumptions that are shown on the page and can all be changed. Here is what the code in `calculator.js` (the `calc()` and `meetingCost()` functions) does, in plain English.

### Your inputs

- **Your supplier work:** how many suppliers, how many projects you send out a year, the average project value, and the loaded hourly cost of the people who manage suppliers.
- **Supplier calls:** either the meeting builder (who is on a typical call, by role, their pay per hour, call length, calls per week, weeks a year and prep time), or a simple version (calls per live project per week, call length, people on the call, prep time).
- **Briefing, chasing and checking:** hours per project for each.
- **Speed:** how long a project really takes, how long it ought to take, and what one project running one week late costs you.
- **Rework:** how many projects need reworking, your staff hours per rework, and any extra money spent per rework (as a share of project value).

### The sums

1. **Calls.** In the meeting builder, the cost of one call is each person's hourly pay, plus an on-cost uplift (30 per cent by default, for employer costs), times the call length, plus the prep and write-up time priced at the average loaded rate of the people on the call. Calls a year = calls per week times weeks a year (46 by default, to allow for holidays). In the simple version, calls = projects times calls per week times weeks per project, priced at your loaded hourly cost.
2. **Briefing, chasing and checking.** Projects a year times the hours per project for all three, priced at your loaded hourly cost.
3. **Rework.** Projects that need rework times staff hours per rework, priced at your hourly cost, plus the extra money per rework as a share of project value.
4. **Delay.** For each project, the weeks it takes beyond how long it ought to take (never below zero), times your cost of one project-week late.

### What counts as drag

Not all call or admin time is waste. Some of it is the job. So the calculator only counts part of it as avoidable:

- **Avoidable share of calls and prep:** 35 per cent by default.
- **Avoidable share of briefing, chasing and checking:** 40 per cent by default.
- **Rework and delay** are counted in full, since they would not happen if the work landed right first time.

**Yearly drag** = avoidable calls + avoidable admin + rework + delay. A **cautious total** leaves delay out, because delay is the hardest figure to pin down. Hours are turned into working days (7.5 hours a day by default) and full-time people (1,650 productive hours a year by default).

### What could change

The report also shows a range for what better ways of working could cut. It takes the share of your supplier work you think could change (50 per cent by default) and applies a low case and a high case cut to the drag on that work (15 and 40 per cent by default). These defaults are placeholders, not evidence. Change them to your own view. There is also an optional per-job platform cost placeholder, set to zero by default, which is taken off the range if you fill it in.

The **levers** section reruns the sums with one change at a time (for example halving the number of status calls, or finishing projects two weeks sooner) and ranks which change could make the biggest difference for your figures.

### Where the default pay rates come from

The meeting builder starts with UK median hourly pay by occupation group from the Office for National Statistics Annual Survey of Hours and Earnings (2026 provisional, Table 2.5a). The exact table and links are in `calculator.js` (the `ASHE` object). Pay figures do not include employer costs, which is why the on-cost uplift is added. The supplier's own people are not counted anywhere, which keeps the result on the cautious side.

Contains public sector information from the Office for National Statistics, licensed under the Open Government Licence v3.0.

## Please read: these are estimates

Everything the calculator shows is an illustrative estimate worked out from your own inputs and the assumptions on the page. It is not a quote, a forecast or advice, and your real figures will differ. Any saving it shows is something that could happen, never a promise. Outcomes could vary a great deal from one organisation to another. Use your own judgement and take professional advice before making decisions based on it.

## Contributing

Ideas, fixes and improvements are very welcome.

- **Keep it simple.** Plain HTML, CSS and JavaScript, no build step and no dependencies, so it keeps working from a local file.
- **Keep it private.** No network requests, analytics, cookies or storage. Figures must stay in the browser.
- **Keep the assumptions visible.** Any new assumption should appear on the page with a plain explanation and be changeable.
- **Keep the wording careful.** Savings are always a "could". Please use UK spelling.
- **Check before you send a change.** Open `index.html` from a local file and on a phone-sized screen, try each example starting point, and print the report.

Open an issue to discuss a bigger change first. By contributing, you confirm you have the right to submit your contribution and agree it is licensed under the MIT licence in this repository.

## Licence

The code is released under the MIT licence (see `LICENSE`). Copyright (c) 2026 AgentAnvil Ltd.

The Poppins font files in assets/fonts/ are licensed separately under the SIL Open Font License 1.1 (see assets/fonts/OFL.txt). They are not covered by the MIT licence.

## Trade marks

Trade marks: The AgentAnvil name, the AgentAnvil logo and mark (assets/img/), and the tagline "Trust, but escrow" are trade marks of AgentAnvil Ltd and are not licensed under the MIT licence. You may use the name to say truthfully that your version is based on this project. If you publish a modified version, please remove or replace the logo and do not present your version as made or endorsed by AgentAnvil.

## Credit

Made by AgentAnvil, www.agentanvil.co.uk. Trust, but escrow.

If you use or adapt it, a link back to https://www.agentanvil.co.uk is appreciated but not required.
