import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { signAccessToken } from "../utils/jwt";
import { invalidatePremiumCache } from "../utils/premiumCheck";
import crypto from "crypto";
import { logger } from "../utils/logger";

export const getOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { joinedAt: "desc" },
    });
    const orgs = memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
      createdAt: m.organization.createdAt,
    }));
    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
};

export const getCurrentOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const activeOrgId = req.user?.activeOrganizationId;
    if (!activeOrgId) {
      res.json(null);
      return;
    }

    const org = await prisma.organization.findUnique({
      where: { id: activeOrgId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!org) {
      res.json(null);
      return;
    }

    const membership = org.members.find(m => m.userId === userId);
    if (!membership) {
      res.status(403).json({ message: "Access denied to this organization" });
      return;
    }
    const members = org.members.map(m => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    res.json({
      id: org.id,
      name: org.name,
      ownerId: org.ownerId,
      role: membership.role,
      members,
      createdAt: org.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch organization" });
  }
};

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name } = req.body as { name: string };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ message: "Organization name is required" });
      return;
    }

    const existingOwner = await prisma.organizationMember.findFirst({
      where: { userId, role: "OWNER" },
    });
    if (existingOwner) {
      res.status(400).json({ message: "You already own a workspace. Only one workspace per account is allowed." });
      return;
    }

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: { members: true },
    });

    const member = org.members[0];

    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: org.id },
    });
    await invalidatePremiumCache(userId);

    const newAccessToken = signAccessToken({
      id: userId,
      email: req.user!.email,
      activeOrganizationId: org.id,
    });

    res.status(201).json({
      id: org.id,
      name: org.name,
      ownerId: org.ownerId,
      role: "OWNER",
      accessToken: newAccessToken,
      members: [{
        id: member.id,
        userId,
        name: req.user!.email,
        email: req.user!.email,
        avatarUrl: null,
        role: "OWNER",
        joinedAt: org.createdAt,
      }],
      createdAt: org.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create organization" });
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    const { name } = req.body as { name?: string };

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      res.status(403).json({ message: "Only admins can update the organization" });
      return;
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: name ? { name: name.trim() } : {},
    });

    res.json({ id: org.id, name: org.name });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update organization" });
  }
};

export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { organizationId } = req.body as { organizationId: string };

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });

    if (!membership) {
      res.status(403).json({ message: "You are not a member of this organization" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
    });
    await invalidatePremiumCache(userId);

    const newAccessToken = signAccessToken({
      id: userId,
      email: req.user!.email,
      activeOrganizationId: organizationId,
    });

    res.json({ activeOrganizationId: organizationId, accessToken: newAccessToken });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to switch organization" });
  }
};

const MAX_TEAM_MEMBERS = 5;
const INVITE_TTL_DAYS = 7;
const prismaAny = prisma as any;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

const buildInviteLink = (token: string): string => {
  const clientBase = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "https://sharaspot.in";
  return `${clientBase.replace(/\/+$/, "")}/login?inviteToken=${encodeURIComponent(token)}`;
};

