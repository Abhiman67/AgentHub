# AgentHub Design Specification

**Product:** AgentHub  
**Version:** 1.0  
**Audience:** Students, student teams, colleges and campus communities  
**Product type:** Multi-agent AI SaaS platform  
**Primary experience:** A personal AI team for studying, projects, careers and student productivity

## 1. Product vision

AgentHub is a student operating system powered by specialized AI agents. Instead of asking one generic chatbot to do everything, a student creates a focused team: Study Coach, Project Guide, Career Scout, Code Mentor, Writing Buddy and Interview Coach.

The product should feel like a calm, intelligent workspace—not like an intimidating developer tool. It should turn vague student goals into visible next actions while preserving student control over generated work and external actions.

### Core promise

> Your goals in. Momentum out.

### Product principles

1. **Student-first:** Use plain language, practical defaults and affordable pricing.
2. **Progress over perfection:** Always show the next useful action.
3. **Specialized intelligence:** Agents have clear roles and context.
4. **Human control:** Ask for approval before sending, submitting, deleting or sharing anything.
5. **Explainable AI:** Show sources, reasoning summaries and confidence where appropriate.
6. **Academic integrity:** Teach and coach; do not secretly complete assessed work.
7. **Privacy by design:** Students can view, export and delete their profile, memories and files.

## 2. Target users

### Primary user: individual student

- Undergraduate or postgraduate student
- Balancing courses, projects, applications and activities
- Wants personalized support but cannot afford multiple productivity tools
- Uses a laptop and mobile browser
- Needs help organizing work, not just generating text

### Secondary users

- Student project teams
- College clubs and hackathon groups
- Career and placement cells
- Universities purchasing a campus plan

## 3. Information architecture

### Public website

```text
Landing page
├── Agents
├── How it works
├── Student stories
├── Pricing
├── Login
└── Join waitlist / Sign up
```

### Authenticated application

```text
AgentHub workspace
├── Overview
├── My agents
│   ├── Agent directory
│   ├── Agent detail
│   └── Create custom agent
├── Projects
│   ├── All projects
│   ├── Semester workspace
│   └── Project detail
├── Tasks and planner
├── Conversations
├── Files and notes
├── Applications
├── Usage and plan
└── Settings
    ├── Profile
    ├── Memory
    ├── Integrations
    ├── Notifications
    └── Privacy and data
```

## 4. Visual direction

### Personality

Warm, confident, focused, optimistic and slightly editorial. AgentHub should feel more like a thoughtful studio than a generic AI dashboard.

### Layout style

- Generous whitespace
- Large editorial headlines
- Soft off-white page background
- Rounded cards with restrained borders
- Playful agent colors used as functional categories
- Dark navy sections for contrast and focus
- Orange used for action and energy, not decoration everywhere

### Brand language

Use direct, encouraging copy:

- “Build your team”
- “Today’s focus”
- “Make progress”
- “Your next useful step”

Avoid overly technical copy:

- “Initialize autonomous agent orchestration”
- “Large language model execution layer”

## 5. Design tokens

### Colors

| Token | Value | Use |
|---|---|---|
| Ink | `#17202A` | Primary text, dark buttons |
| Navy | `#26394D` | Dark sections, active workspace panels |
| Muted | `#6F777F` | Secondary text |
| Paper | `#F7F5F0` | Main page background |
| Card | `#FFFDF9` | Cards and elevated surfaces |
| Line | `#E6E1D7` | Borders and dividers |
| Orange | `#FF7048` | Primary brand action, emphasis |
| Yellow | `#F4D35E` | Study Coach category |
| Sky | `#9BD8E5` | Project Guide category |
| Green | `#B7DCB2` | Career Scout category |
| Lavender | `#EAD9F2` | Writing Buddy category |
| Peach | `#FFD2B4` | Code Mentor category |
| Periwinkle | `#D6D4F7` | Interview Coach category |

### Typography

Use a system sans-serif stack for the initial build:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

