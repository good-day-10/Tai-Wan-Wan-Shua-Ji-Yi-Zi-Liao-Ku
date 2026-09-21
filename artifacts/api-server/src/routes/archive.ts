import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, archiveTable } from "@workspace/db";
import { GetArchiveResponse, SaveArchiveBody, SaveArchiveResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const ARCHIVE_ID = "main";
const EDITOR_PASSWORD = process.env.ARCHIVE_EDITOR_PASSWORD ?? "00000";

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
    introduction: archive.introduction,
    memories: archive.memories,
  });
  if (!parsed.success) {
    res.status(500).json({ error: "Saved archive data is invalid" });
    return;
  }

  res.json(parsed.data);
});

router.put("/archive", async (req, res): Promise<void> => {
  const parsed = SaveArchiveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.editorPassword !== EDITOR_PASSWORD) {
    res.status(401).json({ error: "Invalid editor password" });
    return;
  }

  const { archive } = parsed.data;
  await db
    .insert(archiveTable)
    .values({
      id: ARCHIVE_ID,
      introduction: archive.introduction,
      memories: archive.memories,
    })
    .onConflictDoUpdate({
      target: archiveTable.id,
      set: {
        introduction: archive.introduction,
        memories: archive.memories,
        updatedAt: new Date(),
      },
    });

  res.json(SaveArchiveResponse.parse(archive));
});

export default router;