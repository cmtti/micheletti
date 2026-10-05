import { Check } from "lucide-react";
import { ETAPAS_CLIENTE, type EtapaCliente } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LinhaDoTempo({ etapa, compacta }: { etapa: EtapaCliente | null; compacta?: boolean }) {
  const atual = etapa ? ETAPAS_CLIENTE.findIndex((e) => e.id === etapa) : 0;
  const concluido = etapa === "concluido";
  return (
    <ol className="flex w-full items-start">
      {ETAPAS_CLIENTE.map((e, i) => {
        const feito = i < atual || concluido;
        const ativo = i === atual && !concluido;
        return (
          <li key={e.id} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                className={cn(
                  "absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2",
                  i <= atual || concluido ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                feito && "border-primary bg-primary text-primary-foreground",
                ativo && "border-primary bg-card text-primary ring-4 ring-primary/20",
                !feito && !ativo && "border-border bg-card text-muted-foreground",
              )}
            >
              {feito ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            {!compacta && (
              <span
                className={cn(
                  "mt-1.5 text-[11px] leading-tight sm:text-xs",
                  ativo ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {e.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