export const acceptOrganizationInviteForUser = async (token: string, userId: string, userEmail: string) => {
  const tokenHash = hashToken(token);
  const now = new Date();
  const invite = await prismaAny.organizationInvite.findUnique({
    where: { tokenHash },
    include: { organization: true },
  });

  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < now) {
    return { accepted: false as const, reason: "invalid_or_expired" as const };
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(userEmail)) {
    return { accepted: false as const, reason: "email_mismatch" as const };
  }

  const alreadyMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invite.organizationId, userId } },
  });

  if (!alreadyMember) {
    const memberCount = await prisma.organizationMember.count({
      where: { organizationId: invite.organizationId },
    });
    if (memberCount >= MAX_TEAM_MEMBERS) {
      return { accepted: false as const, reason: "team_full" as const };
    }

    await prisma.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        userId,
        role: invite.role as any,
        invitedBy: invite.invitedBy,
      },
    });
  }

  await prismaAny.organizationInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: now },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { activeOrganizationId: invite.organizationId },
  });

  await invalidatePremiumCache(userId);

  return {
    accepted: true as const,
    organizationId: invite.organizationId,
    organizationName: invite.organization.name,
    role: invite.role,
  };
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    const { email, role } = req.body as { email: string; role?: string };
    const normalizedEmail = normalizeEmail(email || "");

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }
    if (!normalizedEmail) { res.status(400).json({ message: "Email is required" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      res.status(403).json({ message: "Only admins can invite members" });
      return;
    }

    const memberCount = await prisma.organizationMember.count({
      where: { organizationId: orgId },
    });
    if (memberCount >= MAX_TEAM_MEMBERS) {
      res.status(400).json({ message: `Team limit reached. Maximum ${MAX_TEAM_MEMBERS} members per organization.` });
      return;
    }

    const validRole = (role === "ADMIN" || role === "MEMBER" || role === "VIEWER") ? role : "MEMBER";

    const invitedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (invitedUser) {
      const existing = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: invitedUser.id } },
      });
      if (existing) {
        res.status(409).json({ message: "User is already a member of this organization" });
        return;
      }

      const member = await prisma.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: invitedUser.id,
          role: validRole as any,
          invitedBy: userId,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      if (!invitedUser.activeOrganizationId) {
        await prisma.user.update({
          where: { id: invitedUser.id },
          data: { activeOrganizationId: orgId },
        });
      }

      await invalidatePremiumCache(invitedUser.id);

      res.status(201).json({
        type: "member",
        member: {
          id: member.id,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
          role: member.role,
          joinedAt: member.joinedAt,
        },
      });
      return;
    }

    const existingInvite = await prismaAny.organizationInvite.findFirst({
      where: {
        organizationId: orgId,
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      res.status(409).json({ message: "Active invite already exists for this email" });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const invite = await prismaAny.organizationInvite.create({
      data: {
        organizationId: orgId,
        email: normalizedEmail,
        role: validRole as any,
        tokenHash,
        invitedBy: userId,
        expiresAt,
      },
    });

    res.status(201).json({
      type: "invite",
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        inviteLink: buildInviteLink(rawToken),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to invite member" });
  }
};

export const listPendingInvites = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      res.status(403).json({ message: "Only admins can view invites" });
      return;
    }

    const invites = await prismaAny.organizationInvite.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
    });
    res.json(invites);
  } catch {
    res.status(500).json({ message: "Failed to fetch invites" });
  }
};

export const revokeInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    const inviteId = req.params.inviteId as string;
    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      res.status(403).json({ message: "Only admins can revoke invites" });
      return;
    }

    const invite = await prismaAny.organizationInvite.findFirst({
      where: { id: inviteId, organizationId: orgId, acceptedAt: null, revokedAt: null },
      select: { id: true },
    });
    if (!invite) {
      res.status(404).json({ message: "Invite not found" });
      return;
    }

    await prismaAny.organizationInvite.update({
      where: { id: invite.id },
      data: { revokedAt: new Date() },
    });
    res.sendStatus(204);
  } catch {
    res.status(500).json({ message: "Failed to revoke invite" });
  }
};

export const getInvitePreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    if (!token) {
      res.status(400).json({ message: "Invite token is required" });
      return;
    }

    const tokenHash = hashToken(token);
    const invite = await prismaAny.organizationInvite.findUnique({
      where: { tokenHash },
      include: { organization: { select: { id: true, name: true } } },
    });
    if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
      res.status(404).json({ message: "Invite not found or expired" });
      return;
    }

    res.json({
      organizationId: invite.organization.id,
      organizationName: invite.organization.name,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch invite" });
  }
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) {
      res.status(400).json({ message: "Invite token is required" });
      return;
    }

    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const result = await acceptOrganizationInviteForUser(token, userId, userEmail);
    if (!result.accepted) {
      if (result.reason === "team_full") {
        res.status(400).json({ message: `Team limit reached. Maximum ${MAX_TEAM_MEMBERS} members per organization.` });
        return;
      }
      if (result.reason === "email_mismatch") {
        res.status(403).json({ message: "Invite email does not match current account" });
        return;
      }
      res.status(404).json({ message: "Invite not found or expired" });
      return;
    }

    const newAccessToken = signAccessToken({
      id: userId,
      email: userEmail,
      activeOrganizationId: result.organizationId,
    });

    res.json({
      accepted: true,
      organizationId: result.organizationId,
      organizationName: result.organizationName,
      role: result.role,
      accessToken: newAccessToken,
    });
  } catch {
    res.status(500).json({ message: "Failed to accept invite" });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    const memberId = req.params.memberId as string;

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== "OWNER") {
      res.status(403).json({ message: "Only the owner can remove members" });
      return;
    }

    const target = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) { res.status(404).json({ message: "Member not found" }); return; }
    if (target.role === "OWNER") { res.status(400).json({ message: "Cannot remove the owner" }); return; }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    const otherMembership = await prisma.organizationMember.findFirst({
      where: {
        userId: target.userId,
        organizationId: { not: orgId },
      },
      select: { organizationId: true },
    });

    await prisma.user.updateMany({
      where: { id: target.userId, activeOrganizationId: orgId },
      data: { activeOrganizationId: otherMembership?.organizationId || null },
    });

    // Invalidate premium cache so removed user no longer inherits premium
    await invalidatePremiumCache(target.userId);

    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to remove member" });
  }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;
    const memberId = req.params.memberId as string;
    const { role } = req.body as { role: string };

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }
    if (!role || !["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== "OWNER") {
      res.status(403).json({ message: "Only the owner can change roles" });
      return;
    }

    const target = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
    if (!target) { res.status(404).json({ message: "Member not found" }); return; }
    if (target.role === "OWNER") { res.status(400).json({ message: "Cannot change the owner's role" }); return; }

    await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: role as any },
    });

    res.json({ memberId, role });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update member role" });
  }
};