| Element | Size | Weight | Tracking |
|---|---:|---:|---:|
| Hero heading | 64–84px | 850 | -0.075em |
| Section heading | 42–58px | 800 | -0.065em |
| Page heading | 28–36px | 800 | -0.06em |
| Card heading | 18–22px | 750 | -0.04em |
| Body large | 18px | 400 | Normal |
| Body | 14–16px | 400 | Normal |
| Label | 11–13px | 750 | 0.04–0.1em |

### Spacing and shape

- Base spacing unit: 4px
- Standard page width: 1160px
- Mobile page padding: 14–20px
- Desktop page padding: 40px
- Card radius: 16–20px
- Large panel radius: 24–28px
- Pill radius: 999px
- Standard control height: 44px
- Compact control height: 36px

## 6. Public website screens

### 6.1 Landing page

#### Header

- AgentHub logo and wordmark on the left
- Navigation: Agents, Dashboard preview, How it works, Pricing
- Sign in button on the right
- Sticky on desktop after scrolling
- Collapses to logo plus menu icon on mobile

#### Hero

Headline:

> Meet the team behind your next big win.

Supporting text:

> AgentHub gives every student a personal team of AI agents to study smarter, build better projects, and find their next opportunity.

Primary action: **Build your team**  
Secondary action: **Meet the agents**

The right side displays a stylized dashboard preview with a workspace sidebar, progress cards and agent activity.

#### Agent grid

Display six agents in a 3-column desktop grid and 1-column mobile list:

1. Study Coach
2. Project Guide
3. Career Scout
4. Writing Buddy
5. Code Mentor
6. Interview Coach

Each card contains an icon, title, one-sentence description and category color.

#### How it works

Three steps:

1. Tell AgentHub where you want to go.
2. Choose and configure your AI team.
3. Let the work compound through daily progress.

#### Student proof

Use one short testimonial and four outcome metrics. Metrics should be clearly marked as illustrative until real product analytics are available.

#### Pricing

Plans:

| Plan | Intended user | Key limits |
|---|---|---|
| Starter | Curious students | 2 agents, limited conversations |
| Student Pro | Active students | Unlimited agents, project and career tools |
| Campus | Clubs and colleges | Shared spaces, analytics and admin controls |

#### CTA and footer

Final CTA: “Build the student life you wish you had.”  
Footer links: Privacy, Terms, Contact, Status and Accessibility.

### 6.2 Login and onboarding

Login should support:

- Email and password
- Google sign-in
- Password reset
- Clear link to create an account

After signup, onboarding collects:

1. Name and education level
2. Course, semester and subjects
3. Current goals
4. Skills and interests
5. Available study hours
6. Initial agents to add

Onboarding should be skippable, but the product should explain that better context produces better help.

## 7. Authenticated app screens

### 7.1 Overview dashboard

The dashboard is the student’s daily home.

#### Layout

- Left sidebar navigation
- Top bar with search, notifications and profile menu
- Main greeting and date
- Progress summary cards
- Today’s focus list
- Recent agent activity
- Upcoming deadlines

#### Dashboard cards

- Study streak
- Project completion
- Career applications
- Weekly focus hours
- Tasks completed
- Agent usage

Each card should link to the relevant detailed view.

### 7.2 Agent directory

The directory displays all available agents as cards with:

- Role
- Short description
- Current status
- Number of conversations
- Last active time
- Open button
- Configure button

Filter options:

- Academic
- Projects
- Career
- Productivity
- Custom

### 7.3 Agent detail and chat

#### Chat layout

```text
Agent profile panel | Conversation area | Optional context panel
```

The agent profile panel shows:

- Agent name and icon
- Role description
- Capabilities
- Connected files and projects
- Memory controls

The conversation area includes:

- Streaming messages
- Markdown rendering
- Code blocks
- Sources and citations
- Suggested follow-up prompts
- Tool activity cards
- Approval cards

The context panel includes:

- Attached files
- Active project
- Current goals
- Tasks created by the agent

#### Approval card example

