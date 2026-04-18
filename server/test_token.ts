import { prisma } from "./src/config/prisma";
import { signAccessToken } from "./src/utils/jwt";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    let user: any = await prisma.user.findFirst({
        include: { subscription: true }
    });

    if (!user) {
        console.log("No user found, creating test user...");
        user = await prisma.user.create({
            data: {
                email: "test@example.com",
                name: "Test User",
                subscription: {
                    create: {
                        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    }
                }
            },
            include: { subscription: true }
        } as any);
    } else {
        console.log("User found, updating subscription...");
        await prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: "ACTIVE"
            },
            update: {
                trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: "ACTIVE"
            }
        });
    }

    const token = signAccessToken({ id: user.id, email: user.email });
    console.log("USER_ID:", user.id);
    expect_token(token);
}

function expect_token(token: string) {
    console.log("TOKEN_BEGIN");
    console.log(token);
    console.log("TOKEN_END");
}

main().catch(console.error);
