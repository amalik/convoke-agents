---
step: 3
workflow: user-interview
title: Plan Participant Recruitment
---

# Step 3: Plan Participant Recruitment

The most perfectly designed interview script is worthless if you talk to the wrong people. This step ensures you recruit participants who can actually give you the insights you need.

## Why This Matters

Recruitment is the most underestimated part of user research. Common mistakes:
- Talking only to enthusiastic early adopters (survivorship bias)
- Recruiting friends and colleagues who tell you what you want to hear
- Getting participants who don't match your target user at all
- Not recruiting enough people to see patterns
- Spending weeks recruiting when you could start in days

## Your Task

Define your recruitment plan:

### 1. Define Your Screening Criteria

Who should you talk to? Be specific about must-have criteria and nice-to-have criteria.

**Must-have criteria** (participant is disqualified without these):
- What behavior or experience must they have?
- What timeframe matters? (e.g., "used the product in the last 30 days")
- What role, responsibility, or context must they be in?

**Nice-to-have criteria** (for diversity, not disqualification):
- Range of company sizes
- Mix of experience levels
- Different geographic regions
- Different tools or workflows

**Exclusion criteria** (who should you NOT talk to):
- Competitors or people in your industry who would be biased
- People with a financial relationship to your company
- Friends, family, or close colleagues

### 2. Determine Sample Size and Composition

**How many participants do you need?**

| Research Goal | Recommended Sample |
|---------------|-------------------|
| Exploratory discovery | 5-8 participants |
| Hypothesis validation | 8-12 participants |
| Comparative (two segments) | 5-6 per segment |
| Usability testing | 3-5 participants |

**Aim for diversity within your criteria.** If all 8 participants have the same background, you'll get one perspective eight times instead of eight perspectives once.

### 3. Choose Recruitment Channels

Where will you find these people?

| Channel | Best For | Lead Time | Cost |
|---------|----------|-----------|------|
| Existing user base (email/in-app) | Current user research | 3-5 days | Free |
| Social media / communities | Broad discovery research | 5-10 days | Free |
| Professional networks (LinkedIn) | B2B research | 5-7 days | Free |
| Recruitment panels (UserTesting, Respondent) | Fast turnaround, specific criteria | 1-3 days | $50-150/participant |
| Customer support tickets | Users with specific problems | 2-4 days | Free |
| Referral from other participants | Hard-to-reach segments | Ongoing | Free |

### 4. Write Your Screening Survey

Create 3-5 screening questions to qualify participants before scheduling.

**Example screening survey:**
> 1. What is your role? [Open text]
> 2. How many people are on your team? [1-5 / 6-20 / 21-50 / 50+]
> 3. Which project management tools do you currently use? [Checklist]
> 4. When did you last evaluate a new project management tool? [Last month / Last 3 months / Last 6 months / More than 6 months ago / Never]
> 5. Would you be available for a 30-45 minute video call in the next 2 weeks? [Yes / No]

**Screening logic:** Disqualify anyone who answers [specific disqualifying answers]. Prioritize anyone who answers [ideal answers].

Open the survey with one line saying what the answers are used for and when they are deleted -- section 7 below sets two dates, one if they are not selected and a later one if they are; give both -- and ask for agreement to that.

### 5. Plan Incentives

Incentives increase response rates and show respect for participants' time.

| Participant Type | Suggested Incentive |
|-----------------|---------------------|
| General consumers | $25-50 gift card |
| Professionals (B2B) | $75-150 gift card |
| Senior executives / hard-to-reach | $150-300 gift card |
| Existing happy customers | Sometimes free; product credit works |
| Internal stakeholders | No incentive needed |

**Alternatives to cash incentives:**
- Donation to a charity of their choice
- Early access to a new feature
- Free subscription extension
- Co-creation credit (name in release notes)

### 6. Create Your Recruitment Timeline

**Example timeline:**
- Day 1-2: Post screening survey, send outreach messages
- Day 3-5: Review responses, qualify participants, schedule interviews
- Day 5-10: Conduct interviews (2-3 per day maximum to avoid fatigue)
- Day 10-12: Follow-up interviews if needed

**Important:** Never schedule more than 3 interviews in a single day. Interview fatigue degrades your listening quality after the third session.

