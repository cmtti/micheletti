CREATE TABLE public.orcamento_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE,
  escopo text NOT NULL DEFAULT '',
  normas text[] NOT NULL DEFAULT '{}',
  atividades text[] NOT NULL DEFAULT '{}',
  rotulo_valor text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_modelos TO authenticated;
GRANT ALL ON public.orcamento_modelos TO service_role;
ALTER TABLE public.orcamento_modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY modelos_select ON public.orcamento_modelos FOR SELECT TO authenticated USING (private.is_membro(auth.uid()));
CREATE POLICY modelos_insert ON public.orcamento_modelos FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY modelos_update ON public.orcamento_modelos FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY modelos_delete ON public.orcamento_modelos FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER orcamento_modelos_updated_at BEFORE UPDATE ON public.orcamento_modelos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orcamentos ADD COLUMN tipos text[] NOT NULL DEFAULT '{}';

INSERT INTO public.tipos_projeto (nome) SELECT 'laudo técnico' WHERE NOT EXISTS (SELECT 1 FROM public.tipos_projeto WHERE nome = 'laudo técnico');

INSERT INTO public.orcamento_modelos (tipo, escopo, normas, atividades, rotulo_valor, observacao) VALUES
('residencial',
 'Consiste em um projeto de instalações elétricas [descrição], com base nas normas:',
 ARRAY['NBR 5410','NBR 5419 (se houver SPDA)','Normas técnicas da concessionária local (CPFL Paulista)'],
 ARRAY['Projeto de infraestrutura elétrica: dimensionamento de tomadas, interruptores, iluminação, disjuntores, condutores elétricos e diagramas elétricos em conformidade com a NBR 5410;','Definição das medidas de proteção contra surtos elétricos: dimensionamento do sistema de aterramento e do sistema de proteção contra descargas atmosféricas, se necessário;','Compatibilização com as demais disciplinas (climatização, hidrossanitário, fundação e estrutura);','Pranchas de markup e cotas;','Definição da categoria do padrão de entrada, em conformidade com a concessionária local;','Lista preliminar de material das instalações elétricas.'],
 'do projeto das instalações elétricas.',
 'Para que as atividades sejam concluídas, o contratante deverá fornecer os projetos arquitetônico e estrutural da unidade habitacional. Ainda, informações complementares poderão ser requeridas ao contratante durante a etapa de desenvolvimento do projeto.'),
('comercial',
 'Consiste em um projeto de instalações elétricas [descrição], de uso comercial, com base nas normas:',
 ARRAY['NBR 5410','NBR ISO/CIE 8995-1 (iluminação de ambientes de trabalho)','NBR 5419 (se necessário)','Normas da concessionária local'],
 ARRAY['Levantamento de cargas e quadro de cargas por circuito;','Projeto de infraestrutura elétrica: tomadas de uso geral e específico, iluminação, quadros de distribuição, disjuntores, DRs, DPS e condutores;','Diagramas unifilares e trifilares dos quadros;','Projeto de infraestrutura para dados, telefonia e CFTV (somente encaminhamento);','Dimensionamento do padrão de entrada e da demanda, conforme a concessionária;','Compatibilização com arquitetura, climatização e demais disciplinas;','Memorial descritivo e lista preliminar de materiais.'],
 'do projeto das instalações elétricas.',
 'O contratante deverá fornecer o projeto arquitetônico (layout final), a relação de equipamentos com suas potências e o projeto de climatização, quando houver. Informações complementares poderão ser requeridas durante o desenvolvimento do projeto.'),
('industrial',
 'Consiste em um projeto de instalações elétricas industriais [descrição], com base nas normas:',
 ARRAY['NBR 5410','NBR 5419','NBR ISO/CIE 8995-1','NR-10 – Segurança em instalações e serviços em eletricidade','NR-12 (quando houver máquinas)','Normas da concessionária local'],
 ARRAY['Levantamento de cargas, fator de demanda e estudo de demanda da instalação;','Dimensionamento de alimentadores, quadros gerais (QGBT) e quadros de distribuição e de força;','Projeto de força para máquinas e equipamentos, incluindo partidas de motores;','Projeto de iluminação industrial;','Estudo de correção do fator de potência (banco de capacitores), quando necessário;','Sistema de aterramento, equipotencialização e SPDA;','Diagramas unifilares e trifilares, plantas de encaminhamento (eletrocalhas, leitos e eletrodutos);','Memorial descritivo, memorial de cálculo e lista de materiais.'],
 'do projeto das instalações elétricas.',
 'O contratante deverá fornecer o layout industrial, a relação de máquinas com dados de placa (potência, tensão e regime de operação) e os projetos arquitetônico e estrutural. Informações complementares poderão ser requeridas durante o desenvolvimento do projeto.'),
