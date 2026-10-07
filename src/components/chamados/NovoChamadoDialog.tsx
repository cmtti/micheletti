import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIA_LABEL, abrirChamado, type ChamadoCategoria } from "@/lib/chamados";

export function NovoChamadoDialog({ projetoId }: { projetoId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<ChamadoCategoria>("duvida");
  const [descricao, setDescricao] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const id = await abrirChamado({ projeto_id: projetoId, titulo, categoria, descricao, files });
      qc.invalidateQueries({ queryKey: ["chamados"] });
      toast.success("Chamado aberto.");
      setOpen(false);
      navigate({ to: "/portal/chamado/$id", params: { id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Abrir chamado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo chamado</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={salvar}>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as ChamadoCategoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIA_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea required rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fotos e anexos (opcional)</Label>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.dwg"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
          <Button className="w-full" disabled={salvando}>
            {salvando ? "Enviando..." : "Abrir chamado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
