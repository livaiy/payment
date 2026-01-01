import { NextRequest, NextResponse } from "next/server";
import { getXenditHeaders, XENDIT_API_BASE } from "@/lib/xendit-client";

/**
 * Xendit Payment Link API
 * Creates payment links using Xendit Invoice API v2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      description, 
      customer,
      items,
      successRedirectUrl, 
      failureRedirectUrl,
      externalId,
      invoiceDuration 
    } = body;

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    if (!externalId) {
      return NextResponse.json(
        { error: "External ID is required" },
        { status: 400 }
      );
    }

    // IMPORTANT: Always use NEXT_PUBLIC_APP_URL for redirect URLs
    // This ensures redirect URLs update automatically when deployment URL changes
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build the request payload for Xendit Invoice API
    const payload: any = {
      external_id: externalId,
      amount: Number(amount),
      currency: "IDR",
      // Always set redirect URLs using the app's current deployment URL
      success_redirect_url: successRedirectUrl || `${baseUrl}/payment/success`,
      failure_redirect_url: failureRedirectUrl || `${baseUrl}/payment/failed`,
    };

    // Add optional fields if provided
    if (description) {
      payload.description = description;
    }

    if (customer) {
      payload.customer = {
        given_names: customer.given_names || customer.firstName || customer.name?.split(" ")[0] || "Customer",
        surname: customer.surname || customer.lastName || customer.name?.split(" ").slice(1).join(" ") || "",
        email: customer.email,
        mobile_number: customer.mobile_number || customer.phone,
      };
    }

    if (items && Array.isArray(items)) {
      payload.items = items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        category: item.category,
        url: item.url,
      }));
    }

    if (invoiceDuration) {
      payload.invoice_duration = invoiceDuration;
    }

    // Create payment link using Xendit Invoice API v2
    const response = await fetch(`${XENDIT_API_BASE}/v2/invoices`, {
      method: "POST",
      headers: getXenditHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Payment API] Xendit error:", errorText);
      return NextResponse.json(
        { error: "Failed to create payment link", details: errorText },
        { status: response.status }
      );
    }

    const invoice = await response.json();

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        external_id: invoice.external_id,
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        invoice_url: invoice.invoice_url,
        expiry_date: invoice.expiry_date,
      },
      paymentUrl: invoice.invoice_url,
    });
  } catch (error) {
    console.error("[Payment API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
