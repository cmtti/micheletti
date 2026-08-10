# Electro Flow

Crie um software de gestão de projetos no estilo Kanban (similar ao Jira/Trello), 
voltado para o controle de projetos elétricos que estão sendo desenvolvidos e orçados 
por uma equipe de engenharia.

## CONTEXTO DO NEGÓCIO
O sistema será usado por uma equipe que desenvolve projetos elétricos (residenciais, 
comerciais e industriais), controlando desde a fase de orçamento até a entrega da 
versão final do projeto, incluindo documentos de apoio e conformidade normativa.

## ESTRUTURA DO QUADRO KANBAN
Crie um quadro com colunas (etapas) que representam o fluxo do projeto, permitindo 
arrastar e soltar os cards entre as colunas:

1. Solicitação/Backlog
2. Em Orçamento
3. Orçamento Enviado
4. Em Desenvolvimento
5. Em Revisão Técnica
6. Aguardando Aprovação do Cliente
7. Concluído/Entregue
8. Arquivado/Cancelado

As colunas devem ser configuráveis (permitir renomear, reordenar e adicionar novas 
colunas no futuro).

## ENTIDADE: PROJETO
Cada projeto é a unidade principal e contém:
- Nome do projeto
- Cliente (nome e contato)
- Tipo de projeto (residencial, comercial, industrial, subestação, iluminação, 
automação, etc.)
- Data de criação
- Status geral (ativo, concluído, cancelado)
- Lista de cards vinculados
- Lista de projetos de apoio vinculados

## ENTIDADE: CARD (dentro de um projeto)
Cada card representa uma etapa/tarefa do projeto e deve conter os campos:
- Título da etapa/tarefa
- Etapa atual no Kanban
- Data de início prevista
- Data de término prevista
- Data de início real
- Data de término real
- Percentual de andamento (0-100%)
- Prioridade (baixa, média, alta, urgente)
- Responsável (usuário atribuído)
- Custo estimado
- Custo real
- Tags/labels personalizáveis
- Comentários (histórico com autor e data/hora, permitindo múltiplos comentários 
por card)
- Anexos com controle de versão (nome do arquivo, número da revisão, status: 
rascunho/em revisão/final aprovado, autor do upload, data)
- Checklist de conformidade normativa (itens como NBR 5410, NBR 5419, NR-10, com 
marcação de concluído/pendente)

## PROJETOS DE APOIO
Cada projeto principal pode ter documentos/subprojetos vinculados, como:
- Memorial descritivo
- ART/RRT
- Planta baixa
- Laudo técnico
- Lista de materiais
Cada projeto de apoio deve ter: tipo de documento, nome, arquivo anexado e link 
de referência ao projeto principal.

## USUÁRIOS E PERMISSÕES
Crie perfis de usuário com diferentes níveis de acesso:
- Administrador (acesso total)
- Engenheiro/Projetista (cria e edita cards, faz upload de versões)
- Comercial (gerencia orçamentos e clientes)
- Aprovador (aprova revisões técnicas e versões finais)

## TELAS NECESSÁRIAS
1. Dashboard inicial com indicadores: projetos em atraso, custo estimado x realizado, 
quantidade de projetos por etapa
2. Quadro Kanban com drag-and-drop entre colunas
3. Tela de detalhe do card (abre ao clicar), mostrando todos os campos, comentários, 
anexos com versionamento e checklist
4. Tela de listagem de projetos com filtros (por cliente, tipo, status, responsável)
5. Tela de cadastro/edição de projeto
6. Tela de cadastro/edição de clientes
7. Tela de gerenciamento de usuários e permissões

## FUNCIONALIDADES ADICIONAIS
- Cálculo automático de atraso (comparando data prevista x data real)
- Notificação visual quando um card está atrasado ou próximo do prazo
- Histórico/log de auditoria por card (quem alterou o quê e quando)
- Exportação de relatórios em PDF (lista de projetos, status, custos)
- Busca e filtros por nome de projeto, cliente, responsável e status

## ESTILO VISUAL
Interface limpa, profissional, com tema claro, cores neutras (cinza/azul) e uso 
de cores de destaque (verde, amarelo, vermelho) para indicar status de prazo 
(no prazo, atenção, atrasado). Priorize clareza e escaneabilidade sobre elementos 
decorativos.

## BANCO DE DADOS
Utilize uma estrutura relacional com as seguintes tabelas principais: 
Projeto, Card, Etapa_Kanban, Comentario, Anexo_Versao, Projeto_Apoio, 
Checklist_Item, Cliente, Usuario — respeitando os relacionamentos:
- Um Projeto tem vários Cards
- Um Projeto tem vários Projetos_Apoio
- Um Card tem vários Comentarios, Anexos_Versao e Checklist_Items
- Um Card pertence a uma Etapa_Kanban e a um Usuario responsável

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://micheletti.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82aff55f-eb78-463c-a47b-693714185b83).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
