import { redirect } from "next/navigation";

export default function JoinPage() {
  // Legacy route: redirect to consolidated join page
  redirect("/class/join");
}
