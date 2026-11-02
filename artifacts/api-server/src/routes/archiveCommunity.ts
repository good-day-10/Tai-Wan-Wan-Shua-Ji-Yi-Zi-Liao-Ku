import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { and, asc, eq, sql } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  AddMemoryResonanceBody, AddMemoryResonanceResponse, ApproveMemoryContributionBody,
  GetMemoryResonanceResponse, GetPendingMemoryContributionsResponse,
  RejectMemoryContributionResponse, RequestArchiveImageUploadUrlBody,
  RequestArchiveImageUploadUrlResponse, SubmitMemoryContributionBody,
  SubmitMemoryContributionResponse,
} from "@workspace/api-zod";
import { archiveReactionsTable, archiveSubmissionsTable, archiveTable, db } from "@workspace/db";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const editorCookie = "archive_editor_access";

async function requireActiveSession(req: Request, res: Response, next: NextFunction) {
  const { userId, sessionId } = getAuth(req);
  if (!userId || !sessionId) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const session = await clerkClient.sessions.getSession(sessionId);
    if (session.userId !== userId || session.status !== "active") { res.status(401).json({ error: "Authentication required" }); return; }
  } catch { res.status(503).json({ error: "Unable to verify authentication" }); return; }
  next();
}

function editorAllowed(req: Request) {
  const { userId, sessionId } = getAuth(req);
  return Boolean(userId && sessionId && req.signedCookies?.[editorCookie] === `${userId}:${sessionId}`);
}

router.get("/archive/resonance", async (_req, res) => {
  const rows = await db.select({
    memoryId: archiveReactionsTable.memoryId,
    count: sql<number>`count(*)::int`,
  }).from(archiveReactionsTable).groupBy(archiveReactionsTable.memoryId);
  res.json(GetMemoryResonanceResponse.parse(rows));
});

router.post("/archive/resonance/:memoryId", async (req, res) => {
  const parsed = AddMemoryResonanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid reaction" }); return; }
  const [archive] = await db.select({ memories: archiveTable.memories }).from(archiveTable).where(eq(archiveTable.id, "main")).limit(1);
  const memories = Array.isArray(archive?.memories) ? archive.memories as Array<{ id?: string }> : [];
  if (!memories.some((memory) => memory.id === req.params.memoryId)) { res.status(404).json({ error: "Memory not found" }); return; }
  const [inserted] = await db.insert(archiveReactionsTable).values({ memoryId: req.params.memoryId, visitorId: parsed.data.visitorId }).onConflictDoNothing().returning();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(archiveReactionsTable).where(eq(archiveReactionsTable.memoryId, req.params.memoryId));
  res.json(AddMemoryResonanceResponse.parse({ memoryId: req.params.memoryId, count: row?.count ?? 0, alreadyReacted: !inserted }));
});

router.post("/archive/submissions", async (req, res) => {
  const parsed = SubmitMemoryContributionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "請檢查標題、分類、年代與故事內容。" }); return; }
  const id = randomUUID();
  await db.insert(archiveSubmissionsTable).values({ id, ...parsed.data, status: "pending" });
  res.status(201).json(SubmitMemoryContributionResponse.parse({ id, status: "pending" }));
});

router.get("/archive/submissions", async (req, res) => {
  if (!editorAllowed(req)) { res.status(401).json({ error: "Editor access required" }); return; }
  const rows = await db.select().from(archiveSubmissionsTable).where(eq(archiveSubmissionsTable.status, "pending")).orderBy(asc(archiveSubmissionsTable.createdAt));
  res.json(GetPendingMemoryContributionsResponse.parse(rows));
});