### 7. Decide How Participant Data Will Be Handled

Recruiting and interviewing people means you will hold personal data: contact details, screening answers, recordings, and quotes. Decide four things now, before the first outreach message, because each one changes what you can truthfully tell participants and what you may write down afterwards.

| Decision | Why it matters | A default to start from |
|----------|----------------|-------------------------|
| **What you collect, and who sees it** | Every detail you hold is one you have to protect and later delete, and "who sees it" includes the tools you use. | Take notes only, unless you need the recording. Ask only the screening questions that change who qualifies. Name the people and the tools that will see what you collect. |
| **On what basis** | Whether you may collect it at all depends on rules you did not write: your organization's privacy policy, the law that applies to you and to the participant, a client contract. | Ask whoever owns privacy or legal in your organization before you recruit; if no one does, the question is yours to answer. Either way, get each participant's explicit agreement and keep a record of it. Whether that agreement is enough on its own is their call or yours, not this workflow's. |
| **How long you keep it** | Recordings and contact lists outlive the research unless someone sets a date. | Delete the answers of people you do not select once scheduling is settled. Delete recordings, raw notes, screening answers, contact details, and the ID-to-person list once synthesis is done, the withdrawal cut-off has passed, and incentives are paid. Pick the date now. |
| **How someone withdraws** | A participant who changes their mind needs a way to say so, and you need to be able to find everything they told you. | Give every participant a contact and a cut-off date, and tell them both. The day you first share the findings is a good cut-off. Until then, treat your findings and the report as drafts: do not share them, commit them, or build other artifacts on them. Keep one list that maps participant IDs to people so you can find one person's data. |

These defaults fit ordinary product research with adults who are free to say no. If the topic is one people could be harmed by having disclosed, or your participants are minors, people who report to you, or anyone else who cannot easily refuse, do not rely on them: settle the basis with your privacy or legal owner first, or slow down and get advice if you have none.

**Keep identities out of this conversation and out of the research artifacts.** Refer to participants as P1, P2, P3 from your first note onward. Names, email addresses, employers, and the ID-to-person list stay out of this conversation and outside `{output_folder}`: everything you type here is sent to the AI model you are running it with, and to its provider unless you host the model yourself, and the report is read by your team and is often committed to version control.

This is research practice, not legal advice, and none of it makes a study compliant with any particular law. The decisions are yours and your organization's. The report template has a section that records them, so the next reader knows what participants were promised.

## Example

**Screening Criteria:**
- MUST: Small business owner (1-10 employees)
- MUST: Currently uses spreadsheets for project tracking
- MUST: Evaluated at least one PM tool in the last 6 months but did not adopt it
- NICE-TO-HAVE: Mix of industries (not all tech)
- NICE-TO-HAVE: Mix of team sizes within 1-10 range
- EXCLUDE: Anyone who works for a PM tool company

**Sample:** 8 participants

**Channels:**
- Primary: LinkedIn outreach to small business owner groups (free)
- Secondary: Respondent.io panel with screening criteria ($100/participant)
- Backup: Referrals from first 3 participants

**Incentive:** $75 Amazon gift card

**Timeline:** 10 days total (3 days recruiting, 7 days interviewing)

**Participant data:**
- Collect: the three must-have screening answers and an email address for scheduling. Notes only, no recording.
- Who sees it: the two researchers, and the survey and scheduling tools. Notes go through our AI assistant with names removed.
- Basis: confirmed with our privacy lead; explicit agreement given on the screening form and again at the start of the call
- Keep: answers from people we do not select deleted when scheduling closes; raw notes, contact details, and the ID list deleted by March 31. The report is kept, with no names in it
- Withdraw: reply to the scheduling email before March 1, when the report is finalized. The ID-to-person list lives in the research team's access-restricted drive, not in this project

---

## Your Turn

Please define your recruitment plan using the structure above, and fill in the bracketed parts of your script's opening.

**Tip:** Start recruiting as soon as your plan is final, participant-data decisions included. Recruitment always takes longer than you think, so do not let the plan sit.

## Next Step

When your recruitment plan is ready, I'll load:

{project-root}/_bmad/bme/_vortex/workflows/user-interview/steps/step-04-conduct.md
