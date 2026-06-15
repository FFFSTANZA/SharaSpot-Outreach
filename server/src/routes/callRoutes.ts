import { Router } from "express";
import { createCallTask, getCallQueue, logCall, submitCallDisposition, updateCallTask } from "../controllers/callControllers";
import { requireCallingWorkspaceEnabled } from "../middlewares/callingWorkspaceMiddleware";
import { createCallTaskSchema, getCallQueueSchema, logCallSchema, submitDispositionSchema, updateCallTaskSchema } from "../validation/calls";

const router = Router();

const validateBody = (schema: any) => (req: any, res: any, next: any) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: parsed.error.issues.map((i: any) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  req.body = parsed.data;
  next();
};

const validateQuery = (schema: any) => (req: any, res: any, next: any) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Validation failed",
      issues: parsed.error.issues.map((i: any) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  Object.assign(req.query, parsed.data);
  next();
};

router.use(requireCallingWorkspaceEnabled);

router.get("/queue", validateQuery(getCallQueueSchema), getCallQueue);
router.post("/tasks", validateBody(createCallTaskSchema), createCallTask);
router.patch("/tasks/:id", validateBody(updateCallTaskSchema), updateCallTask);
router.post("/log", validateBody(logCallSchema), logCall);
router.post("/disposition", validateBody(submitDispositionSchema), submitCallDisposition);

export default router;
