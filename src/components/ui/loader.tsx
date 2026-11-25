import { cn } from "@/lib/utils";
import { RabbitLoader } from "./rabbit-loader";

export function Loader({ className }: { className?: string }) {
  return <span className={cn(className)} aria-hidden="true"><RabbitLoader size={64} /></span>;
}
