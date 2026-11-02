import { and, eq, sql } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, archiveTable } from "@workspace/db";
import {
  GetArchiveResponse,
  MigrateArchiveCopyBody,
  MigrateArchiveCopyResponse,
  SaveArchiveBody,
  SaveArchiveResponse,
  UnlockEditorBody,
} from "@workspace/api-zod";
import integrationTestSafetyRouter from "./archiveIntegrationTestSafety";

const router: IRouter = Router();
const ARCHIVE_ID = "main";
const COPY_ARCHIVE_ID = "memory-archive-copy";
const COPY_MIGRATION_MARKER_ID = "ws.migration";
const COPY_MIGRATION_VERSION = "wonder-scouts-2026-10";
const EDITOR_PASSWORD = process.env.ARCHIVE_EDITOR_PASSWORD;
const OWNER_EMAIL = process.env.ARCHIVE_OWNER_EMAIL?.trim().toLowerCase();
const EDITOR_COOKIE = "archive_editor_access";
const COPY_EDITOR_COOKIE = "archive_copy_editor_access";
const EDITOR_COOKIE_MAX_AGE = 60 * 60 * 1000;

function hasCopyMigrationMarker(siteContent: unknown): boolean {
  if (!siteContent || typeof siteContent !== "object") return false;
  const blocks = (siteContent as { blocks?: unknown }).blocks;
  return Array.isArray(blocks)
    && blocks.some((block) => (
      Boolean(block)
      && typeof block === "object"
      && "id" in block
      && block.id === COPY_MIGRATION_MARKER_ID
    ));
}

function shouldSimulateClerkSessionLookupFailure(req: Request): boolean {
  return process.env.NODE_ENV !== "production"
    && process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") === true
    && req.get("x-archive-test-clerk-session-lookup") === "fail";
}

async function requireActiveClerkSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId, sessionId } = getAuth(req);
  if (!userId || !sessionId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    if (shouldSimulateClerkSessionLookupFailure(req)) {
      throw new Error("Simulated Clerk session lookup failure");
    }
    const session = await clerkClient.sessions.getSession(sessionId);
    if (session.userId !== userId || session.status !== "active") {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
  } catch {
    res.status(503).json({ error: "Unable to verify authentication" });
    return;
  }

  next();
}

router.use(integrationTestSafetyRouter);

function getEditorSessionIdentity(req: Request): string | undefined {
  const { userId, sessionId } = getAuth(req);
  return userId && sessionId ? `${userId}:${sessionId}` : undefined;
}

function hasEditorAccess(req: Request): boolean {
  const sessionIdentity = getEditorSessionIdentity(req);
  return Boolean(sessionIdentity && req.signedCookies?.[EDITOR_COOKIE] === sessionIdentity);
}

function hasCopyEditorAccess(req: Request): boolean {
  const sessionIdentity = getEditorSessionIdentity(req);
  return Boolean(sessionIdentity && req.signedCookies?.[COPY_EDITOR_COOKIE] === sessionIdentity);
}

async function isOwner(req: Request): Promise<boolean> {
  const { userId } = getAuth(req);
  if (!userId || !OWNER_EMAIL) return false;

  try {
    const user = await clerkClient.users.getUser(userId);
    return user.primaryEmailAddress?.emailAddress.trim().toLowerCase() === OWNER_EMAIL;
  } catch {
    return false;
  }
}

router.get("/archive", async (_req, res): Promise<void> => {
  const [archive] = await db
    .select()
    .from(archiveTable)
    .where(eq(archiveTable.id, ARCHIVE_ID))
    .limit(1);

  if (!archive) {
    res.status(404).json({ error: "Archive has not been saved yet" });
    return;
  }

  const parsed = GetArchiveResponse.safeParse({
    version: archive.revision,
    introduction: archive.introduction,
    memories: archive.memories,
    siteContent: archive.siteContent ?? undefined,
  });
  if (!parsed.success) {
    res.status(500).json({ error: "Saved archive data is invalid" });
    return;
  }

  res.json(parsed.data);
});

