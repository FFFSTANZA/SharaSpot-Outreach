import { Router } from "express";
import {
    createList,
    getLists,
    updateList,
    deleteList,
    addContactsToList,
    removeContactsFromList
} from "../controllers/contactListControllers";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createList);
router.get("/", getLists);
router.put("/:id", updateList);
router.delete("/:id", deleteList);
router.post("/:id/contacts", addContactsToList);
router.delete("/:id/contacts", removeContactsFromList);

export default router;
