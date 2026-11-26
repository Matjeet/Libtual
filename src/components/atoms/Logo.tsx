import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function Logo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-tight">
      <LogoMark className="h-9 w-auto shrink-0" />
      Libtual
    </Link>
  );
}