('subestação',
 'Consiste em um projeto de subestação [abrigada/aérea/blindada] de [potência] kVA, [descrição], com base nas normas:',
 ARRAY['NBR 14039 – Instalações elétricas de média tensão de 1,0 kV a 36,2 kV','NBR 5410','NBR 5419','NR-10','Normas técnicas da concessionária local (CPFL Paulista) para fornecimento em tensão primária'],
 ARRAY['Levantamento de carga e dimensionamento do transformador;','Projeto da entrada de energia em média tensão e da cabine/subestação;','Dimensionamento de proteção (disjuntor de MT, relé de proteção, chaves, para-raios e TCs/TPs);','Estudo de seletividade e coordenação da proteção;','Malha de aterramento da subestação;','Diagramas unifilares, plantas, cortes e detalhes construtivos;','Memorial descritivo e de cálculo;','Encaminhamento e acompanhamento da aprovação do projeto junto à concessionária;','Emissão de ART.'],
 'do projeto da subestação.',
 'O contratante deverá fornecer a planta de situação, os projetos arquitetônico e estrutural, a relação de cargas e os documentos exigidos pela concessionária. Prazos de análise e aprovação da concessionária não estão incluídos no prazo de entrega.'),
('iluminação',
 'Consiste em um projeto luminotécnico [descrição], com base nas normas:',
 ARRAY['NBR ISO/CIE 8995-1 (interna)','NBR 5101 – Iluminação pública (quando externa/viária)','NBR 5410'],
 ARRAY['Levantamento dos ambientes e definição dos níveis de iluminância por atividade;','Cálculo e simulação luminotécnica (iluminância, uniformidade e ofuscamento);','Especificação de luminárias, lâmpadas e drivers;','Planta de posicionamento das luminárias e circuitos de iluminação;','Relatório de cálculo luminotécnico;','Lista de materiais.'],
 'do projeto luminotécnico.',
 'O contratante deverá fornecer o projeto arquitetônico com layout, pé-direito e acabamentos (forro, cores e revestimentos). Informações complementares poderão ser requeridas durante o desenvolvimento do projeto.'),
('automação',
 'Consiste em um projeto de automação e comando elétrico [descrição], com base nas normas:',
 ARRAY['NBR 5410','NBR IEC 61439 – Conjuntos de manobra e comando de baixa tensão','NR-10','NR-12 (quando aplicado a máquinas)'],
 ARRAY['Levantamento dos processos, pontos de entrada e saída (I/O) e requisitos de controle;','Especificação de CLP, IHM, sensores, atuadores e inversores ou soft-starters;','Diagramas de comando e de força;','Projeto do painel elétrico (layout interno e frontal);','Arquitetura de rede e comunicação;','Lista de materiais e memorial descritivo.'],
 'do projeto de automação.',
 'O contratante deverá fornecer a descrição funcional do processo, a relação de equipamentos e os dados técnicos das máquinas envolvidas. A programação do CLP/IHM e o comissionamento não estão incluídos, salvo se descritos nas atividades.'),
('laudo técnico',
 'Consiste em um laudo técnico [de aterramento / das instalações elétricas / de SPDA] [descrição], com base nas normas:',
 ARRAY['NBR 5410','NBR 15749 – Medição de resistência de aterramento e de potenciais na superfície do solo','NBR 5419-3 (quando houver SPDA)','NBR 13534 (estabelecimentos assistenciais de saúde)','RDC 50/2002 (saúde)','NR-10'],
 ARRAY['Inspeção visual das instalações elétricas existentes;','Medição da resistência do sistema de aterramento, com verificação do valor de referência exigido e indicação de melhorias, quando necessário;','Verificação da continuidade das armaduras e das ligações equipotenciais;','Relatório fotográfico com apontamentos de não conformidades;','Laudo técnico conclusivo com recomendações de adequação;','Emissão de ART.'],
 'das atividades descritas',
 'O contratante deverá garantir o acesso às instalações e aos quadros elétricos na data agendada para as medições. Adequações identificadas no laudo não estão incluídas nesta proposta.');