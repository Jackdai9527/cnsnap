import { runOrderStatusSyncAssertions } from "@/lib/order-status-sync";

const checks = runOrderStatusSyncAssertions();

console.log(`Order status sync assertions passed: ${checks.length}`);
for (const check of checks) {
  console.log(`- ${check}`);
}
