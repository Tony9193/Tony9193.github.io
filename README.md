# BH4HAP GitHub Pages

This folder is the publication root for `https://Tony9193.github.io`.
Upload the contents of this folder (not its parent) to the root of the
`Tony9193.github.io` repository.

Included: the BH4HAP portfolio as `index.html`, the JavaScript modules it uses,
the Alfa Romeo C42 model, and a model-source/license notice. No CV, application
documents, phone number, street address, or older site files are included.

## Publish with GitHub CLI

Install and authenticate GitHub CLI (`gh auth login`), then open PowerShell in
this folder and run:

```powershell
git init -b main
git add .
git commit -m "Publish BH4HAP personal website"
gh repo create Tony9193/Tony9193.github.io --public --source . --remote origin --push
```

If the repository already exists, inspect it before adding a remote or pushing;
do not overwrite an existing branch without checking its contents.

In the repository's **Settings → Pages**, select **Deploy from a branch**,
choose `main` and `/ (root)`, and save. Wait for the Pages deployment to finish,
then open `https://Tony9193.github.io`.

The car is a third-party model. Its source and declared license are recorded in
[`C42-MODEL-NOTICE.md`](./C42-MODEL-NOTICE.md).
