"use client";

import { DollarSign } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/Card";

export default function PayrollPage() {
    return (
        <>
            <TopBar
                title="Payroll"
                description="Review, approve and export employee payroll for completed loads."
            />
            <main className="flex flex-1 items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rust-soft">
                            <DollarSign className="h-7 w-7 text-rust" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink">Coming Soon</p>
                            <p className="mt-1.5 max-w-xs text-sm text-steel">
                                Payroll will let you calculate employee pay from clocked hours
                                and production data across completed loads.
                            </p>
                        </div>
                    </div>
                </Card>
            </main>
        </>
    );
}