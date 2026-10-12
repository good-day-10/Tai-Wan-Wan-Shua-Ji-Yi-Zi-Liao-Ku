import { Router, type IRouter } from "express";

const router: IRouter = Router();

function isClerkTestInstance(): boolean {
  return process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") === true
    && process.env.CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") === true;
}

router.get("/archive/integration-test-safety", (_req, res): void => {
  if (!isClerkTestInstance()) {
    res.status(503).json({ error: "Archive integration tests require a Clerk test instance" });
    return;
  }

  res.status(204).end();
});

export default router;
