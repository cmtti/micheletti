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
import { brl, definirMascaraForcada } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "lenzee:valores-ocultos";
/** Máscara de largura fixa — nunca varia com a grandeza do valor real. */
export const MASCARA_VALOR = "R$ ••••••";

interface ValuesVisibilityValue {
  valoresOcultos: boolean;
  /** Visualizador: valores sempre ocultos, sem opção de mostrar. */
  forcado: boolean;
  alternarValores: () => void;
  /** Formata em BRL ou devolve a máscara fixa quando os valores estão ocultos. */
  formatarValor: (valor: number) => string;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityValue | null>(null);

export function ValuesVisibilityProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState(false);
  const [forcado, setForcado] = useState(false);
  const valoresOcultos = preferencia || forcado;

  useEffect(() => {
    setPreferencia(localStorage.getItem(STORAGE_KEY) === "1");
    async function verificarPapel(userId?: string) {
      if (!userId) {
        definirMascaraForcada(false);
        return setForcado(false);
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const papeis = (data ?? []).map((r) => r.role as string);
      const soLeitura = !papeis.includes("admin") && !papeis.includes("engenheiro");
      definirMascaraForcada(soLeitura);
      setForcado(soLeitura);
    }
    supabase.auth.getUser().then(({ data }) => verificarPapel(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((e, session) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") verificarPapel(session?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const alternarValores = useCallback(() => {
    setPreferencia((atual) => {
      const proximo = !atual;
      localStorage.setItem(STORAGE_KEY, proximo ? "1" : "0");
      return proximo;
    });
  }, []);

  const value = useMemo<ValuesVisibilityValue>(
    () => ({
      valoresOcultos,
      forcado,
      alternarValores,
      formatarValor: (valor: number) => (valoresOcultos ? MASCARA_VALOR : brl(valor)),
    }),
    [valoresOcultos, forcado, alternarValores],
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
  const { valoresOcultos, alternarValores, forcado } = useValuesVisibility();
  if (forcado) return null;
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
