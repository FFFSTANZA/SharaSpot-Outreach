import { Router, Request, Response } from "express";
import {
    createMcpApiKey,
    listMcpApiKeys,
    revokeMcpApiKey,
    deleteMcpApiKey
} from "../mcp/services/apiKeyService";

const router = Router();

// Create a new MCP API key
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { name, permissions, expiresAt } = req.body;

        if (!name) {
            res.status(400).json({ message: "Key name is required" });
            return;
        }

        const result = await createMcpApiKey(
            userId,
            name,
            permissions,
            expiresAt ? new Date(expiresAt) : undefined
        );

        res.status(201).json(result);
    } catch (error) {
        console.error("Error creating MCP API key:", error);
        res.status(500).json({ message: "Failed to create API key" });
    }
});

// List all MCP API keys for the user
router.get("/", async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const keys = await listMcpApiKeys(userId);
        res.json(keys);
    } catch (error) {
        console.error("Error listing MCP API keys:", error);
        res.status(500).json({ message: "Failed to list API keys" });
    }
});

// Revoke an MCP API key (make it inactive)
router.patch("/:id/revoke", async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const success = await revokeMcpApiKey(userId, id as string);

        if (success) {
            res.json({ message: "API key revoked" });
        } else {
            res.status(404).json({ message: "API key not found" });
        }
    } catch (error) {
        console.error("Error revoking MCP API key:", error);
        res.status(500).json({ message: "Failed to revoke API key" });
    }
});

// Delete an MCP API key permanently
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;
        const success = await deleteMcpApiKey(userId, id as string);

        if (success) {
            res.json({ message: "API key deleted" });
        } else {
            res.status(404).json({ message: "API key not found" });
        }
    } catch (error) {
        console.error("Error deleting MCP API key:", error);
        res.status(500).json({ message: "Failed to delete API key" });
    }
});

export default router;
