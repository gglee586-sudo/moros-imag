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

- Keep photo/video sorting at `/sort` and document sorting at `/sort-docs`, with the document library at `/docs`; folders carry a `kind` ("photos" default, "documents") and each mode only offers its own folders, because the two workflows must never be mixed.
