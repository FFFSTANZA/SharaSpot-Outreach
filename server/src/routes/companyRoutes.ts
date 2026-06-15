import { Router } from "express";
import { createCompany, getCompanyById, listCompanies, refreshCompany } from "../controllers/companyControllers";

const router = Router();

router.get("/", listCompanies);
router.post("/", createCompany);
router.get("/:id", getCompanyById);
router.post("/:id/refresh", refreshCompany);

export default router;
