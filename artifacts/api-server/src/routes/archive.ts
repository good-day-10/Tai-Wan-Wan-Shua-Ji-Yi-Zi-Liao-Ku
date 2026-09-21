import { and, eq } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, archiveTable } from "@workspace/db";
import {
  GetArchiveResponse,
  SaveArchiveBody,
  SaveArchiveResponse,
  UnlockEditorBody,
} from "@workspace/api-zod";

const router: IRouter = Router();
const ARCHIVE_ID = "main";
const EDITOR_PASSWORD = process.env.ARCHIVE_EDITOR_PASSWORD;
const OWNER_EMAIL = process.env.ARCHIVE_OWNER_EMAIL?.trim().toLowerCase();
const EDITOR_COOKIE = "archive_editor_access";
const EDITOR_COOKIE_MAX_AGE = 60 * 60 * 1000;

function requireSignedIn(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

function hasEditorAccess(req: Request): boolean {
  const { userId } = getAuth(req);
  return Boolean(userId && req.signedCookies?.[EDITOR_COOKIE] === userId);
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
    version: archive.updatedAt.toISOString(),
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

router.get("/editor/status", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  res.json({
    authenticated: Boolean(userId),
    owner: await isOwner(req),
  });
});

router.post("/editor/unlock", requireSignedIn, async (req, res): Promise<void> => {
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

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.cookie(EDITOR_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: EDITOR_COOKIE_MAX_AGE,
    path: "/",
  });
  res.json({ unlocked: true });
});

router.put("/archive", requireSignedIn, async (req, res): Promise<void> => {
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
    .select({ updatedAt: archiveTable.updatedAt })
    .from(archiveTable)
    .where(eq(archiveTable.id, ARCHIVE_ID))
    .limit(1);

  if (current && !expectedVersion) {
    res.status(409).json({ error: "Archive version is required; reload before saving" });
    return;
  }

  if (current && expectedVersion) {
    const expectedDate = new Date(expectedVersion);
    if (Number.isNaN(expectedDate.getTime())) {
      res.status(400).json({ error: "Invalid archive version" });
      return;
    }

    const [updated] = await db
      .update(archiveTable)
      .set({
        introduction: archive.introduction,
        memories: archive.memories,
        siteContent: archive.siteContent ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(archiveTable.id, ARCHIVE_ID), eq(archiveTable.updatedAt, expectedDate)))
      .returning();

    if (!updated) {
      res.status(409).json({ error: "Archive was changed by another editor; reload before saving" });
      return;
    }

    res.json(SaveArchiveResponse.parse({
      version: updated.updatedAt.toISOString(),
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
    version: inserted.updatedAt.toISOString(),
    introduction: inserted.introduction,
    memories: inserted.memories,
    siteContent: inserted.siteContent ?? undefined,
  }));
});

export default router;