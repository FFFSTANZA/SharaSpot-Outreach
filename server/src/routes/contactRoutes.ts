import { Router } from "express";
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  bulkUpdateContacts,
  bulkDeleteContacts,
} from "../controllers/contactControllers";
import { createNote, updateNote, deleteNote } from "../controllers/noteControllers";

const router = Router();

router.get("/", getContacts);
router.post("/bulk-update", bulkUpdateContacts);
router.post("/bulk-delete", bulkDeleteContacts);
router.get("/:id", getContactById);
router.post("/", createContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

router.post("/notes", createNote);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

export default router;
