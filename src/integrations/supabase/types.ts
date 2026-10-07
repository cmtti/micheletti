export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anexos_versao: {
        Row: {
          autor_id: string | null
          card_id: string
          created_at: string
          id: string
          nome_arquivo: string
          revisao: number
          status: Database["public"]["Enums"]["anexo_status"]
          storage_path: string | null
          visivel_cliente: boolean
        }
        Insert: {
          autor_id?: string | null
          card_id: string
          created_at?: string
          id?: string
          nome_arquivo: string
          revisao?: number
          status?: Database["public"]["Enums"]["anexo_status"]
          storage_path?: string | null
          visivel_cliente?: boolean
        }
        Update: {
          autor_id?: string | null
          card_id?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          revisao?: number
          status?: Database["public"]["Enums"]["anexo_status"]
          storage_path?: string | null
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "anexos_versao_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_auditoria: {
        Row: {
          acao: string
          autor_id: string | null
          card_id: string
          created_at: string
          detalhe: string | null
          id: string
        }
        Insert: {
          acao: string
          autor_id?: string | null
          card_id: string
          created_at?: string
          detalhe?: string | null
          id?: string
        }
        Update: {
          acao?: string
          autor_id?: string | null
          card_id?: string
          created_at?: string
          detalhe?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_auditoria_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_parceiros: {
        Row: {
          card_id: string
          created_at: string
          id: string
          nome: string
          updated_at: string
          valor: number
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          valor?: number
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_parceiros_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          created_at: string
          custo_estimado: number
          custo_real: number
          descricao: string | null
          etapa_id: string | null
          fim_previsto: string | null
          fim_real: string | null
          id: string
          inicio_previsto: string | null
          inicio_real: string | null
          ordem: number
          percentual: number
          prioridade: Database["public"]["Enums"]["prioridade"]
          projeto_id: string
          responsavel_id: string | null
          tags: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_estimado?: number
          custo_real?: number
          descricao?: string | null
          etapa_id?: string | null
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          ordem?: number
          percentual?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          projeto_id: string
          responsavel_id?: string | null
          tags?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_estimado?: number
          custo_real?: number
          descricao?: string | null
          etapa_id?: string | null
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          ordem?: number
          percentual?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          projeto_id?: string
          responsavel_id?: string | null
          tags?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_anexos: {
        Row: {
          autor_id: string | null
          chamado_id: string
          created_at: string
          id: string
          nome_arquivo: string
          storage_path: string
        }
        Insert: {
          autor_id?: string | null
          chamado_id: string
          created_at?: string
          id?: string
          nome_arquivo: string
          storage_path: string
        }
        Update: {
          autor_id?: string | null
          chamado_id?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_anexos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamado_mensagens: {
        Row: {
          autor_id: string | null
          chamado_id: string
          created_at: string
          id: string
          interna: boolean
          texto: string
        }
        Insert: {
          autor_id?: string | null
          chamado_id: string
          created_at?: string
          id?: string
          interna?: boolean
          texto: string
        }
        Update: {
          autor_id?: string | null
          chamado_id?: string
          created_at?: string
          id?: string
          interna?: boolean
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_mensagens_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          autor_id: string | null
          categoria: string
          created_at: string
          descricao: string
          id: string
          projeto_id: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          categoria: string
          created_at?: string
          descricao?: string
          id?: string
          projeto_id: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          categoria?: string
          created_at?: string
          descricao?: string
          id?: string
          projeto_id?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          card_id: string
          concluido: boolean
          created_at: string
          descricao: string | null
          id: string
          norma: string
        }
        Insert: {
          card_id: string
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          norma: string
        }
        Update: {
          card_id?: string
          concluido?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          norma?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      comentarios: {
        Row: {
          autor_id: string | null
          card_id: string
          created_at: string
          id: string
          texto: string
        }
        Insert: {
          autor_id?: string | null
          card_id: string
          created_at?: string
          id?: string
          texto: string
        }
        Update: {
          autor_id?: string | null
          card_id?: string
          created_at?: string
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_config: {
        Row: {
          cidade_emissao: string
          cnpj: string
          crea: string
          created_at: string
          engenheiro_crea: string
          engenheiro_nome: string
          engenheiro_titulo: string
          id: string
          razao_social: string
          updated_at: string
        }
        Insert: {
          cidade_emissao?: string
          cnpj?: string
          crea?: string
          created_at?: string
          engenheiro_crea?: string
          engenheiro_nome?: string
          engenheiro_titulo?: string
          id?: string
          razao_social?: string
          updated_at?: string
        }
        Update: {
          cidade_emissao?: string
          cnpj?: string
          crea?: string
          created_at?: string
          engenheiro_crea?: string
          engenheiro_nome?: string
          engenheiro_titulo?: string
          id?: string
          razao_social?: string
          updated_at?: string
        }
        Relationships: []
      }
      etapas_kanban: {
        Row: {
          cor: string
          created_at: string
          etapa_cliente: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string
          created_at?: string
          etapa_cliente?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          cor?: string
          created_at?: string
          etapa_cliente?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      orcamento_itens: {
        Row: {
          created_at: string
          id: string
          orcamento_id: string
          ordem: number
          texto: string
          tipo: Database["public"]["Enums"]["orcamento_item_tipo"]
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          orcamento_id: string
          ordem?: number
          texto?: string
          tipo: Database["public"]["Enums"]["orcamento_item_tipo"]
          valor?: number
        }
        Update: {
          created_at?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          texto?: string
          tipo?: Database["public"]["Enums"]["orcamento_item_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_modelos: {
        Row: {
          atividades: string[]
          created_at: string
          escopo: string
          id: string
          normas: string[]
          observacao: string
          rotulo_valor: string
          tipo: string
          updated_at: string
        }
        Insert: {
          atividades?: string[]
          created_at?: string
          escopo?: string
          id?: string
          normas?: string[]
          observacao?: string
          rotulo_valor?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          atividades?: string[]
          created_at?: string
          escopo?: string
          id?: string
          normas?: string[]
          observacao?: string
          rotulo_valor?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          ano: number
          atividade: string
          cliente_cnpj: string | null
          cliente_id: string | null
          cliente_nome: string
          condicao: string | null
          condicao_pagamento: string | null
          created_at: string
          created_by: string | null
          escopo: string | null
          id: string
          local_obra: string | null
          numero: string
          observacoes: string | null
          parcelas: number
          prazo_entrega: string | null
          sequencial: number
          status: Database["public"]["Enums"]["orcamento_status"]
          tipos: string[]
          updated_at: string
          validade: string | null
          valor: number
          valor_descricao: string
        }
        Insert: {
          ano: number
          atividade?: string
          cliente_cnpj?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          condicao?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          escopo?: string | null
          id?: string
          local_obra?: string | null
          numero: string
          observacoes?: string | null
          parcelas?: number
          prazo_entrega?: string | null
          sequencial: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          tipos?: string[]
          updated_at?: string
          validade?: string | null
          valor?: number
          valor_descricao?: string
        }
        Update: {
          ano?: number
          atividade?: string
          cliente_cnpj?: string | null
          cliente_id?: string | null
          cliente_nome?: string
          condicao?: string | null
          condicao_pagamento?: string | null
          created_at?: string
          created_by?: string | null
          escopo?: string | null
          id?: string
          local_obra?: string | null
          numero?: string
          observacoes?: string | null
          parcelas?: number
          prazo_entrega?: string | null
          sequencial?: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          tipos?: string[]
          updated_at?: string
          validade?: string | null
          valor?: number
          valor_descricao?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aprovado: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
        }
        Insert: {
          aprovado?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome?: string
        }
        Update: {
          aprovado?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      projeto_clientes: {
        Row: {
          created_at: string
          id: string
          projeto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          projeto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          projeto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_clientes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_parcelas: {
        Row: {
          created_at: string
          descricao: string
          id: string
          ordem: number
          pago: boolean
          projeto_id: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          pago?: boolean
          projeto_id: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          ordem?: number
          pago?: boolean
          projeto_id?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_parcelas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          cliente_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          prazo_entrega: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["projeto_status"]
          tipo: string
          valor_contrato: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          prazo_entrega?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo?: string
          valor_contrato?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          prazo_entrega?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo?: string
          valor_contrato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos_apoio: {
        Row: {
          created_at: string
          id: string
          link_referencia: string | null
          nome: string
          projeto_id: string
          storage_path: string | null
          tipo_documento: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_referencia?: string | null
          nome: string
          projeto_id: string
          storage_path?: string | null
          tipo_documento: string
        }
        Update: {
          created_at?: string
          id?: string
          link_referencia?: string | null
          nome?: string
          projeto_id?: string
          storage_path?: string | null
          tipo_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_apoio_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_projeto: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      portal_meus_projetos: {
        Args: never
        Returns: {
          etapa: string
          id: string
          nome: string
          prazo_entrega: string
          tipo: string
        }[]
      }
      portal_projeto: { Args: { _id: string }; Returns: Json }
      portal_reabrir_chamado: { Args: { _id: string }; Returns: undefined }
    }
    Enums: {
      anexo_status: "rascunho" | "em_revisao" | "final_aprovado"
      app_role:
        | "admin"
        | "engenheiro"
        | "comercial"
        | "aprovador"
        | "visualizador"
        | "cliente"
      orcamento_item_tipo: "norma" | "atividade" | "parcela"
      orcamento_status: "enviado" | "aprovado" | "recusado"
      prioridade: "baixa" | "media" | "alta" | "urgente"
      projeto_status: "ativo" | "concluido" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      anexo_status: ["rascunho", "em_revisao", "final_aprovado"],
      app_role: [
        "admin",
        "engenheiro",
        "comercial",
        "aprovador",
        "visualizador",
        "cliente",
      ],
      orcamento_item_tipo: ["norma", "atividade", "parcela"],
      orcamento_status: ["enviado", "aprovado", "recusado"],
      prioridade: ["baixa", "media", "alta", "urgente"],
      projeto_status: ["ativo", "concluido", "cancelado"],
    },
  },
} as const
