# User interview guide: how PMs & founders handle app reviews today

**Purpose:** validate (or kill) the core assumption behind ReviewRadar — that PMs and
founders at consumer apps have a real, costly problem reading and prioritizing from
Play Store reviews. Run before trusting any roadmap decision on this product.

**Who to talk to:** PMs or founders at a consumer app with real end users and a
non-trivial review volume (roughly 50+ reviews/week is a reasonable floor — below that,
the problem this tool solves may not bite yet).

**Format:** 30 minutes, 1:1, recorded with permission. Ask for a screen-share if they're
willing to show their actual current process live — behavior shown beats behavior
described.

## Ground rules for the interviewer

- Ask "how do you currently..." not "would you use a tool that...". We're after current
  behavior, not hypothetical reactions to our idea.
- Don't mention ReviewRadar or describe the product until after question 10, if at all.
  Mentioning it early anchors every later answer toward politely agreeing with you.
- When they say something vague ("it's fine, I guess"), push once for a concrete
  example: "Can you walk me through the last time that happened?"
- Silence is fine. Let them fill it.

## Questions

1. Walk me through your role and what you're responsible for day-to-day.
2. When's the last time you looked at your app's Play Store or App Store reviews? What
   prompted you to look?
3. Walk me through what you actually do when you open your reviews — where do you look,
   what do you read, how long do you spend?
4. How do you currently decide what to build next? What inputs go into that decision?
5. Tell me about a recent time a review (or a pattern across several reviews) changed
   what you or your team worked on. What happened?
6. Tell me about a time you felt like you were missing something important in your
   reviews, or found out about a problem later than you wish you had.
7. Who else on your team looks at reviews, if anyone? How does what they find get back
   to you?
8. What tools, spreadsheets, or processes — if any — do you use today to track or
   summarize review themes over time?
9. If you had to explain to your manager or a stakeholder why you're prioritizing one
   fix over another, what evidence would you point to?
10. What's the most frustrating or time-consuming part of dealing with user feedback in
    general (not just reviews — support tickets, social media, anything)?

**Optional follow-ups if time allows:**
- How do you currently score or rank competing feature ideas, if at all? (Listen for
  RICE, ICE, or anything structured vs. pure gut-feel — don't name RICE yourself.)
- Has anyone on your team ever tried to use an LLM to summarize reviews? What happened?

## Notes-synthesis template

Fill this out within 24 hours of the interview, while it's fresh. One doc per
interview; roll up patterns across interviews separately (don't synthesize prematurely
from a single conversation).

```markdown
## Interview: [name/role/company], [date]

### Context
- App category, rough DAU/review volume, team size:
- Recorded? Screen-shared their actual workflow?

### Current behavior (verbatim quotes where possible)
- How often do they actually look at reviews, and why then specifically?
- What does "looking at reviews" concretely consist of (scrolling the Play Console?
  a spreadsheet? nothing)?
- What tools/process exists today, if any?

### Pain points observed (not asked-for wishlist items — what they actually struggle with)
-
-

### Decision-making evidence
- What do they currently point to when justifying a roadmap call?
- Did RICE/ICE/any framework come up unprompted?

### Surprises
- Anything that contradicted what we expected going in?

### Strength of signal
- [ ] Strong: described a specific, recent, costly instance of this problem unprompted
- [ ] Moderate: agrees the problem exists but couldn't point to a recent concrete cost
- [ ] Weak: doesn't really experience this as a problem today

### Quotable quote
> "..."
```

## After 6-8 interviews

Roll up across all notes docs and look for:
- The same pain point named independently by 3+ people in their own words (not primed).
- Whether "strength of signal" skews Strong or Weak overall — if most are Weak, the
  core premise needs revisiting before investing further in this product.
- Any recurring reason people *don't* read reviews today (not just "don't have time" —
  dig into whether it's a tooling gap, a trust gap, or genuinely not valuable to them).

Feed the rollup into [`docs/case-study.md`](case-study.md)'s Research/Insight sections —
with real quotes, not paraphrases, and leave `[TODO: real number]` wherever a claim needs
a number the interviews didn't actually produce.
