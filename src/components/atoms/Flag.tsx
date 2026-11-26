import Image from "next/image";

// Decorativa: siempre va junto al nombre del país, por eso alt vacío.
// eager: pesan menos de 1.5 KB cada una y así no aparecen vacías al abrir una lista oculta.
export function Flag({ code }: { code: string }) {
  return (
    <Image src={`/flags/${code}.svg`} alt="" width={24} height={16} loading="eager" className="h-4 w-6 shrink-0 rounded-[2px] object-cover" />
  );
}
