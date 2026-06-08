# LocalEyes

HCM City civic issue reporting platform. Citizens report problems (potholes, broken lights, graffiti), Staff at responsible departments receive and resolve them.

## Language

### Actors

**Citizen**:
A person who registers, browses the public map, submits reports, votes, and comments.
_Avoid_: user, reporter

**Staff**:
A person assigned to a Department who views that Department's reports, updates their status, and hides comments or locks reports. Created by Admin only. A Staff member's Department is set at creation and cannot be changed.
_Avoid_: worker, agent, resolver

**Admin**:
A person who manages users, Departments, Categories, and site-wide settings. Can hide, lock, delete any content, ban users, export data, and view system analytics. Has a separate Admin panel.
_Avoid_: superuser, manager

### Reports

**Report**:
The core entity. A Citizen submits a Report about a problem at a pinned map location with at least one photo, a text address (reverse-geocoded from the pin, nullable if geocoding fails), one Category, a title, and a description.
_Avoid_: issue, ticket, problem (use "report" consistently)

**Report Status**:
The lifecycle state of a Report. Transitions: `submitted → acknowledged → in_progress → resolved → closed`. A Report can also go from `submitted → rejected`. `closed` and `rejected` are terminal. Reports are never reopened — a recurring problem is a new Report.

**Category**:
A type of problem (e.g. pothole, graffiti, broken streetlight). Categories can be assigned to one or more Departments via a join table. When creating a Report, only Categories of the Department that covers the pinned location are shown. If the pin is outside all Department polygons (Unassigned), all Categories are shown. Admin has full CRUD over Categories. Removing a Category from a Department is forward-only — it does not affect existing Reports. A Category cannot be deleted while any Report or Department references it — Admin must reassign or remove those references first. The FK constraints on `reports.category_id` and `department_categories.category_id` enforce this at the DB level (`onDelete: "restrict"`); the app layer checks preemptively with a descriptive `DomainRuleError`.

### Departments

**Department**:
An organisational unit defined by a name, a geographic area (PostGIS polygon), and a set of Categories. Reports pinned inside a Department's polygon are auto-assigned to that Department upon creation. Once assigned, a Report stays with that Department regardless of future polygon changes. Staff belong to exactly one Department. Polygon boundaries must not overlap — Admin enforces this at creation and update time via a map drawing tool. A Department can be deactivated by Admin but is never hard-deleted.

**Forward-Only**:
Changes to a Department are forward-only: they affect future auto-assignment and Category visibility, but never alter existing Reports or Staff assignments.

**Deactivation**:
Setting a Department to `isActive: false`. The Department and all its data remain in the system. Staff in a deactivated Department continue working on existing Reports, but no new Reports are auto-routed to it. Reactivation requires the polygon overlap check to pass. Departments are never hard-deleted.

**Assignment**:
Admin manually assigns an unassigned Report to a Department. The Report's Department is set regardless of geography — Admin override takes precedence. Once assigned, the Report stays with that Department permanently.

**Unassigned Queue**:
Reports pinned at a location that falls outside every Department's polygon, or Reports in a deactivated Department. These have no Department assigned and are visible to Admin for manual Assignment.

### Social

**Vote**:
An upvote on a Report from a Citizen. One vote per Report per Citizen. Affects sort order only — not a workflow trigger.
_Avoid_: like, star, upvote/downvote (upvote only)

**Comment**:
A message in a Report's unified timeline. Comments can be free-form discussion or a note tied to a status change (every status change requires a note).

**Subscription**:
Controls notification delivery. Citizens are auto-subscribed to their own Reports. They can optionally subscribe to (watch) other Reports to receive updates.

**Notification**:
In-app real-time push delivered via Socket.io. Appears as a bell icon indicator. No email for now.

### Moderation

**Hide**:
Removes a Comment or Report from public view. Reversible. Performed by Staff (Department-scoped) and Admin (site-wide).

**Lock**:
Prevents new Comments or Votes on a Report. The Report remains visible. Performed by Staff and Admin.

**Delete**:
Permanently removes content from the database. Admin only.

**Ban**:
Disables a Citizen's account. Their existing Reports remain (anonymised). Admin only.

### Geography

**Coverage Area**:
HCM City (Ho Chi Minh City, Vietnam). All Reports and Department polygons are within this boundary. The map is centred on HCM City by default.

### Data Export

**CSV Export**:
Rows of Reports with key fields (id, title, description, category, status, department, latitude, longitude, created_at, resolved_at). Admin only.

**GeoJSON Export**:
All Reports as GeoJSON Features for re‑import into GIS tools. Admin only.

### Analytics

**System‑wide analytics**:
Admin dashboard showing counts by status, category, and Department; Reports over time (trends); average time to resolve; top-voted Reports.
