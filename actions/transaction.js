"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import resend from "@/lib/resend";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// =====================================================
// CREATE TRANSACTION
// =====================================================
export async function createTransaction(data) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    // Arcjet Protection
    const req = await request();
    const decision = await aj.protect(req, {
      userId: user.clerkUserId,
      requested: 1,
    });

    if (decision.isDenied()) {
      throw new Error("Too many requests. Please try again later.");
    }

    const account = await prisma.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) throw new Error("Account not found");

    const balanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          ...data,
          userId: user.id,
          updatedAt: new Date(),
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { 
          balance: newBalance,
          updatedAt: new Date(),
        },
      });

      return newTransaction;
    });

    // Send Email (non-blocking safe)
    try {
      if (process.env.RESEND_API_KEY && user.email) {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: user.email,
          subject: "Transaction Added Successfully",
          html: `
            <h2>Transaction Created</h2>
            <p><strong>Amount:</strong> $${data.amount}</p>
            <p><strong>Type:</strong> ${data.type}</p>
            <p><strong>Account:</strong> ${account.name}</p>
            <p>Your transaction was successfully recorded.</p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// =====================================================
// GET SINGLE TRANSACTION
// =====================================================
export async function getTransaction(id) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  const transaction = await prisma.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

// =====================================================
// UPDATE TRANSACTION
// =====================================================
export async function updateTransaction(id, data) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const originalTransaction = await prisma.transaction.findUnique({
      where: { id, userId: user.id },
    });

    if (!originalTransaction)
      throw new Error("Transaction not found");

    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          ...data,
          updatedAt: new Date(),
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: { increment: netBalanceChange },
          updatedAt: new Date(),
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// =====================================================
// GET USER TRANSACTIONS
// =====================================================
export async function getUserTransactions(query = {}) {
  try {
    const user = await checkUser();
    if (!user) throw new Error("Unauthorized");

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: { account: true },
      orderBy: { date: "desc" },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error in getUserTransactions:", error.message);
    throw new Error(error.message || "Failed to fetch transactions");
  }
}

// =====================================================
// SCAN RECEIPT (Gemini Vision)
// =====================================================
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const arrayBuffer = await file.arrayBuffer();
    const base64String =
      Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
Analyze this receipt image and extract:

- Total amount
- Date (ISO format)
- Description
- Merchant name
- Category

Return ONLY valid JSON:
{
  "amount": number,
  "date": "ISO date string",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}

If not a receipt return {}.
`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    const data = JSON.parse(cleanedText);

    return {
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      merchantName: data.merchantName,
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// =====================================================
// HELPER
// =====================================================
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}