```text
Career Scout wants to create a draft email to Priya Sharma.

[View draft] [Approve] [Edit] [Deny]
```

Never hide external actions inside an AI response.

### 7.4 Projects workspace

Projects are containers for context and collaboration.

Each project can include:

- Description and objectives
- Members
- Milestones
- Tasks
- Files
- Linked agents
- Conversation history
- Activity timeline

Example project types:

- Major project
- Semester subject
- Hackathon
- Internship search
- Exam preparation

### 7.5 Planner and tasks

Provide three views:

- Today
- Week
- Calendar

Task properties:

- Title
- Due date
- Priority
- Project
- Assigned agent
- Estimated time
- Completion state

Agents may suggest tasks, but the student must approve tasks that affect the schedule.

### 7.6 Files and notes

Supported files initially:

- PDF
- DOCX
- TXT
- Markdown

File actions:

- Preview
- Ask questions
- Summarize
- Generate flashcards
- Add to project
- Remove

Display file processing status clearly: Uploading, Processing, Ready or Failed.

### 7.7 Career center

Career Scout should include:

- Resume upload and review
- Target job role
- Skill gap analysis
- Saved opportunities
- Application tracker
- Cover-letter generation
- Interview practice

Application states:

```text
Saved → Preparing → Applied → Interviewing → Offer / Rejected
```

### 7.8 Usage and plan

Show:

- Current plan
- Conversations used
- File processing usage
- Agent usage by type
- Next renewal date
- Upgrade or downgrade action

Usage language should be transparent. Avoid surprise costs.

### 7.9 Settings and privacy

Settings include:

- Profile
- Agent defaults
- Notification preferences
- Connected integrations
- Memory review and deletion
- Export all data
- Delete account

Students should be able to see which agents can access which files and projects.

## 8. Agent capability design

### Study Coach

Inputs: subjects, notes, exam date, available time  
Outputs: study plan, explanations, quizzes, flashcards and progress review

### Project Guide

Inputs: project idea, requirements, technology choices and deadlines  
Outputs: scope, milestones, architecture suggestions, documentation and viva questions

### Career Scout

Inputs: resume, skills, preferences and target roles  
Outputs: recommendations, skill gaps, application drafts and interview preparation

### Writing Buddy

Inputs: draft, audience, tone and purpose  
Outputs: improved structure, clarity, grammar and professional communication

### Code Mentor

Inputs: code, error, language and learning goal  
Outputs: explanations, hints, test cases and debugging guidance

### Interview Coach

Inputs: target role, resume and interview type  
Outputs: questions, follow-up questions, evaluation and practice feedback

## 9. Interaction patterns

### Empty states

Every empty state should answer:

1. What is empty?
2. Why does it matter?
3. What can I do next?

Example:

> No projects yet. Add your major project and Project Guide will turn it into a milestone plan.

### Loading states

Use human language:

- “Reading your notes…”
- “Finding the important concepts…”
- “Building your first study plan…”

Avoid generic “Loading…” for long AI operations.

### Error states

Show:

- What failed
- Whether student data is safe
- Retry action
- Alternative action

Example:

> We couldn’t process this PDF. Your file is still stored safely. Try another file or upload a text version.

### Notifications

Notification categories:

- Deadline reminders
- Agent task completion
- Approval requests
- Weekly progress review
- Application updates

Students can disable each category independently.

## 10. Responsive behavior

### Desktop: 1024px and above

- Persistent sidebar in the application
- Three-column agent and pricing grids
- Two-column hero sections
- Context panel visible in chat

### Tablet: 768–1023px

- Collapsible sidebar
- Two-column grids
- Hero stacks when space is limited
- Context panel becomes a drawer

### Mobile: below 768px

- Bottom navigation for Overview, Agents, Projects and Profile
- One-column cards
- Chat context as a bottom sheet
- Full-width primary buttons
- No horizontal scrolling
- Dashboard cards become a vertical feed

## 11. Accessibility requirements