router.get("/archive-copy", async (_req, res): Promise<void> => {
  let [archive] = await db
    .select()
    .from(archiveTable)
    .where(eq(archiveTable.id, COPY_ARCHIVE_ID))
    .limit(1);

  if (!archive) {
    await db.execute(sql`
      INSERT INTO ${archiveTable} (id, introduction, memories, site_content, revision)
      SELECT ${COPY_ARCHIVE_ID}, source.introduction, source.memories, source.site_content, 1
        FROM ${archiveTable} AS source
       WHERE source.id = ${ARCHIVE_ID}
      ON CONFLICT (id) DO NOTHING
    `);

    [archive] = await db
      .select()
      .from(archiveTable)
      .where(eq(archiveTable.id, COPY_ARCHIVE_ID))
      .limit(1);
  }

  if (!archive) {
    res.status(404).json({ error: "Source archive has not been saved yet" });
    return;
  }

  const parsed = GetArchiveResponse.safeParse({
    version: archive.revision,
    introduction: archive.introduction,
    memories: archive.memories,
    siteContent: archive.siteContent ?? undefined,
  });
  if (!parsed.success) {
    res.status(500).json({ error: "Saved archive data is invalid" });
    return;
  }

  res.json(parsed.data);
});

router.post("/archive-copy/migrate", requireActiveClerkSession, async (req, res): Promise<void> => {
  if (!hasCopyEditorAccess(req)) {
    res.status(401).json({ error: "Editor access required" });
    return;
  }

  const parsed = MigrateArchiveCopyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { archive, expectedVersion } = parsed.data;
  if (
    !archive.siteContent?.blocks.some(
      (block) => block.id === COPY_MIGRATION_MARKER_ID && block.html === COPY_MIGRATION_VERSION,
    )
  ) {
    res.status(400).json({ error: "Migration marker is missing or invalid" });
    return;
  }

  const [current] = await db
    .select()
    .from(archiveTable)
    .where(eq(archiveTable.id, COPY_ARCHIVE_ID))
    .limit(1);

  if (!current) {
    res.status(409).json({ error: "Archive copy is not initialized; reload before migrating" });
    return;
  }

  const currentResponse = () => MigrateArchiveCopyResponse.parse({
    version: current.revision,
    introduction: current.introduction,
    memories: current.memories,
    siteContent: current.siteContent ?? undefined,
  });

  if (hasCopyMigrationMarker(current.siteContent)) {
    res.json(currentResponse());
    return;
  }

  if (expectedVersion !== 1 || current.revision !== 1) {
    res.status(409).json({ error: "Archive copy has changed; migration was not applied" });
    return;
  }

  const [updated] = await db
    .update(archiveTable)
    .set({
      introduction: archive.introduction,
      memories: archive.memories,
      siteContent: archive.siteContent ?? null,
      revision: sql<number>`${archiveTable.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(archiveTable.id, COPY_ARCHIVE_ID),
      eq(archiveTable.revision, expectedVersion),
      sql`NOT (COALESCE(${archiveTable.siteContent}->'blocks', '[]'::jsonb) @> ${JSON.stringify([{ id: COPY_MIGRATION_MARKER_ID }])}::jsonb)`,
    ))
    .returning();

  if (!updated) {
    const [latest] = await db
      .select()
      .from(archiveTable)
      .where(eq(archiveTable.id, COPY_ARCHIVE_ID))
      .limit(1);
    if (latest && hasCopyMigrationMarker(latest.siteContent)) {
      res.json(MigrateArchiveCopyResponse.parse({
        version: latest.revision,
        introduction: latest.introduction,
        memories: latest.memories,
        siteContent: latest.siteContent,
      }));
      return;
    }
    res.status(409).json({ error: "Archive copy has changed; migration was not applied" });
    return;
  }

  res.json(MigrateArchiveCopyResponse.parse({
    version: updated.revision,
    introduction: updated.introduction,
    memories: updated.memories,
    siteContent: updated.siteContent ?? undefined,
  }));
});

router.get("/editor/status", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  res.json({
    authenticated: Boolean(userId),
    owner: await isOwner(req),
  });
});

router.get("/editor-copy/status", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  res.json({
    authenticated: Boolean(userId),
    owner: await isOwner(req),
  });
});

router.post("/editor/unlock", requireActiveClerkSession, async (req, res): Promise<void> => {
  const owner = await isOwner(req);
  if (!owner) {
    const parsed = UnlockEditorBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid editor credentials" });
      return;
    }
    if (!EDITOR_PASSWORD) {
      res.status(503).json({ error: "Editor access is not configured" });
      return;
    }
    if (parsed.data.editorPassword !== EDITOR_PASSWORD) {
      res.status(401).json({ error: "Invalid editor credentials" });
      return;
    }
  }

  const sessionIdentity = getEditorSessionIdentity(req);
  if (!sessionIdentity) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.cookie(EDITOR_COOKIE, sessionIdentity, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: EDITOR_COOKIE_MAX_AGE,
    path: "/",
  });
  res.json({ unlocked: true });
});

router.post("/editor-copy/unlock", requireActiveClerkSession, async (req, res): Promise<void> => {
  const owner = await isOwner(req);
  if (!owner) {
    const parsed = UnlockEditorBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid editor credentials" });
      return;
    }
    if (!EDITOR_PASSWORD) {
      res.status(503).json({ error: "Editor access is not configured" });
      return;
    }
    if (parsed.data.editorPassword !== EDITOR_PASSWORD) {
      res.status(401).json({ error: "Invalid editor credentials" });
      return;
    }
  }

  const sessionIdentity = getEditorSessionIdentity(req);
  if (!sessionIdentity) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.cookie(COPY_EDITOR_COOKIE, sessionIdentity, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: EDITOR_COOKIE_MAX_AGE,
    path: "/",
  });
  res.json({ unlocked: true });
});

router.put("/archive", requireActiveClerkSession, async (req, res): Promise<void> => {
  if (!hasEditorAccess(req)) {
    res.status(401).json({ error: "Editor access required" });
    return;
  }

  const parsed = SaveArchiveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { archive, expectedVersion } = parsed.data;
  const [current] = await db
    .select({ revision: archiveTable.revision })
    .from(archiveTable)
    .where(eq(archiveTable.id, ARCHIVE_ID))
    .limit(1);

  if (current && expectedVersion === undefined) {
    res.status(409).json({ error: "Archive version is required; reload before saving" });
    return;
  }

  if (current && expectedVersion !== undefined) {
    const [updated] = await db
      .update(archiveTable)
      .set({
        introduction: archive.introduction,
        memories: archive.memories,
        siteContent: archive.siteContent ?? null,
        revision: sql<number>`${archiveTable.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(archiveTable.id, ARCHIVE_ID), eq(archiveTable.revision, expectedVersion)))
      .returning();

    if (!updated) {
      res.status(409).json({ error: "Archive was changed by another editor; reload before saving" });
      return;
    }

    res.json(SaveArchiveResponse.parse({
      version: updated.revision,
      introduction: updated.introduction,
      memories: updated.memories,
      siteContent: updated.siteContent ?? undefined,
    }));
    return;
  }

  const [inserted] = await db
    .insert(archiveTable)
    .values({
      id: ARCHIVE_ID,
      introduction: archive.introduction,
      memories: archive.memories,
      siteContent: archive.siteContent ?? null,
    })
    .onConflictDoNothing({ target: archiveTable.id })
    .returning();

  if (!inserted) {
    res.status(409).json({ error: "Archive was changed by another editor; reload before saving" });
    return;
  }

  res.json(SaveArchiveResponse.parse({
    version: inserted.revision,
    introduction: inserted.introduction,
    memories: inserted.memories,
    siteContent: inserted.siteContent ?? undefined,
  }));
});

