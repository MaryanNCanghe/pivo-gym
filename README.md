# PIVO: Personal Fitness Tracker

A full-stack fitness tracking web app built with Django and vanilla JavaScript.

---

## Description

PIVO started as a CS50W final project and turned into something I'd actually want to use. The idea was simple: most fitness apps do one thing well but make you juggle three different apps to track your workouts, food, and progress. PIVO puts all of it in one place.

You can build your own workout routines, log sessions, search real food data from the USDA database, scan a photo of your meal and get instant macro estimates, track your daily steps, and see how your last 30 days actually looked on a chart. There's also a recipe library, an AI coach you can ask for advice whenever you need it, and a community feed where users can share posts, photos, and encouragement with each other.

The app is designed for women, with a full pink and purple pastel theme throughout.

---

## Features

- Register an account, set your fitness goal (lose / maintain / gain), and fill in your stats on the onboarding page
- Reset a forgotten password via email link (Django built-in password reset flow)
- Build workout templates by searching a library of 1000+ exercises with animated gifs, then log sessions with sets, reps, and weight
- Track your weekly sessions against a personal target with a live progress bar
- Log meals manually, search any food by name using the USDA FoodData Central database with live autocomplete previews as you type, or take a photo and let Google Gemini estimate the macros
- See your daily calorie, protein, carbs, and fat progress in real time
- Count your steps with manual entry
- Browse 21 default recipes organised by goal and meal type, and save your own with photos
- View 30 day charts for calories, protein, steps, and workouts on the dashboard
- Chat with an AI coach for workout, meal, or recovery tips (works offline too if no API key is set)
- Upload a profile photo and add weekly progress photos to track how you're looking over time
- Post updates, photos, and encouragement to the Community feed, like other users' posts, and reply with comments in a Threads-style layout

---

## File Structure

### Backend

`fitness/models.py` — All 13 database models

`fitness/views.py` — Every view function and JSON API endpoint, 39 routes in total

`fitness/urls.py` — URL patterns for the fitness app

`fitness/migrations/` — Database migrations, including the one that seeds 21 default recipes automatically

`config/settings.py` — Django settings: installed apps, database, MEDIA_ROOT, env var loading

`config/urls.py` — Root URL config; also serves uploaded media files in development

### JavaScript (static/js/)

`meals.js` — Powers the whole meals page: food search with live autocomplete dropdown, AI photo scan, macro chart, meal list, date picker

`community.js` — Community feed: create posts, upload photos, paginated feed, like/unlike with live counts, inline comments with lazy loading, delete own posts

`workouts.js` — Weekly summary chart, logging a session, updating the goal counter

`add-workout.js` — The workout builder where you pick exercises and set reps and weight

`log-workout.js` — UI for logging an active workout session

`exercise-list.js` — Browse and search the ExerciseDB exercise library

`recipes.js` — Goal and meal type filter chips, card expand and collapse, add recipe form

`ai.js` — Chat interface, intent detection from keywords, offline reply pool, Gemini API call

`dashboard-month.js` — Draws the 30 day analytics charts using Chart.js

`home.js` — Macro donut chart on the home page

`steps.js` — Step counter UI and manual entry form

`calendar.js` — The date picker used on the meals page

`charts/macrosDonut.js` — Reusable donut chart component shared across pages

### CSS (static/css/)

`pivo.css` — The global theme: CSS variables (full pink and purple pastel palette), typography, and shared utility classes

`community.css` — Post cards, compose box, avatar circles, like and comment action buttons, inline comment thread, floating menus

`meals.css` — Quick add form, food result cards, camera scan button, macro progress rings

`workouts.css` — Session cards, weekly bar chart, goal badge

`profile.css` — Circular avatar, hover overlay, progress photo grid

`recipes.css` — Filter chips, card grid, goal and meal badges, expandable recipe panel

`ai.css` — Chat bubbles, sender label, input form layout

`dashboard.css` — Analytics charts and stat tiles

`steps.css` — Step display and entry form

`exercise-list.css` — Exercise card grid with gif thumbnails

### Templates (fitness/templates/fitness/)

`layout.html` — The shared base: Bootstrap 5, offcanvas nav with Community link, head and body blocks

`index.html` — Home page with greeting, today's macro summary, and quick links

`login.html` — Login form with "Forgot your password?" link

`register.html` — Registration form

`registration/password_reset_form.html` — Enter email to request a reset link

`registration/password_reset_done.html` — Confirmation that the email was sent

`registration/password_reset_confirm.html` — Set a new password from the emailed link

`registration/password_reset_complete.html` — Success screen after password is changed

`community.html` — Threads-style social feed with compose box, post cards, and pagination

`questions.html` — Onboarding: goal, gender, age, weight, height

`profile.html` — Avatar upload and progress photo gallery

`workouts.html` — Workout list, weekly bar, and log session button

`add-workout.html` — Build or edit a workout template

`log-workout.html` — Log sets and reps during a session

`exercise-list.html` — Exercise browser with filters and gifs

`meals.html` — Full nutrition tracking page

`recipes.html` — Default recipe browser and personal recipe book

`steps.html` — Step entry and daily totals

`dashboard.html` — 30 day analytics

`ai.html` — AI coaching chat

---

## Models

Profile — stores the user's fitness profile (gender, age, weight, height, objective, avatar)

ProgressPhoto — weekly body photos (photo, note, uploaded_at)

DailyGoal — the user's daily nutrition and step targets (calories, protein, carbs, fat, steps)

DailySummary — aggregated totals per day

