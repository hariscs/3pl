"use client";

import { Receipt } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";

export default function InvoicesPage() {
    return (
        <>
            <TopBar
                title="Invoices"
                description="Generate, manage and track customer invoices."
            />
            <main className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft">
                            <Receipt className="h-7 w-7 text-rust" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink">Coming Soon</p>
                            <p className="mt-1.5 max-w-xs text-sm text-steel">
                                Invoices will let you generate, manage and send customer invoices
                                based on approved billing data from completed loads.
                            </p>
                        </div>
                    </div>
                </Card>
            </main>
        </>
    );
}