import { Router } from "express";
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  bulkUpdateContacts,
  bulkDeleteContacts,
  exportContacts,
  importContacts,
} from "../controllers/contactControllers";
import { createNote, updateNote, deleteNote } from "../controllers/noteControllers";
import multer from "multer";
import path from "path";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.get("/", getContacts);
router.get("/export", exportContacts);
router.post("/bulk-update", bulkUpdateContacts);
router.post("/bulk-delete", bulkDeleteContacts);
router.get("/:id", getContactById);
router.post("/", createContact);
router.post("/import", upload.single("file"), importContacts);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

router.post("/notes", createNote);
router.put("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

export default router;
