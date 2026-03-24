import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    console.log("[checkUser]: No Clerk user found - checking authentication session.");
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

    const newUser = await db.user.create({
      data: {
        id: user.id,
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        updatedAt: new Date(),
      },
    });

    return newUser;
  } catch (error) {
    console.error("[checkUser Error]:", {
      message: error.message,
      stack: error.stack,
      dbAvailable: !!db,
    });
    return null;
  }
};
