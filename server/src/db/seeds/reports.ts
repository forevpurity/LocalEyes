import { eq, inArray } from "drizzle-orm";
import { getCoveringDepartment } from "../../common/geo.js";
import { createNotificationRows } from "../../features/notifications/notify.js";
import { db } from "../client.js";
import { comments } from "../schema/comments.js";
import { notifications } from "../schema/notifications.js";
import { reports, type ReportStatus } from "../schema/reports.js";
import { subscriptions } from "../schema/subscriptions.js";
import { votes } from "../schema/votes.js";
import type { SeedDepartment, SeedDepartmentName } from "./departments.js";
import type { SeedRng } from "./lib/rng.js";
import type { SeedUser } from "./users.js";

const DAY = 86_400_000;

const statusDays: [ReportStatus, number][] = [
  ...[2, 4, 6, 8, 10, 34, 41, 48, 55, 70].map((day) => ["submitted", day] as [ReportStatus, number]),
  ...[5, 23, 34, 44, 55, 65, 75].map((day) => ["acknowledged", day] as [ReportStatus, number]),
  ...[2, 12, 22, 28, 34, 42, 51, 58].map((day) => ["in_progress", day] as [ReportStatus, number]),
  ...[2, 7, 12, 18, 24, 28, 29, 40].map((day) => ["resolved", day] as [ReportStatus, number]),
  ...[33, 38, 42, 46, 50].map((day) => ["closed", day] as [ReportStatus, number]),
  ...[15, 65, 80].map((day) => ["rejected", day] as [ReportStatus, number]),
  ...[20, 58, 72].map((day) => ["withdrawn", day] as [ReportStatus, number]),
];

const content: Record<string, { titles: string[]; description: string }> = {
  Pothole: { titles: ["Deep pothole near intersection", "Road surface damaged", "Large pothole in traffic lane"], description: "The damaged road surface is hazardous for motorbikes and needs repair." },
  Graffiti: { titles: ["Graffiti on public wall", "Paint damage at pedestrian lane", "Graffiti beside the park"], description: "Fresh graffiti is covering a public surface and should be cleaned." },
  "Broken streetlight": { titles: ["Streetlight not working", "Dark pedestrian crossing", "Damaged streetlight fixture"], description: "The streetlight stays off after dark and reduces visibility for residents." },
  Trash: { titles: ["Trash accumulating on pavement", "Overflowing roadside waste", "Illegal dumping near homes"], description: "Uncollected waste is obstructing the pavement and creating an unpleasant smell." },
  Flooding: { titles: ["Flooding after heavy rain", "Blocked drain causing standing water", "Water collecting across roadway"], description: "Standing water is blocking safe passage and suggests the nearby drain is blocked." },
};

const addresses: Record<SeedDepartmentName | "Unassigned", readonly string[]> = {
  "District 1": ["123 Nguyễn Huệ, District 1", "42 Lê Lợi, District 1", "88 Đồng Khởi, District 1"],
  "District 3": ["18 Võ Văn Tần, District 3", "91 Nguyễn Đình Chiểu, District 3", "35 Tú Xương, District 3"],
  "District 4": ["55 Hoàng Diệu, District 4", "27 Khánh Hội, District 4", "80 Tôn Đản, District 4"],
  "Bình Thạnh": ["104 Xô Viết Nghệ Tĩnh, Bình Thạnh", "66 Điện Biên Phủ, Bình Thạnh", "21 Nguyễn Xí, Bình Thạnh"],
  "Phú Nhuận": ["39 Phan Xích Long, Phú Nhuận", "12 Nguyễn Văn Trỗi, Phú Nhuận", "74 Huỳnh Văn Bánh, Phú Nhuận"],
  Unassigned: ["Near Nguyễn Văn Cừ Bridge, HCM City", "Along Trần Hưng Đạo, HCM City", "Near Ông Lãnh Bridge, HCM City"],
};

