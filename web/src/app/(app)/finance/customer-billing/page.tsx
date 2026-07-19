"use client";

import { FileText } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";

export default function CustomerBillingPage() {
    return (
        <>
            <TopBar
                title="Customer Billing"
                description="Prepare customer billing from completed loads before generating invoices."
            />
            <main className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft">
                            <FileText className="h-7 w-7 text-rust" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink">Coming Soon</p>
                            <p className="mt-1.5 max-w-xs text-sm text-steel">
                                Customer Billing will let you prepare and review billing amounts from
                                completed loads before sending them to invoicing.
                            </p>
                        </div>
                    </div>
                </Card>
            </main>
        </>
    );
}