- WCAG 2.2 AA target
- Keyboard-accessible navigation and chat actions
- Visible focus states
- Minimum 4.5:1 text contrast
- Do not use color alone for agent categories or status
- Proper labels for form inputs
- Screen-reader labels for icon-only buttons
- Respect reduced-motion preferences
- Captions and transcripts for voice features
- Confirm destructive actions

## 12. Trust, safety and academic integrity

### Agent action permissions

Require approval for:

- Sending messages or emails
- Submitting applications
- Creating calendar events
- Sharing files
- Editing or deleting files
- Running code outside a safe sandbox

### Academic integrity rules

- Provide hints and explanations before full solutions
- Mark generated content clearly
- Encourage citations and sources
- Do not help with live examinations
- Offer originality and plagiarism checks
- Keep an activity history for generated academic content

### Data protection

- Encrypt data in transit and at rest
- Store secrets server-side, never in client code
- Use per-user authorization on every record
- Scan uploaded files
- Limit file size and type
- Allow export and deletion
- Do not use student data for model training without consent

## 13. Suggested data model

```text
users
profiles
agents
agent_memories
conversations
messages
projects
project_members
tasks
files
file_chunks
tool_permissions
agent_runs
notifications
subscriptions
usage_events
```

Important relationships:

```text
User → owns → Agents
User → belongs to → Projects
Agent → participates in → Conversations
Conversation → contains → Messages
Project → contains → Tasks and Files
File → creates → Embeddings
Agent Run → records → Tool Approvals and Usage Events
```

## 14. Technical implementation direction

### Recommended stack

- Frontend: Next.js, TypeScript and Tailwind CSS
- UI components: shadcn/ui or an internal component library
- API: FastAPI or NestJS
- Database: PostgreSQL
- Semantic search: pgvector
- Authentication: Clerk, Auth.js or Supabase Auth
- File storage: S3-compatible object storage
- Queue: Redis with BullMQ or Celery
- Realtime: Server-Sent Events or WebSockets
- AI provider: OpenAI or Gemini abstraction
- Deployment: Vercel plus Railway, Render or Fly.io

### Service boundaries

```text
Web app
├── Auth service
├── User/profile service
├── Agent orchestration service
├── Conversation service
├── File and retrieval service
├── Task and notification service
├── Billing service
└── Admin service
```

## 15. MVP definition

The first release should include:

1. Authentication
2. Student onboarding
3. Three agents: Study Coach, Project Guide and Career Scout
4. Streaming chat
5. PDF and text upload
6. Project workspace
7. Basic task planner
8. Approval cards
9. Usage limits
10. Responsive web interface

Do not include in the first release:

- Arbitrary computer control
- Automatic email sending
- Dozens of integrations
- Real-time multiplayer editing
- University-wide administration
- Complex autonomous routines

## 16. Success metrics

Track product outcomes, not only AI usage:

- Percentage of users completing onboarding
- First agent created
- First useful conversation
- First project created
- Weekly active students
- Tasks completed after agent recommendation
- Study plan completion rate
- Resume improvement actions completed
- Seven-day and thirty-day retention
- Student-reported usefulness
- Number of unsafe or rejected agent actions

## 17. Voice and copy examples

### Welcome

> Good morning, Aarav. You have one important thing to finish today.

### Study Coach

> I turned your Data Mining notes into a 45-minute revision session. Want to start with the concepts you missed last time?

### Project Guide

> Your scope is getting wide. I found three features we can move to phase two so your MVP stays achievable.

### Career Scout

> I found four internships that match your skills. Two have a deadline this week.

### Approval

> I drafted the email, but I won’t send it until you approve the final version.

## 18. Design QA checklist

- Is the next action obvious on every screen?
- Can the user tell which agent is active?
- Are AI-generated facts and sources distinguishable?
- Does every external action require approval?
- Are empty, loading and error states designed?
- Does the interface work at 320px width?
- Can a keyboard-only user complete the main flow?
- Can a student export and delete personal data?
- Are usage limits visible before a request is made?
- Are all claims and metrics real, sourced or clearly marked as illustrative?
