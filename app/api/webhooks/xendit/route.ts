import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookToken } from "@/lib/xendit-client";
import { db } from "@/server/db";
import { enrollments, courses } from "@/server/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

/**
 * Xendit Invoice Webhook Handler
 * Handles payment notifications from Xendit and creates enrollments
 * 
 * Note: Xendit webhooks may send either:
 * - An `event` field (e.g., "invoice.paid", "invoice.expired")
 * - Or just a `status` field (e.g., "PAID", "EXPIRED", "FAILED")
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity
    const callbackToken = request.headers.get("x-callback-token");
    if (!verifyWebhookToken(callbackToken)) {
      console.error("[Xendit Webhook] Invalid callback token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Xendit can send either an event field or just status
    const event = body.event;
    const status = body.status;

    console.log(`[Xendit Webhook] Received webhook:`, {
      event: event,
      status: status,
      id: body.id,
      external_id: body.external_id,
    });

    // Handle based on event field if present
    if (event) {
      switch (event) {
        case "invoice.paid":
          await handleInvoicePaid(body);
          break;

        case "invoice.expired":
          await handleInvoiceExpired(body);
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(body);
          break;

        default:
          console.log(`[Xendit Webhook] Unhandled event type: ${event}`);
      }
    } 
    // Fallback to status field if no event field
    else if (status) {
      switch (status) {
        case "PAID":
          await handleInvoicePaid(body);
          break;

        case "EXPIRED":
          await handleInvoiceExpired(body);
          break;

        case "FAILED":
          await handleInvoicePaymentFailed(body);
          break;

        default:
          console.log(`[Xendit Webhook] Unhandled status: ${status}`);
      }
    } else {
      console.log(`[Xendit Webhook] No event or status field found in webhook`);
    }

    // Always respond with 200 to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Xendit Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment - Create enrollment for the course
 */
async function handleInvoicePaid(invoice: any) {
  console.log(`[Xendit Webhook] Invoice paid: ${invoice.id}`, {
    external_id: invoice.external_id,
    amount: invoice.amount,
    payment_channel: invoice.payment_channel,
    payment_method: invoice.payment_method,
  });

  try {
    // Extract courseId and userId from external_id
    // Format: "enroll-{courseId}-{userId}"
    const [_, courseId, userId] = invoice.external_id.split('-');

    if (!courseId || !userId) {
      console.error("[Xendit Webhook] Invalid external_id format:", invoice.external_id);
      return;
    }

    // Check if already enrolled
    const existingEnrollment = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId))
      .where(eq(enrollments.courseId, courseId))
      .get();

    if (existingEnrollment) {
      // Update existing enrollment payment status
      await db.update(enrollments)
        .set({
          paymentStatus: 'paid',
          paymentId: invoice.id,
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, existingEnrollment.id));

      console.log(`[Xendit Webhook] Updated existing enrollment for user ${userId}, course ${courseId}`);
    } else {
      // Create new enrollment
      await db.insert(enrollments).values({
        id: nanoid(),
        userId,
        courseId,
        paymentStatus: 'paid',
        paymentId: invoice.id,
        progress: 0,
      });

      console.log(`[Xendit Webhook] Created new enrollment for user ${userId}, course ${courseId}`);
    }

    // TODO: Send confirmation email to customer
    // await sendPaymentConfirmationEmail(invoice, userId, courseId);

  } catch (error) {
    console.error("[Xendit Webhook] Error creating enrollment:", error);
  }
}

/**
 * Handle expired invoice
 */
async function handleInvoiceExpired(invoice: any) {
  console.log(`[Xendit Webhook] Invoice expired: ${invoice.id}`, {
    external_id: invoice.external_id,
    amount: invoice.amount,
  });

  // Log expiration for analytics
  console.log(`[Xendit Webhook] Payment expired for order: ${invoice.external_id}`);
}

/**
 * Handle payment failure
 */
async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`[Xendit Webhook] Invoice payment failed: ${invoice.id}`, {
    external_id: invoice.external_id,
    amount: invoice.amount,
    failure_code: invoice.failure_code,
  });

  // Log failure for analytics
  console.log(`[Xendit Webhook] Payment failed for order: ${invoice.external_id}, reason: ${invoice.failure_code}`);
}
