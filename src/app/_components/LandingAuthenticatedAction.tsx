import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";

export function LandingAuthenticatedAction() {
  return (
    <Button
      size="lg"
      nativeButton={false}
      className="w-44 gap-2 group justify-center"
      render={
        <Link href={ROUTE_STUNDENPLAN}>
          Zum Stundenplan
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      }
    ></Button>
  );
}
