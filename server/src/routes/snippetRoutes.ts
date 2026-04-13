import { Router } from "express";
import {
  createSnippet,
  getSnippets,
  updateSnippet,
  deleteSnippet,
} from "../controllers/snippetControllers";

const router = Router();

router.post("/", createSnippet);
router.get("/", getSnippets);
router.put("/:id", updateSnippet);
router.delete("/:id", deleteSnippet);

export default router;
