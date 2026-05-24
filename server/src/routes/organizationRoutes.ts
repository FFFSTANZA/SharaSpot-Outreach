import { Router } from "express";
import {
  getOrganizations,
  getCurrentOrganization,
  createOrganization,
  updateOrganization,
  switchOrganization,
  inviteMember,
  listPendingInvites,
  revokeInvite,
  acceptInvite,
  getInvitePreview,
  removeMember,
  updateMemberRole,
  leaveOrganization,
  deleteOrganization,
} from "../controllers/organizationControllers";

const router = Router();

router.get("/", getOrganizations);
router.get("/current", getCurrentOrganization);
router.post("/", createOrganization);
router.patch("/current", updateOrganization);
router.post("/switch", switchOrganization);

router.post("/current/invite", inviteMember);
router.get("/current/invites", listPendingInvites);
router.delete("/current/invites/:inviteId", revokeInvite);
router.delete("/current/members/:memberId", removeMember);
router.patch("/current/members/:memberId", updateMemberRole);
router.post("/current/leave", leaveOrganization);
router.delete("/current", deleteOrganization);
router.post("/invites/accept", acceptInvite);

export default router;

export const publicOrganizationInviteRouter = Router();
publicOrganizationInviteRouter.get("/:token", getInvitePreview);
