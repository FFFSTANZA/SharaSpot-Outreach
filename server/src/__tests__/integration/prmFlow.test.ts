
process.env.ENCRYPTION_KEY = "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1";
process.env.JWT_ACCESS_SECRET = "7c4e9a2b5f8d1c3e6a9b2d5f8c1e4a7b0d3f6c9e2a5b8d1f4c7e0a3b6d9f2c5";
process.env.JWT_REFRESH_SECRET = "2b5d8f1e4a7c0d3f6b9e2c5a8d1f4e7b0c3a6d9f2e5b8c1d4f7a0e3b6d9f2c5";
process.env.ACCESS_TOKEN_EXPIRES = "1h";
process.env.REFRESH_TOKEN_EXPIRES = "7d";
process.env.TRACKING_BASE_URL = "http://localhost:8000";

// Mock ioredis before anything else
const redisList: string[] = [];
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    lpush: jest.fn().mockImplementation((key, val) => {
      redisList.push(val);
      return Promise.resolve(redisList.length);
    }),
    rpop: jest.fn().mockImplementation((key) => {
      return Promise.resolve(redisList.shift() || null);
    }),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

import request from "supertest";
import { app } from "../../index";
import { prisma } from "../../config/prisma";
import { signAccessToken } from "../../utils/jwt";
import { flushTrackingBuffer } from "../../controllers/trackingControllers";
import { encrypt } from "../../utils/encryption";
import { logContactActivityByEmail, updateContactStageByEmail } from "../../utils/contactService";

// Mock BullMQ
jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: "mock-job-id" }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      close: jest.fn().mockResolvedValue(undefined),
    })),
    Job: jest.fn(),
  };
});

