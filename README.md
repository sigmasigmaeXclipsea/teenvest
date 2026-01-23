# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Syncing Local Changes to Lovable

**How the sync works:**
- **Lovable → GitHub**: Automatic. Changes made in Lovable are automatically committed to GitHub.
- **GitHub → Lovable**: Automatic. Once you push changes to GitHub, Lovable automatically reflects them.
- **Local IDE → GitHub**: Manual. You need to commit and push your changes.

**Quick push helper:**

We've included helper scripts to make pushing easier:

**On macOS/Linux:**
```sh
./scripts/push-to-lovable.sh "Your commit message"
```

**On Windows (PowerShell):**
```powershell
.\scripts\push-to-lovable.ps1 "Your commit message"
```

If you don't provide a commit message, the script will prompt you for one.

**Manual workflow:**
```sh
git add .
git commit -m "Your commit message"
git push
```

After pushing to GitHub, your changes will automatically appear in Lovable within a few moments.

**For more automation options** (including an optional auto-push hook), see [scripts/README.md](scripts/README.md).

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