router.post("/archive/submissions/:submissionId/approve", requireActiveSession, async (req, res) => {
  if (!editorAllowed(req)) { res.status(401).json({ error: "Editor access required" }); return; }
  const parsed = ApproveMemoryContributionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Archive version is required" }); return; }
  const submissionId = Array.isArray(req.params.submissionId) ? req.params.submissionId[0] : req.params.submissionId;
  const [submission] = await db.select().from(archiveSubmissionsTable).where(and(eq(archiveSubmissionsTable.id, submissionId), eq(archiveSubmissionsTable.status, "pending"))).limit(1);
  const [archive] = await db.select().from(archiveTable).where(eq(archiveTable.id, "main")).limit(1);
  if (!submission || !archive) { res.status(404).json({ error: "Contribution or archive not found" }); return; }
  if (archive.revision !== parsed.data.expectedVersion) { res.status(409).json({ error: "Archive changed; reload before approving" }); return; }
  const memories = Array.isArray(archive.memories) ? archive.memories as Array<Record<string, unknown>> : [];
  const nextId = String(Math.max(0, ...memories.map((m) => Number.parseInt(String(m.id), 10) || 0)) + 1).padStart(2, "0");
  const story = submission.story;
  const updatedMemories = [...memories, {
    id: nextId, title: submission.title, location: "地點待補", era: submission.era,
    category: submission.category, storyteller: "讀者投稿", excerpt: story.slice(0, 100),
    story, color: "#a97945", mark: "投稿",
    ...(submission.imagePath ? { image: `/api/storage${submission.imagePath}` } : {}),
  }];
  const [updated] = await db.update(archiveTable).set({
    memories: updatedMemories, revision: sql<number>`${archiveTable.revision} + 1`, updatedAt: new Date(),
  }).where(and(eq(archiveTable.id, "main"), eq(archiveTable.revision, parsed.data.expectedVersion))).returning();
  if (!updated) { res.status(409).json({ error: "Archive changed; reload before approving" }); return; }
  await db.update(archiveSubmissionsTable).set({ status: "approved" }).where(eq(archiveSubmissionsTable.id, submission.id));
  res.json({ version: updated.revision, introduction: updated.introduction, memories: updated.memories, siteContent: updated.siteContent ?? undefined });
});

router.post("/archive/submissions/:submissionId/reject", requireActiveSession, async (req, res) => {
  if (!editorAllowed(req)) { res.status(401).json({ error: "Editor access required" }); return; }
  const submissionId = Array.isArray(req.params.submissionId) ? req.params.submissionId[0] : req.params.submissionId;
  const [rejected] = await db.update(archiveSubmissionsTable).set({ status: "rejected" }).where(and(eq(archiveSubmissionsTable.id, submissionId), eq(archiveSubmissionsTable.status, "pending"))).returning({ id: archiveSubmissionsTable.id });
  if (!rejected) { res.status(404).json({ error: "Contribution not found" }); return; }
  res.json(RejectMemoryContributionResponse.parse({ id: rejected.id, status: "rejected" }));
});

router.post("/storage/uploads/request-url", requireActiveSession, async (req, res) => {
  const parsed = RequestArchiveImageUploadUrlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid image metadata" }); return; }
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    res.json(RequestArchiveImageUploadUrlResponse.parse({ uploadURL, objectPath: storage.normalizeObjectEntityPath(uploadURL) }));
  } catch (error) {
    req.log.error({ err: error }, "Could not generate archive image upload URL");
    res.status(500).json({ error: "Image upload is temporarily unavailable" });
  }
});

router.get("/storage/objects/*path", async (req, res) => {
  try {
    const raw = req.params.path;
    const objectPath = `/objects/${Array.isArray(raw) ? raw.join("/") : raw}`;
    const response = await storage.downloadObject(await storage.getObjectEntityFile(objectPath));
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    else res.end();
  } catch (error) {
    if (error instanceof ObjectNotFoundError) { res.status(404).json({ error: "Object not found" }); return; }
    req.log.error({ err: error }, "Could not serve archive image");
    res.status(500).json({ error: "Image is temporarily unavailable" });
  }
});

export default router;
