import { createFileRoute } from "@tanstack/react-router";
import { GymApp } from "@/components/gym/GymApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse CRM — Intelligent Gym Management" },
      { name: "description", content: "Adaptive gym CRM and member portal with gender-aware scheduling, churn insights, and gamified member experience." },
      { property: "og:title", content: "Pulse CRM — Intelligent Gym Management" },
      { property: "og:description", content: "Adaptive gym CRM and member portal with gender-aware scheduling, churn insights, and gamified member experience." },
    ],
  }),
  component: Index,
});

function Index() {
  return <GymApp />;
}