describe("PRM Lifecycle End-to-End Flow", () => {
  let token: string;
  let userId: string;
  let senderId: string;

  beforeAll(async () => {
    // Clean up in correct order
    await prisma.trackingEvent.deleteMany();
    await prisma.contactActivity.deleteMany();
    await prisma.note.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.emailJob.deleteMany();
    await prisma.campaignSender.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.sequenceStep.deleteMany();
    await prisma.recipientSequenceState.deleteMany();
    await prisma.emailCampaign.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.contactList.deleteMany();
    await prisma.emailTemplate.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.senderCooldown.deleteMany();
    await prisma.warmupSchedule.deleteMany();
    await prisma.sender.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: "prm-test-user@example.com",
        name: "PRM Test User",
      },
    });
    userId = user.id;

    // Create sender
    const sender = await prisma.sender.create({
      data: {
        userId,
        email: "prm-sender@example.com",
        name: "PRM Sender",
        appPassword: encrypt("password"),
        smtpHost: "smtp.example.com",
        smtpPort: 465,
        isVerified: true,
      },
    });
    senderId = sender.id;

    token = signAccessToken({ id: userId, email: user.email });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should complete the full PRM lifecycle", async () => {
    // 1. Contact Creation
    const contactPayload = {
      email: "contact@example.com",
      firstName: "John",
      lastName: "Doe",
      company: "Acme Corp",
      jobTitle: "Software Engineer",
      stage: "COLD"
    };

    const createRes = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send(contactPayload);

    expect(createRes.status).toBe(201);
    const contactId = createRes.body.id;
    expect(contactId).toBeDefined();

    // Verify in DB
    const contactInDb = await prisma.contact.findUnique({ where: { id: contactId } });
    expect(contactInDb?.email).toBe(contactPayload.email);

    // 2. Note Management
    const notePayload = {
      contactId,
      content: "Initial meeting went well."
    };

    const addNoteRes = await request(app)
      .post("/api/contacts/notes")
      .set("Authorization", `Bearer ${token}`)
      .send(notePayload);

    expect(addNoteRes.status).toBe(201);
    const noteId = addNoteRes.body.id;

    // Verify activity
    const noteActivity = await prisma.contactActivity.findFirst({
      where: { contactId, type: "NOTE_ADDED" }
    });
    expect(noteActivity).toBeDefined();

    // Verify timeline
    const getContactRes = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getContactRes.body.notes).toHaveLength(1);
    expect(getContactRes.body.notes[0].content).toBe(notePayload.content);

    // Delete note
    await request(app)
      .delete(`/api/contacts/notes/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    const noteInDb = await prisma.note.findUnique({ where: { id: noteId } });
    expect(noteInDb).toBeNull();

    // 3. Manual Stage Transition
    const updateRes = await request(app)
      .put(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stage: "WARM" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.stage).toBe("WARM");

    const stageActivity = await prisma.contactActivity.findFirst({
      where: { contactId, type: "STAGE_CHANGED", metadata: { string_contains: "WARM" } as any }
    });
    expect(stageActivity).toBeDefined();

    // 4. Outreach & Automatic Transition
    // Create a campaign with this contact
    const campaignPayload = {
      senderId,
      subject: "Hello {{FirstName}}",
      body: "Hi John",
      startTime: new Date().toISOString(),
      delaySeconds: 0,
      hourlyLimit: 100,
      emails: [
        {
          email: "contact@example.com",
          columnData: { FirstName: "John" },
        },
      ],
    };

    const createCampRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send(campaignPayload);

    expect(createCampRes.status).toBe(201);
    const campaignId = createCampRes.body.campaignId;

    // Verify CAMPAIGN_ENROLLED activity
    const enrolledActivity = await prisma.contactActivity.findFirst({
      where: { contactId, type: "CAMPAIGN_ENROLLED" }
    });
    expect(enrolledActivity).toBeDefined();

    // Simulate sending email
    const emailJob = await prisma.emailJob.findFirst({
      where: { campaignId, toEmail: "contact@example.com" }
    });
    expect(emailJob).toBeDefined();

    await prisma.emailJob.update({
      where: { id: emailJob!.id },
      data: { status: "SENT", sentAt: new Date() }
    });

    // Mock worker's activity log and stage update
    await logContactActivityByEmail(userId, "contact@example.com", "EMAIL_SENT", {
      emailJobId: emailJob!.id,
      campaignId: campaignId,
    });
    await updateContactStageByEmail(userId, "contact@example.com", "CONTACTED");

    const updatedContact = await prisma.contact.findUnique({ where: { id: contactId } });
    expect(updatedContact?.stage).toBe("CONTACTED");

    // 5. Tracking Integration
    // Simulate OPEN
    await request(app).get(`/track/open/${emailJob!.id}`);
    // Simulate CLICK
    await request(app).get(`/track/click/${emailJob!.id}?url=https%3A%2F%2Fexample.com`);

    await flushTrackingBuffer();

    // Verify activities
    const openActivity = await prisma.contactActivity.findFirst({
      where: { contactId, type: "EMAIL_OPENED" }
    });
    expect(openActivity).toBeDefined();

    const clickActivity = await prisma.contactActivity.findFirst({
      where: { contactId, type: "EMAIL_CLICKED" }
    });
    expect(clickActivity).toBeDefined();

    // Verify engagement score
    // Sent: 1, Opened: 1, Clicked: 1 => (1*20) + (1*40) + (1*60) = 120
    const getStatsRes = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getStatsRes.body.engagementScore).toBe(120);

    // 6. Bulk Operations
    // Create another contact
    const contact2 = await prisma.contact.create({
      data: {
        userId,
        email: "contact2@example.com",
        firstName: "Jane",
        stage: "COLD"
      }
    });

    const bulkUpdateRes = await request(app)
      .post("/api/contacts/bulk-update")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ids: [contactId, contact2.id],
        data: { stage: "REPLIED" }
      });

    expect(bulkUpdateRes.status).toBe(200);

    const updatedContact1 = await prisma.contact.findUnique({ where: { id: contactId } });
    const updatedContact2 = await prisma.contact.findUnique({ where: { id: contact2.id } });
    expect(updatedContact1?.stage).toBe("REPLIED");
    expect(updatedContact2?.stage).toBe("REPLIED");

    // Bulk Delete
    const bulkDeleteRes = await request(app)
      .post("/api/contacts/bulk-delete")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ids: [contactId, contact2.id]
      });

    expect(bulkDeleteRes.status).toBe(200);

    const deletedContact1 = await prisma.contact.findUnique({ where: { id: contactId } });
    const deletedContact2 = await prisma.contact.findUnique({ where: { id: contact2.id } });
    expect(deletedContact1).toBeNull();
    expect(deletedContact2).toBeNull();
  });
});
