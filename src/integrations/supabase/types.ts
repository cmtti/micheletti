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
      etapas_kanban: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
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
      projetos: {
        Row: {
          cliente_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["projeto_status"]
          tipo: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo?: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["projeto_status"]
          tipo?: string
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
      [_ in never]: never
    }
    Enums: {
      anexo_status: "rascunho" | "em_revisao" | "final_aprovado"
      app_role: "admin" | "engenheiro" | "comercial" | "aprovador"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "engenheiro", "comercial", "aprovador"],
      prioridade: ["baixa", "media", "alta", "urgente"],
      projeto_status: ["ativo", "concluido", "cancelado"],
    },
  },
} as const
