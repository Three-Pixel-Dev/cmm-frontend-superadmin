import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoadTestScreen } from "@/components/admin/LoadTestScreen";

export const Route = createFileRoute("/_admin/load-test")({
  beforeLoad: () => {
    if (import.meta.env.VITE_ENABLE_LOAD_TEST !== "true") {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({ meta: [{ title: "Load Test — SuperCash Admin" }] }),
  component: LoadTestScreen,
});
