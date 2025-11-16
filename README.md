# LearnMachineLearning Passport Photo App

This project is a single-page web application that lets a user upload a selfie, adjust it with on-canvas alignment guides, and export a printable 4"×6" sheet containing six US passport photos (2"×2" each). The layout is rendered at 300 DPI with a white background to comply with US passport requirements.

## Running the app locally

Because the project consists of static assets (`index.html`, `styles.css`, and `script.js`), you only need a static file server. Any HTTP server will work; two simple options are shown below.

### Option 1: Python
1. Ensure you have Python 3 installed.
2. From the project root, start a static server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser to [http://localhost:8000](http://localhost:8000) and interact with the app.

### Option 2: Node.js (`serve`)
1. Install the `serve` CLI globally if you do not already have it:
   ```bash
   npm install -g serve
   ```
2. From the project root, run:
   ```bash
   serve .
   ```
3. Navigate to the printed URL in your browser.

Once the page loads, use the guided workflow to upload a photo, fine-tune alignment, and download the generated 4"×6" JPEG sheet.

## Keeping your local copy up to date

If you already cloned the repository previously and just want the latest changes, there is no need to clone again. Use the following steps from the project root (`LearnMachineLearning`):

1. Check your current status so you know whether you have local edits:
   ```bash
   git status
   ```
2. If there are no local modifications, pull the latest commits from the remote default branch:
   ```bash
   git pull
   ```
3. If you have local changes you want to keep, commit them first:
   ```bash
   git add -A
   git commit -m "WIP"
   git pull --rebase
   ```
   Alternatively, temporarily set your edits aside without committing:
   ```bash
   git stash
   git pull
   git stash pop
   ```

Git will contact the remote server, download any new commits, and fast-forward your local branch. The above sequences help you avoid conflicts while preserving any edits you are still working on.