const transitionNotes: Record<Exclude<ReportStatus, "submitted">, string> = {
  acknowledged: "The report has been reviewed and acknowledged.",
  in_progress: "A maintenance team has started work at the location.",
  resolved: "The reported condition has been repaired and checked.",
  closed: "The completed work has been verified and the report is closed.",
  rejected: "The report could not be verified at the supplied location.",
  withdrawn: "The citizen withdrew this report because it is no longer needed.",
};

const discussionBodies = [
  "This is still causing delays during the evening rush.",
  "I passed this location today and can confirm the report.",
  "Thank you for reporting this. The location has been added to our inspection route.",
  "The condition becomes worse after rain, especially near the curb.",
];

export interface SeedReport {
  id: string;
  title: string;
  status: ReportStatus;
  categoryName: string;
  address: string | null;
  departmentId: string | null;
  departmentName: SeedDepartmentName | null;
  citizenId: string;
  createdAt: Date;
  lastEventAt: Date;
  isHidden: boolean;
  isLocked: boolean;
  intendedUnassigned: boolean;
}

function pointInside(department: SeedDepartment, index: number) {
  const [west, south, east, north] = department.bounds;
  const x = 0.22 + (index % 4) * 0.17;
  const y = 0.25 + (Math.floor(index / 4) % 3) * 0.22;
  return { lng: west + (east - west) * x, lat: south + (north - south) * y };
}

function statusTrail(status: ReportStatus): ReportStatus[] {
  if (status === "submitted") return [];
  if (status === "rejected" || status === "withdrawn") return [status];
  const path: ReportStatus[] = ["acknowledged", "in_progress", "resolved", "closed"];
  return path.slice(0, path.indexOf(status) + 1);
}

function discussionCount(index: number) {
  if (index < 4) return [2, 3, 4, 2][index]!;
  return index % 3 === 0 ? 1 + (index % 4) : 0;
}

async function createSeedNotifications(params: {
  recipientIds: string[]; actorId?: string; reportId: string; eventTime: Date;
  template: Parameters<typeof createNotificationRows>[1]["template"];
}) {
  const rows = await createNotificationRows(db, params);
  if (!rows.length) return;
  await db.update(notifications).set({
    createdAt: params.eventTime,
    readAt: Date.now() - params.eventTime.getTime() > 3 * DAY ? params.eventTime : null,
  }).where(inArray(notifications.id, rows.map((row) => row.id)));
}