MealEntry — a single food item that was logged (name, calories, macros, date)

StepSample — a step count entry (start, end, steps, source)

Workout — a workout template (name, days as a JSON list)

WorkoutExercise — an exercise inside a workout template (name, category, target, equipment, gif url)

ExerciseSet — a set inside an exercise (reps, weight, unit, minutes)

WorkoutSession — a logged workout on a specific date

Recipe — a recipe, either a default one or one the user saved (name, goal, meal type, ingredients, instructions, macros, image)

Post — a community post (user, text content, optional image file, created_at, many-to-many likes)

Comment — a reply to a post (post, user, content, created_at)

---

## API Integrations

USDA FoodData Central (USDA_API_KEY) — returns real calorie and macro data when you search for a food

RapidAPI ExerciseDB (RAPIDAPI_KEY, EXERCISEDB_HOST) — powers the exercise library with 1000+ exercises and animated gifs

Google Gemini 2.0 Flash (GEMINI_API_KEY) — analyses food photos and drives the AI coaching chat

Email (optional, for password reset) — set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env to send real reset emails via SMTP. Without those, the reset link is printed to the terminal instead, which is fine for development.

If you don't have the API keys set up, the app still works. Food search and the exercise library will just return nothing, and the AI chat switches to a built in offline response system. The community feed, password reset, and everything else works with no external keys.

---

## How to Run

Prerequisites: Python 3.10+ and pip

```bash
cd "Pivo gym/Pivo"

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Then open `http://127.0.0.1:8000/` and register an account.

### Environment Variables

Create a `.env` file in the `Pivo/` folder next to `manage.py`:

```env
USDA_API_KEY=your_usda_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
EXERCISEDB_BASE=https://exercisedb.p.rapidapi.com
EXERCISEDB_HOST=exercisedb.p.rapidapi.com
GEMINI_API_KEY=your_gemini_key_here

# Optional — for sending real password reset emails
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your@gmail.com
```

Where to get them:

- USDA FoodData Central: free at api.nal.usda.gov
- ExerciseDB: free tier on RapidAPI, search "exercisedb"
- Google Gemini: free at aistudio.google.com (1500 requests per day)

---

## Page Walkthrough

Home (/): The first thing you see after logging in. Shows today's macro summary as a ring chart, a greeting, and quick links to every section.

Workouts (/workouts/): Lists your saved workout templates and shows how many sessions you've logged this week against your weekly goal. Hit "Complete Day" to log one. The Add Workout page lets you search for exercises and build a routine from scratch.

Meals (/meals/): The main nutrition page. You can log something quickly with the form, search any food to get its real macro data from the USDA database, or tap the camera icon to upload a photo and have Gemini read the macros off it. Use the date picker to look back at any previous day.

Recipes (/recipes/): Two sections. The top half has 21 default recipes you can filter by goal and meal type. The bottom half is your own recipe book where you can add anything with a photo, ingredients, instructions, and macros.

Steps (/steps/): Simple. Enter how many steps you did and it gets saved. Your total for today is shown at the top.

Dashboard (/dashboard/): Line charts for the last 30 days across calories, protein, steps, and workouts. Good for spotting trends and seeing if you're actually being consistent.

AI (/ai/): Type a question about working out, eating, or recovery and the AI will answer. When Gemini is connected it uses that; otherwise it falls back to a local system with pre-written responses for common questions.

Profile (/profile/): Your stats at a glance plus your avatar. You can also upload a photo each week to track your progress over time.

Community (/community/): A Threads-style social feed for all users of the app. Write a post, attach a photo, and share it with everyone. You can like any post — the count updates instantly without a page reload. Click the comment bubble to expand a post's thread and reply; comments load lazily so the feed stays fast. You can delete your own posts from the three-dot menu. Posts are paginated with a "Load more" button so the page never gets heavy.

---

## Design Decisions

Why Django: It came with authentication, an ORM, CSRF protection, and a migration system out of the box. That let me focus on features instead of plumbing. The data migration for seeding default recipes is a good example: running `migrate` is all anyone needs to do to get a fully loaded recipe library, no extra steps.

Why vanilla JavaScript: The CS50W course is built around plain JavaScript, and I wanted to keep the codebase approachable. Every interactive piece on the site, from the food search to the recipe filters to the AI chat, is just `fetch` calls and DOM updates. No build tools, no framework, nothing to install.

Why Google Gemini: It has a free tier with 1500 requests per day, which is more than enough for personal use. It also supports image inputs natively, which is what makes the food photo scanner possible. Anthropic's API doesn't have a free tier, so Gemini was the practical choice.

Why a data migration for recipes: Instead of writing a fixture file or a separate management command, the default recipes are seeded through a `RunPython` migration. This means they get inserted the moment you run `migrate` for the first time, and the whole setup process stays as one command.

Why the community feed uses FileField instead of ImageField for post images: The existing models already use ImageField for avatars and recipe photos, which requires Pillow. Using FileField for post images means the community works even without Pillow installed, and validation of the file type is handled at the view level instead of the model level.

Why likes are a ManyToManyField on Post: It gives us `post.likes.count()`, `post.likes.add(user)`, and `post.likes.filter(id=user.id).exists()` for free with no extra queries beyond what Django already handles. Toggling a like is a single `add` or `remove` call. The alternative (a separate Like model) adds a table and a join for no real benefit at this scale.

Why comments load lazily: Fetching every comment for every visible post on page load would multiply the number of queries by the number of posts. Instead, comments are only fetched when a user clicks the comment button on a specific post. This keeps the feed fast regardless of how many comments exist.