export const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership || membership.role !== "OWNER") {
      res.status(403).json({ message: "Only the owner can delete the organization" });
      return;
    }

    // Wrap all Prisma mutations in a transaction for atomicity
    const memberUserIds = await prisma.$transaction(async (tx) => {
      // Nullify organizationId on all org-scoped resources
      await Promise.all([
        tx.emailCampaign.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.sender.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.contact.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.emailTemplate.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.followUpTemplate.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.tag.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.contactList.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.callTask.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.prmSegment.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.webhook.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.mcpApiKey.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.bounceList.deleteMany({ where: { organizationId: orgId } }),
        tx.inboxEmail.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
        tx.inboxThread.updateMany({ where: { organizationId: orgId }, data: { organizationId: null } }),
      ]);

      // Get all members
      const members = await tx.organizationMember.findMany({
        where: { organizationId: orgId },
      });
      const ids = members.map(m => m.userId);

      // Reassign active org for members who had this as their active org
      for (const memberUserId of ids) {
        const user = await tx.user.findUnique({ where: { id: memberUserId } });
        if (user?.activeOrganizationId === orgId) {
          const otherMembership = await tx.organizationMember.findFirst({
            where: { userId: memberUserId, organizationId: { not: orgId } },
          });
          await tx.user.update({
            where: { id: memberUserId },
            data: { activeOrganizationId: otherMembership?.organizationId || null },
          });
        }
      }

      // Delete all memberships
      await tx.organizationMember.deleteMany({ where: { organizationId: orgId } });

      // Delete the organization
      await tx.organization.delete({ where: { id: orgId } });

      return ids;
    });

    // Invalidate premium caches after successful Prisma transaction
    for (const memberUserId of memberUserIds) {
      await invalidatePremiumCache(memberUserId);
    }

    const ownerAfterDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeOrganizationId: true },
    });

    const newAccessToken = signAccessToken({
      id: userId,
      email: req.user!.email,
      activeOrganizationId: ownerAfterDelete?.activeOrganizationId || null,
    });

    res.json({ accessToken: newAccessToken, message: "Organization deleted" });
  } catch (error: any) {
    logger.error({ error }, "[Org] deleteOrganization error");
    res.status(500).json({ message: "Failed to delete organization" });
  }
};

export const leaveOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orgId = req.user?.activeOrganizationId;

    if (!orgId) { res.status(400).json({ message: "No active organization" }); return; }

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!membership) { res.status(404).json({ message: "Not a member" }); return; }
    if (membership.role === "OWNER") { res.status(400).json({ message: "Owner cannot leave. Transfer ownership or delete the org." }); return; }

    await prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });

    const otherMembership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId: { not: orgId },
      },
      select: { organizationId: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: otherMembership?.organizationId || null },
    });

    // Invalidate premium cache so leaving user no longer inherits premium
    await invalidatePremiumCache(userId);

    const newAccessToken = signAccessToken({
      id: userId,
      email: req.user!.email,
      activeOrganizationId: otherMembership?.organizationId || null,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to leave organization" });
  }
};
