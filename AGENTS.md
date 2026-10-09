<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Client portal (/portal) reads data only via SECURITY DEFINER RPCs (portal_meus_projetos, portal_projeto) that return whitelisted fields; clients get no table SELECT access. Why: column-level exposure control without per-column RLS.
- private.is_membro excludes the 'cliente' role, so every internal-table policy keeps clients out automatically. Why: one choke point for internal vs. client access.
- Chamados (tickets) are the one exception to RPC-only portal reads: clients read chamados/chamado_mensagens/chamado_anexos directly, and RLS hides interna=true messages from them. Why: conversation data is client-owned; internal-note secrecy is enforced in the database, not the UI.
- Team visibility of chamados goes through private.equipe_ve_projeto (admin sees all; others only projects where they are projetos.responsavel_id, or projects without one). Why: tickets route to the project owner.
