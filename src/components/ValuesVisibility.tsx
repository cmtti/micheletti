import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/api";

const STORAGE_KEY = "lenzee:valores-ocultos";
/** Máscara de largura fixa — nunca varia com a grandeza do valor real. */
export const MASCARA_VALOR = "R$ ••••••";

interface ValuesVisibilityValue {
  valoresOcultos: boolean;
  alternarValores: () => void;
  /** Formata em BRL ou devolve a máscara fixa quando os valores estão ocultos. */
  formatarValor: (valor: number) => string;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityValue | null>(null);

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [valoresOcultos, setValoresOcultos] = useState(false);

  useEffect(() => {
    setValoresOcultos(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const alternarValores = useCallback(() => {
    setValoresOcultos((atual) => {
      const proximo = !atual;
      localStorage.setItem(STORAGE_KEY, proximo ? "1" : "0");
      return proximo;
    });
  }, []);

  const value = useMemo<ValuesVisibilityValue>(
    () => ({
      valoresOcultos,
      alternarValores,
      formatarValor: (valor: number) => (valoresOcultos ? MASCARA_VALOR : brl(valor)),
    }),
    [valoresOcultos, alternarValores],
  );

  return (
    <ValuesVisibilityContext.Provider value={value}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export function useValuesVisibility() {
  const ctx = useContext(ValuesVisibilityContext);
  if (!ctx) {
    throw new Error("useValuesVisibility precisa estar dentro de ValuesVisibilityProvider");
  }
  return ctx;
}

/** Botão padrão de olho aberto/fechado para alternar a exibição de valores. */
export function ToggleValoresButton() {
  const { valoresOcultos, alternarValores } = useValuesVisibility();
  return (
    <Button
      variant={valoresOcultos ? "secondary" : "outline"}
      size="sm"
      onClick={alternarValores}
      aria-pressed={valoresOcultos}
      title={valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
      aria-label={valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
    >
      {valoresOcultos ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {valoresOcultos ? "Mostrar valores" : "Ocultar valores"}
    </Button>
  );
}