export async function seedReports(params: {
  now: Date; rng: SeedRng; departments: SeedDepartment[];
  categoryRows: { id: string; name: string }[]; userRows: SeedUser[];
}) {
  const { now, rng, departments, categoryRows, userRows } = params;
  const categoriesByName = new Map(categoryRows.map((item) => [item.name, item.id]));
  const citizens = userRows.filter((user) => user.role === "citizen");
  const staff = userRows.filter((user) => user.role === "staff");
  const admin = userRows.find((user) => user.role === "admin")!;
  const bannedCitizen = citizens.find((citizen) => citizen.bannedAt)!;
  const activeDepartments = departments.filter((department) => department.isActive);
  const districtOne = activeDepartments.find((department) => department.name === "District 1")!;
  const phuNhuan = departments.find((department) => department.name === "Phú Nhuận")!;
  const heroWatchers = citizens.slice(0, 2);
  const seeded: SeedReport[] = [];

  for (let index = 0; index < statusDays.length; index++) {
    const [status, ageDays] = statusDays[index]!;
    const intendedUnassigned = index < 5;
    const isPhuNhuan = (status === "closed" && ageDays === 50) || (status === "rejected" && ageDays === 80) || (status === "withdrawn" && ageDays === 72);
    const department = isPhuNhuan
      ? phuNhuan
      : intendedUnassigned
        ? null
        : index === 6
          ? districtOne
          : activeDepartments[(index - 5 + activeDepartments.length) % activeDepartments.length]!;
    const location = intendedUnassigned
      ? { lng: 106.682 + index * 0.0013, lat: 10.769 + (index % 2) * 0.006 }
      : pointInside(department!, index);
    const covering = isPhuNhuan ? null : await getCoveringDepartment(location.lat, location.lng);
    if (!intendedUnassigned && !isPhuNhuan && !covering?.department) {
      throw new Error(`Routing failed for intended ${department!.name} report at ${location.lat},${location.lng}`);
    }
    if (intendedUnassigned && covering?.department) {
      throw new Error(`Gap report unexpectedly routed to ${covering.department.name}`);
    }
    const assignedDepartmentId = isPhuNhuan ? phuNhuan.id : covering?.department?.id ?? null;
    const allowedCategories = department?.categories ?? categoryRows.map((category) => category.name);
    const categoryName = rng.pick(allowedCategories);
    const categoryContent = content[categoryName]!;
    const owner = index === 20 ? citizens[8]! : citizens[index % citizens.length]!;
    const createdAt = new Date(now.getTime() - ageDays * DAY - (index % 12) * 3_600_000);
    const trail = statusTrail(status);
    const transitionStepHours = ageDays < 30 ? 10 : 24;
    const moderation = index === 11 || index === 22
      ? "locked"
      : index === 29 || index === 36
        ? "hidden"
        : null;
    const addressPool = addresses[department?.name ?? "Unassigned"];
    const address = index === 6 || index === 37 ? null : addressPool[index % addressPool.length]!;
    const [row] = await db.insert(reports).values({
      title: categoryContent.titles[index % categoryContent.titles.length]!,
      description: categoryContent.description,
      location,
      address,
      status,
      categoryId: categoriesByName.get(categoryName)!,
      departmentId: assignedDepartmentId,
      citizenId: owner.id,
      isLocked: moderation === "locked",
      isHidden: moderation === "hidden",
      createdAt,
      updatedAt: createdAt,
    }).returning({ id: reports.id, title: reports.title });
    if (!row) throw new Error("Failed to insert report");

    let lastEventAt = createdAt;
    const recordEvent = (eventTime: Date) => {
      if (eventTime > lastEventAt) lastEventAt = eventTime;
    };

    const watcherIds = (index % 2 === 0 || index === 17 || index === 25) && owner.id !== heroWatchers[0]!.id
      ? heroWatchers.filter((watcher) => watcher.id !== owner.id).map((watcher) => watcher.id)
      : [];
    const subscriberIds = [owner.id, ...watcherIds];
    const subscriptionRows = subscriberIds.map((citizenId, subscriptionIndex) => ({
      reportId: row.id, citizenId, createdAt: new Date(createdAt.getTime() + subscriptionIndex * 60_000),
    }));
    await db.insert(subscriptions).values(subscriptionRows);
    subscriptionRows.forEach(({ createdAt: eventTime }) => recordEvent(eventTime));

    const votingEndsAt = new Date(createdAt.getTime() + 5 * 3_600_000);
    const voterPool = rng.shuffle(citizens.filter((citizen) => (
      citizen.id !== owner.id && (!citizen.bannedAt || citizen.bannedAt > votingEndsAt)
    )));
    const voteCount = index < 4 ? 6 + index : index % 5 === 0 ? 0 : index % 4;
    if (voteCount) {
      const voteRows = voterPool.slice(0, voteCount).map((citizen, voteIndex) => ({
        reportId: row.id, citizenId: citizen.id,
        createdAt: new Date(createdAt.getTime() + (voteIndex + 1) * 30 * 60_000),
      }));
      await db.insert(votes).values(voteRows);
      voteRows.forEach(({ createdAt: eventTime }) => recordEvent(eventTime));
    }

    const count = discussionCount(index);
    const transitionSpanHours = trail.length * transitionStepHours;
    const timeline = [
      ...trail.map((nextStatus, step) => ({
        kind: "status" as const,
        nextStatus,
        eventTime: new Date(createdAt.getTime() + (step + 1) * transitionStepHours * 3_600_000),
      })),
      ...Array.from({ length: count }, (_, discussionIndex) => {
        const offsetHours = transitionSpanHours > 0
          ? ((discussionIndex + 0.5) / count) * transitionSpanHours + 5 / 60
          : (discussionIndex + 1) * 2;
        return {
          kind: "discussion" as const,
          discussionIndex,
          eventTime: new Date(createdAt.getTime() + offsetHours * 3_600_000),
        };
      }),
    ].sort((left, right) => left.eventTime.getTime() - right.eventTime.getTime());

    for (const event of timeline) {
      const { eventTime } = event;
      recordEvent(eventTime);

      if (event.kind === "discussion") {
        const { discussionIndex } = event;
        const useBannedCitizen = discussionIndex === 0 && (index === 6 || index === 9 || index === 12);
        const scopedStaff = assignedDepartmentId
          ? staff.find((candidate) => candidate.departmentId === assignedDepartmentId)
          : undefined;
        const eligibleCitizens = citizens.filter((citizen) => !citizen.bannedAt || citizen.bannedAt > eventTime);
        const discussionAuthor = useBannedCitizen
          ? bannedCitizen
          : scopedStaff && (index + discussionIndex) % 5 === 0
            ? scopedStaff
            : eligibleCitizens[(index + discussionIndex + 3) % eligibleCitizens.length]!;
        const isHidden = discussionIndex === 0 && (index === 9 || index === 18);
        await db.insert(comments).values({
          reportId: row.id, authorId: discussionAuthor.id,
          body: discussionBodies[(index + discussionIndex) % discussionBodies.length]!, type: "discussion",
          isEdited: discussionIndex === 0 && (index === 3 || index === 12), isHidden,
          createdAt: eventTime, updatedAt: eventTime,
        });
        if (!isHidden) {
          await createSeedNotifications({
            recipientIds: subscriberIds, actorId: discussionAuthor.id, reportId: row.id, eventTime,
            template: { type: "new_comment", reportTitle: row.title, authorName: discussionAuthor.displayName },
          });
        }
        continue;
      }

      const { nextStatus } = event;
      const author = nextStatus === "withdrawn"
        ? owner
        : assignedDepartmentId
          ? staff.find((candidate) => candidate.departmentId === assignedDepartmentId)!
          : admin;
      await db.insert(comments).values({
        reportId: row.id, authorId: author.id, body: transitionNotes[nextStatus as Exclude<ReportStatus, "submitted">],
        type: "status_note", newStatus: nextStatus, createdAt: eventTime, updatedAt: eventTime,
      });
      await createSeedNotifications({
        recipientIds: subscriberIds, actorId: author.id, reportId: row.id, eventTime,
        template: { type: "status_change", reportTitle: row.title, newStatus: nextStatus },
      });
    }

    if (moderation) {
      const moderationAt = new Date(lastEventAt.getTime() + 3_600_000);
      recordEvent(moderationAt);
      await createSeedNotifications({
        recipientIds: moderation === "locked" ? subscriberIds : [owner.id],
        reportId: row.id, eventTime: moderationAt,
        template: { type: moderation === "locked" ? "report_locked" : "report_hidden", reportTitle: row.title },
      });
    }

    await db.update(reports).set({ updatedAt: lastEventAt }).where(eq(reports.id, row.id));

    seeded.push({
      ...row, status, categoryName, address, departmentId: assignedDepartmentId,
      departmentName: department?.name ?? null, citizenId: owner.id, createdAt, lastEventAt,
      isHidden: moderation === "hidden", isLocked: moderation === "locked", intendedUnassigned,
    });
  }

  const signalReports = seeded
    .filter((report) => report.departmentId && report.departmentName !== "Phú Nhuận" && now.getTime() - report.createdAt.getTime() < 3 * DAY)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 2);
  if (signalReports.length !== 2) throw new Error("Expected two recent assigned reports for queue signals");
  for (const report of signalReports) {
    const department = departments.find((item) => item.id === report.departmentId)!;
    const recipients = staff.filter((member) => member.departmentId === department.id).map((member) => member.id);
    await createSeedNotifications({
      recipientIds: recipients, reportId: report.id, eventTime: report.createdAt,
      template: { type: "new_report", reportTitle: report.title, departmentName: department.name },
    });
  }
  return seeded;
}
