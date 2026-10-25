# Deploying to Render (free)

You end up with: a website, an API, and a PostgreSQL database, protected by an access code.

## 1. Put the project on GitHub
In the project's root folder (the one containing `backend` and `frontend`):
```
git add .
git status
```
Check that `.env` is NOT in the list. Then:
```
git commit -m "Multi-agent AI dev team"
```
Create an empty repository on github.com, then run the two commands GitHub shows you
(`git remote add origin ...` and `git push -u origin main`).

## 2. Create everything on Render
1. Sign up at render.com with your GitHub account.
2. New + > **Blueprint**, pick your repository. Render reads `render.yaml`.
3. It asks for three values. Enter:
   - `GROQ_API_KEY`: your Groq key
   - `CORS_ORIGINS`: `https://placeholder.invalid` (temporary)
   - `VITE_API_URL`: `https://placeholder.invalid` (temporary)
4. Click Apply and wait for the first deploy (several minutes).

## 3. Connect the website to the API
1. Open **devteam-api** and copy its address, e.g. `https://devteam-api-xxxx.onrender.com`.
2. Open **devteam-frontend** and copy its address.
3. On **devteam-frontend** > Environment: set `VITE_API_URL` to the API address, then
   Manual Deploy > Deploy latest commit (the website must be rebuilt for this to take effect).
4. On **devteam-api** > Environment: set `CORS_ORIGINS` to the website address (no trailing slash).
   It restarts by itself.
5. On **devteam-api** > Environment: copy the value of `ACCESS_CODE`.

Open the website, enter the access code, and build a project.

## Know the limits of the free plan
- The API sleeps after 15 minutes without traffic; the first visit afterwards takes 30-60 seconds.
- A run that is in progress when the server sleeps or restarts is marked "failed".
- The free database expires after about 30 days. Check Render's pricing page for current terms,
  or use a free external PostgreSQL service and paste its URL into `DATABASE_URL`.
- Free servers have very little CPU, so the Tester can be slow.

## Security
Generated code runs on your server. It has no access to your keys, and has time, memory and
file-size limits, but it can still reach the internet. Keep the access code private, and only
share it with people you trust (for example, put it in your resume or send it to recruiters).