router.put("/archive-copy", requireActiveClerkSession, async (req, res): Promise<void> => {
  if (!hasCopyEditorAccess(req)) {
    res.status(401).json({ error: "Editor access required" });
    return;
  }

  const parsed = SaveArchiveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { archive, expectedVersion } = parsed.data;
  const [current] = await db
    .select({ revision: archiveTable.revision })
    .from(archiveTable)
    .where(eq(archiveTable.id, COPY_ARCHIVE_ID))
    .limit(1);

  if (!current) {
    res.status(409).json({ error: "Archive copy is not initialized; reload before saving" });
    return;
  }
  if (expectedVersion === undefined) {
    res.status(409).json({ error: "Archive version is required; reload before saving" });
    return;
  }

  const [updated] = await db
    .update(archiveTable)
    .set({
      introduction: archive.introduction,
      memories: archive.memories,
      siteContent: archive.siteContent ?? null,
      revision: sql<number>`${archiveTable.revision} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(archiveTable.id, COPY_ARCHIVE_ID), eq(archiveTable.revision, expectedVersion)))
    .returning();

  if (!updated) {
    res.status(409).json({ error: "Archive was changed by another editor; reload before saving" });
    return;
  }

  res.json(SaveArchiveResponse.parse({
    version: updated.revision,
    introduction: updated.introduction,
    memories: updated.memories,
    siteContent: updated.siteContent ?? undefined,
  }));
});

export default router;