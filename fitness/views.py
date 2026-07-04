from .models import Profile
from collections import Counter
from datetime import datetime, timedelta
import json
import os
import urllib.parse
from django.db import models
from django.db.models import Sum

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import (
    HttpRequest, HttpResponse, JsonResponse, HttpResponseBadRequest
)
from django.shortcuts import render, redirect
from django.utils import timezone
from django.utils.timezone import localdate
from django.views.decorators.http import require_GET, require_POST

try:
    import requests
except ImportError:
    requests = None

try:
    from google import genai as google_genai
    from google.genai import types as genai_types
except ImportError:
    google_genai = None
    genai_types = None

from .utils import get_daily_goal, profile_complete
from .models import (
    MealEntry, DailyGoal, DailySummary, StepSample, update_today_summary,
    WorkoutSession, Workout, WorkoutExercise, ExerciseSet, Post, Comment,
    Notification, Challenge, ChallengeParticipant,
)

def login_view(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("index")
        return render(request, "fitness/login.html", {"message": "Invalid username and/or password."})
    return render(request, "fitness/login.html")

def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect("index")

def register(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        username = request.POST.get("username", "")
        email = request.POST.get("email", "")
        password = request.POST.get("password", "")
        confirmation = request.POST.get("confirmation", "")

        if password != confirmation:
            return render(request, "fitness/register.html", {"message": "Passwords must match."})

        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "fitness/register.html", {"message": "Username already taken."})

        login(request, user)
        return redirect("questions")

    return render(request, "fitness/register.html")

@login_required
def profile(request: HttpRequest) -> HttpResponse:
    from .models import ProgressPhoto
    photos = ProgressPhoto.objects.filter(user=request.user)
    return render(request, "fitness/profile.html", {"photos": photos})

@login_required
@require_POST
def upload_avatar(request: HttpRequest) -> HttpResponse:
    avatar_file = request.FILES.get("avatar")
    if avatar_file:
        try:
            prof = request.user.profile
            if prof.avatar:
                prof.avatar.delete(save=False)
            prof.avatar = avatar_file
            prof.save()
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f"Upload failed: {e}")
    return redirect("profile")

@login_required
@require_POST
def upload_progress_photo(request: HttpRequest) -> HttpResponse:
    from .models import ProgressPhoto
    photo_file = request.FILES.get("photo")
    if photo_file:
        try:
            ProgressPhoto.objects.create(
                user=request.user,
                photo=photo_file,
                note=request.POST.get("note", "").strip(),
            )
        except Exception as e:
            from django.contrib import messages
            messages.error(request, f"Upload failed: {e}")
    return redirect("profile")

@login_required
@require_POST
def delete_progress_photo(request: HttpRequest, pk: int) -> HttpResponse:
    from .models import ProgressPhoto
    try:
        photo = ProgressPhoto.objects.get(pk=pk, user=request.user)
        photo.photo.delete(save=False)
        photo.delete()
    except ProgressPhoto.DoesNotExist:
        pass
    return redirect("profile")

@login_required
def recipes(request: HttpRequest) -> HttpResponse:
    from .models import Recipe
    default_recipes = Recipe.objects.filter(is_default=True)
    user_recipes = Recipe.objects.filter(user=request.user)
    return render(request, "fitness/recipes.html", {
        "default_recipes": default_recipes,
        "user_recipes": user_recipes,
    })

@login_required
@require_POST
def add_recipe(request: HttpRequest) -> HttpResponse:
    from .models import Recipe
    Recipe.objects.create(
        user=request.user,
        name=request.POST.get("name", "").strip(),
        goal=request.POST.get("goal", ""),
        meal_type=request.POST.get("meal_type", "breakfast"),
        description=request.POST.get("description", "").strip(),
        ingredients=request.POST.get("ingredients", "").strip(),
        instructions=request.POST.get("instructions", "").strip(),
        calories=int(request.POST.get("calories") or 0),
        protein_g=float(request.POST.get("protein_g") or 0),
        carbs_g=float(request.POST.get("carbs_g") or 0),
        fat_g=float(request.POST.get("fat_g") or 0),
        image=request.FILES.get("image"),
    )
    return redirect("recipes")

@login_required
@require_POST
def delete_recipe(request: HttpRequest, pk: int) -> HttpResponse:
    from .models import Recipe
    try:
        recipe = Recipe.objects.get(pk=pk, user=request.user)
        if recipe.image:
            recipe.image.delete(save=False)
        recipe.delete()
    except Recipe.DoesNotExist:
        pass
    return redirect("recipes")

@login_required
@require_POST
def log_recipe_as_meal(request: HttpRequest, pk: int) -> HttpResponse:
    from .models import Recipe
    try:
        recipe = Recipe.objects.get(pk=pk)
        MealEntry.objects.create(
            user=request.user,
            name=recipe.name,
            calories=recipe.calories,
            protein_g=recipe.protein_g,
            carbs_g=recipe.carbs_g,
            fat_g=recipe.fat_g,
        )
        update_today_summary(request.user)
    except Recipe.DoesNotExist:
        pass
    return JsonResponse({"ok": True})

@login_required
def questions(request: HttpRequest) -> HttpResponse:
    profile = request.user.profile
    if request.method == "POST":
        profile.gender = request.POST.get("gender")
        profile.age = request.POST.get("age")
        profile.weight = request.POST.get("weight")
        profile.height = request.POST.get("height")
        profile.objective = request.POST.get("objective")
        profile.save()
        return redirect("profile")
    return render(request, "fitness/questions.html")

@login_required
def index(request: HttpRequest) -> HttpResponse:
    Profile.objects.get_or_create(user=request.user)
    if not profile_complete(request.user):
        return redirect("questions")

    today = timezone.localdate()
    goal = get_daily_goal(request.user)
    summary = DailySummary.objects.filter(user=request.user, date=today).first()

    return render(request, "fitness/index.html", {
        "steps_today": summary.steps if summary else 0,
        "steps_goal": goal.steps or 10000,
    })

@login_required
def workouts(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/workouts.html")

@login_required
def meals(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/meals.html")

@login_required
def steps(request: HttpRequest) -> HttpResponse:
    today = timezone.localdate()
    goal = get_daily_goal(request.user)
    summary = DailySummary.objects.filter(user=request.user, date=today).first()

    return render(request, "fitness/steps.html", {
        "steps_today": summary.steps if summary else 0,
        "steps_goal": goal.steps or 10000,
    })

@login_required
def dashboard(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/dashboard.html")

@login_required
def ai(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/ai.html")

def help_view(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/help.html")

def privacy(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/privacy.html")

@login_required
def videos(request: HttpRequest) -> HttpResponse:
    return render(request, "fitness/videos.html")

@login_required
@require_GET
def meal_search(request: HttpRequest) -> JsonResponse:
    if requests is None:
        return JsonResponse({"error": "Requests library not available on server."}, status=500)

    api_key = os.getenv("USDA_API_KEY")
    if not api_key:
        return JsonResponse({"error": "Missing USDA API key"}, status=500)

    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"results": []})

    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "api_key": api_key,
        "query": query,
        "pageSize": 10,
    }

    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        return JsonResponse({"error": "Search failed", "details": str(e)}, status=500)

    foods = data.get("foods", [])
    results = []

    for f in foods:
        desc = f.get("description", "")
        nutrients = f.get("foodNutrients", [])
        calories = protein = carbs = fat = 0

        for n in nutrients:
            amount = n.get("amount") or n.get("value") or 0
            nutrient = n.get("nutrient", {})
            number = nutrient.get("number")
            nid = nutrient.get("id") or n.get("nutrientId")

            if number == "208" or nid == 1008:
                calories = amount
            elif number == "203" or nid == 1003:
                protein = amount
            elif number == "205" or nid == 1005:
                carbs = amount
            elif number == "204" or nid == 1004:
                fat = amount

        results.append({
            "name": desc,
            "calories": int(calories),
            "protein": float(protein),
            "carbs": float(carbs),
            "fat": float(fat),
        })

    return JsonResponse({"results": results})

@login_required
@require_POST
def food_scan(request: HttpRequest) -> JsonResponse:
    if google_genai is None:
        return JsonResponse({"error": "google-genai library not available."}, status=500)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return JsonResponse({"error": "Missing GEMINI_API_KEY"}, status=500)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    image_data = payload.get("image", "")
    mime_type = payload.get("mime_type", "image/jpeg")

    if not image_data:
        return JsonResponse({"error": "No image provided"}, status=400)

    try:
        import base64
        image_bytes = base64.b64decode(image_data)
        client = google_genai.Client(api_key=api_key)
        prompt = (
            "Look at this plate of food. Estimate the total calories, protein (g), carbs (g), "
            "and fat (g). Reply ONLY with valid JSON in this exact format with no markdown: "
            '{"name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}'
        )
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                prompt,
                genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        result = json.loads(text.strip())
    except Exception as e:
        return JsonResponse({"error": "Scan failed", "details": str(e)}, status=500)

    return JsonResponse({
        "name": str(result.get("name", "Food")),
        "calories": int(result.get("calories", 0)),
        "protein": float(result.get("protein", 0)),
        "carbs": float(result.get("carbs", 0)),
        "fat": float(result.get("fat", 0)),
    })

@login_required
@require_POST
def meal_log(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    name = payload.get("name", "Food")
    kc = int(payload.get("calories", 0))
    p = float(payload.get("protein_g", 0))
    c = float(payload.get("carbs_g", 0))
    f = float(payload.get("fat_g", 0))

    dt = timezone.now()
    if payload.get("logged_at"):
        try:
            dt = datetime.fromisoformat(payload["logged_at"].replace("Z", "+00:00"))
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
        except Exception:
            dt = timezone.now()

    entry = MealEntry.objects.create(
        user=request.user,
        name=name,
        calories=kc,
        protein_g=p,
        carbs_g=c,
        fat_g=f,
        date=timezone.localdate(dt),
        logged_at=dt,
    )

    summary = update_today_summary(request.user)

    return JsonResponse({
        "ok": True,
        "entry": {
            "id": entry.id,
            "name": entry.name,
            "calories": entry.calories,
            "protein_g": entry.protein_g,
            "carbs_g": entry.carbs_g,
            "fat_g": entry.fat_g,
            "logged_at": entry.logged_at.isoformat()
        },
        "summary": {
            "calories": summary.calories,
            "protein_g": summary.protein_g,
            "carbs_g": summary.carbs_g,
            "fat_g": summary.fat_g,
        }
    })

@login_required
@require_POST
def meal_goals(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    g, _ = DailyGoal.objects.get_or_create(user=request.user)

    for fld in ["calories", "protein_g", "carbs_g", "fat_g", "steps"]:
        if fld in payload:
            try:
                setattr(g, fld, max(0, int(payload[fld])))
            except (TypeError, ValueError):
                pass

    g.save()
    return JsonResponse({"ok": True})


@login_required
@require_GET
def meals_day(request):
    date_str = request.GET.get("date")
    date = timezone.localdate()

    if date_str:
        try:
            date = datetime.fromisoformat(date_str).date()
        except ValueError:
            pass

    goal = get_daily_goal(request.user)

    summary = DailySummary.objects.filter(
        user=request.user,
        date=date
    ).first()

    meals = MealEntry.objects.filter(
        user=request.user,
        date=date
    ).order_by("-logged_at")

    return JsonResponse({
        "date": date.isoformat(),

        "goal": {
            "calories": goal.calories or 0,
            "protein": goal.protein_g or 0,
            "carbs": goal.carbs_g or 0,
            "fat": goal.fat_g or 0,
        },

        "summary": {
            "calories": summary.calories if summary else 0,
            "protein": summary.protein_g if summary else 0,
            "carbs": summary.carbs_g if summary else 0,
            "fat": summary.fat_g if summary else 0,
        },

        "meals": [
            {
                "id": meal.id,
                "name": meal.name,
                "calories": meal.calories,
                "protein": meal.protein_g,
                "carbs": meal.carbs_g,
                "fat": meal.fat_g,
            }
            for meal in meals
        ]
    })

@login_required
@require_POST
def steps_add_manual(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    steps_val = max(0, int(payload.get("steps", 0)))
    now = timezone.now()

    StepSample.objects.update_or_create(
        user=request.user,
        start=now.replace(hour=0, minute=0, second=0, microsecond=0),
        defaults={
            "end": now,
            "steps": steps_val,
            "source": "manual"
        }
    )

    summary = update_today_summary(request.user)

    return JsonResponse({"ok": True, "steps": summary.steps})

@login_required
@require_POST
def ai_suggest(request: HttpRequest) -> JsonResponse:
    try:
        prompt = json.loads(request.body.decode("utf-8")).get("prompt", "")
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    today = timezone.localdate()
    g, _ = DailyGoal.objects.get_or_create(user=request.user)
    s = DailySummary.objects.filter(user=request.user, date=today).first()

    steps = getattr(s, "steps", 0) if s else 0
    kc = getattr(s, "calories", 0) if s else 0
    reply = ""
    text = (prompt or "").lower()

    if "workout" in text:
        if steps < (g.steps or 0) * 0.5:
            reply = "You haven't moved much today — try a 20–30 min light workout: bodyweight squats, pushups, planks."
        else:
            reply = "You're active today! Try a 30–40 min strength session: dumbbells, rows, lunges, core work."
    elif "meal" in text or "food" in text:
        remaining = (g.calories or 0) - kc
        if remaining > 500:
            reply = f"You still have {remaining} kcal left. Try a balanced meal: chicken + rice + veggies."

    return JsonResponse({"reply": reply})

@login_required
@require_POST
def clear_today_meals(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
        date = datetime.fromisoformat(payload["date"]).date()
    except Exception:
        date = localdate()

    MealEntry.objects.filter(user=request.user, date=date).delete()

    summary = update_today_summary(request.user)

    return JsonResponse({
        "status": "ok",
        "summary": {
            "calories": summary.calories,
            "protein": summary.protein_g,
            "carbs": summary.carbs_g,
            "fat": summary.fat_g,
        }
    })

@login_required
def workout_dashboard(request):
    return render(request, "fitness/workouts.html")

@login_required
def log_workout(request):
    return render(request, "fitness/log-workout.html")


@login_required
def add_workout(request):
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return render(request, "fitness/add-workout.html", {
        "days": days
    })


@login_required
def exercise_list(request):
    body_parts = [
        "back", "cardio", "chest", "lower arms", "lower legs",
        "neck", "shoulders", "upper arms", "upper legs", "waist",
    ]
    return render(request, "fitness/exercise-list.html", {"body_parts": body_parts})

@login_required
def add_exercise(request):
    return render(request, "fitness/add-exercise.html")

@require_POST
@login_required
def api_save_workout(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return HttpResponseBadRequest("Invalid JSON")

    name = (data.get("name") or "").strip()
    days = data.get("days", [])
    exercises = data.get("exercises", [])

    name = name or "Draft workout"

    workout = Workout.objects.create(
        user=request.user,
        name=name,
        days=days
    )

    for ex in exercises:
        wex = WorkoutExercise.objects.create(
            workout=workout,
            api_id=ex.get("id"),
            name=ex.get("name"),
            category=ex.get("category", ""),
            target=ex.get("target", ""),
            equipment=ex.get("equipment", ""),
            media_url=ex.get("media_url") or (ex.get("media") or {}).get("url", ""),
        )
        for s in ex.get("sets", []):
            ExerciseSet.objects.create(
                exercise=wex,
                reps=s.get("reps", 0),
                minutes=s.get("minutes", 0),
                weight_value=(s.get("weight") or {}).get("value", 0),
                weight_unit=(s.get("weight") or {}).get("unit", "kg"),
            )

    return JsonResponse({
        "ok": True,
        "id": workout.id
    })

@login_required
@require_GET
def api_list_workouts(request):
    workouts = Workout.objects.filter(user=request.user).order_by("-created_at")
    data = []
    for w in workouts:
        data.append({
            "id": w.id,
            "name": w.name,
            "days": w.days,
            "created_at": w.created_at.isoformat(),
            "exercise_count": w.exercises.count(),
        })
    return JsonResponse({"workouts": data})

@login_required
@require_GET
def api_get_workout(request, id):
    try:
        w = Workout.objects.get(id=id, user=request.user)
    except Workout.DoesNotExist:
        return HttpResponseBadRequest("Not found")

    exs = []
    for ex in w.exercises.all():
        exs.append({
            "id": ex.id,
            "api_id": ex.api_id,
            "name": ex.name,
            "category": ex.category,
            "target": ex.target,
            "equipment": ex.equipment,
            "media_url": ex.media_url,
            "sets": [
                {
                    "reps": s.reps,
                    "minutes": s.minutes,
                    "weight_value": s.weight_value,
                    "weight_unit": s.weight_unit
                }
                for s in ex.sets.all()
            ]
        })

    return JsonResponse({
        "id": w.id,
        "name": w.name,
        "days": w.days,
        "exercises": exs
    })

@login_required
@require_POST
def api_delete_workout(request, id):
    Workout.objects.filter(id=id, user=request.user).delete()
    return JsonResponse({"ok": True})

@login_required
@require_POST
def api_log_session(request):
    today = timezone.localdate()
    duration_minutes = 0
    try:
        payload = json.loads(request.body.decode('utf-8'))
        duration_minutes = int(payload.get('duration_minutes', 0))
    except Exception:
        pass

    WorkoutSession.objects.create(
        user=request.user,
        date=today,
        name="Workout session",
        duration_minutes=duration_minutes,
    )

    start = today - timedelta(days=6)
    sessions_achieved = WorkoutSession.objects.filter(
        user=request.user,
        date__gte=start,
        date__lte=today,
    ).count()

    return JsonResponse({"ok": True, "daysAchieved": sessions_achieved})



@login_required
@require_GET
def api_weekly_summary(request):
    today = timezone.localdate()
    start = today - timedelta(days=6)

    all_sessions = WorkoutSession.objects.filter(
        user=request.user,
        date__gte=start,
        date__lte=today,
    )

    sessions = [
        s.date() if hasattr(s, "date") else s
        for s in all_sessions.values_list("date", flat=True)
    ]

    durations = [s.duration_minutes for s in all_sessions if s.duration_minutes > 0]
    avg_duration = round(sum(durations) / len(durations)) if durations else 0

    c = Counter(sessions)

    labels, counts = [], []
    for i in range(7):
        d = start + timedelta(days=i)
        labels.append(d.strftime("%a"))
        counts.append(c.get(d, 0))

    return JsonResponse({
        "labels": labels,
        "counts": counts,
        "weeklyGoal": 0,
        "daysAchieved": sum(counts),
        "avgDuration": avg_duration,
    })

@login_required
@require_POST
def api_update_workout(request, id):
    try:
        w = Workout.objects.get(id=id, user=request.user)
    except Workout.DoesNotExist:
        return HttpResponseBadRequest("Workout not found")

    payload = json.loads(request.body.decode("utf-8"))
    name = payload.get("name", "").strip()
    days = payload.get("days", [])
    exercises = payload.get("exercises", [])

    if not name:
        return HttpResponseBadRequest("Missing name")

    w.name = name
    w.days = days
    w.save()

    w.exercises.all().delete()

    for ex in exercises:
        wex = WorkoutExercise.objects.create(
            workout=w,
            api_id=ex.get("api_id") or ex.get("id"),
            name=ex.get("name"),
            category=ex.get("category", ""),
            target=ex.get("target", ""),
            equipment=ex.get("equipment", ""),
            media_url=ex.get("media_url") or (ex.get("media") or {}).get("url", ""),
        )
        for s in ex.get("sets", []):
            ExerciseSet.objects.create(
                exercise=wex,
                reps=s.get("reps", 0),
                minutes=s.get("minutes", 0),
                weight_value=s.get("weight_value") or (s.get("weight") or {}).get("value", 0),
                weight_unit=s.get("weight_unit") or (s.get("weight") or {}).get("unit", "kg"),
            )

    return JsonResponse({"ok": True, "id": w.id})

@require_GET
@login_required
def search_exercises(request):
    from .models import CustomExercise
    from django.db.models import Q

    q = request.GET.get("q", "").strip()
    body_part = request.GET.get("bodyPart", "").strip().lower()
    equipment = request.GET.get("equipment", "").strip().lower()
    limit = min(int(request.GET.get("limit", "20")), 100)

    qs = CustomExercise.objects.all()
    if q:
        qs = qs.filter(name__icontains=q)
    if body_part:
        qs = qs.filter(Q(body_part__icontains=body_part) | Q(category__icontains=body_part))
    if equipment:
        qs = qs.filter(equipment__icontains=equipment)

    if not q and not body_part and not equipment:
        qs = qs.order_by('name')

    qs = qs[:limit]

    if not qs.exists():
        return JsonResponse({"items": [], "count": 0, "seeded": CustomExercise.objects.exists()})

    items = []
    for ex in qs:
        url = ex.gif_url or ex.image_url
        url2 = url.replace("/0.jpg", "/1.jpg") if url and "/0.jpg" in url else url
        items.append({
            "id": f"db_{ex.id}",
            "name": ex.name,
            "category": ex.body_part,
            "url": url,
            "url2": url2,
            "equipment": ex.equipment,
            "target": ex.target,
            "instructions": ex.instructions,
            "level": ex.level,
        })
    return JsonResponse({"items": items, "count": len(items)})


def pwa_manifest(request):
    manifest = {
        "name": "PIVO Fitness",
        "short_name": "PIVO",
        "description": "Your personal fitness companion",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#faf9f7",
        "theme_color": "#e91e8c",
        "orientation": "portrait-primary",
        "icons": [
            {"src": "/static/images/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/static/images/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/static/images/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    return JsonResponse(manifest)


def pwa_sw(request):
    sw = """
const CACHE = 'pivo-v1';
const PRECACHE = ['/', '/static/css/pivo.css', '/static/js/script.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
""".strip()
    return HttpResponse(sw, content_type="application/javascript")


def serve_stored_file(request, name):
    """Serve a file stored as base64 in the database."""
    import base64
    from .models import StoredFile
    try:
        f = StoredFile.objects.get(name=name)
        data = base64.b64decode(f.data)
        resp = HttpResponse(data, content_type=f.content_type)
        resp["Cache-Control"] = "public, max-age=604800"
        return resp
    except StoredFile.DoesNotExist:
        return HttpResponse(status=404)


def gif_proxy(request):
    """Proxy WorkoutX GIF so the API key never leaves the server and CORS is avoided."""
    from workoutx import WorkoutX
    filename = request.GET.get("f", "").strip()
    if not filename:
        return JsonResponse({"error": "missing f param"}, status=400)
    api_key = os.environ.get("WORKOUTX_API_KEY")
    if not api_key:
        return JsonResponse({"error": "WORKOUTX_API_KEY not set"}, status=503)
    try:
        wx = WorkoutX(api_key=api_key)
        data = wx.gifs.get(filename)
        resp = HttpResponse(data, content_type="image/gif")
        resp["Cache-Control"] = "public, max-age=86400"
        return resp
    except Exception as e:
        return JsonResponse({"error": str(e), "filename": filename}, status=404)


from datetime import timedelta
from django.utils import timezone
from django.db import models
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse


# ── Community ─────────────────────────────────────────────────────────────────

def _time_ago(dt):
    now = timezone.now()
    s = int((now - dt).total_seconds())
    if s < 60: return 'just now'
    if s < 3600: return f'{s // 60}m ago'
    if s < 86400: return f'{s // 3600}h ago'
    if s < 604800: return f'{s // 86400}d ago'
    return dt.strftime('%b %d')

def _serialize_post(post, current_user):
    avatar_url = None
    try:
        if post.user.profile.avatar:
            avatar_url = post.user.profile.avatar.url
    except Exception:
        pass
    return {
        'id': post.id,
        'user': {
            'username': post.user.username,
            'avatar': avatar_url,
            'initials': post.user.username[0].upper(),
        },
        'content': post.content,
        'image': post.image.url if post.image else None,
        'time_ago': _time_ago(post.created_at),
        'likes_count': post.likes.count(),
        'liked_by_me': post.likes.filter(id=current_user.id).exists(),
        'comments_count': post.comments.count(),
        'is_mine': post.user_id == current_user.id,
    }

@login_required
def community(request):
    return render(request, 'fitness/community.html')

@login_required
def api_posts(request):
    if request.method == 'POST':
        content = request.POST.get('content', '').strip()
        image = request.FILES.get('image')
        if not content and not image:
            return JsonResponse({'error': 'Post must have text or an image.'}, status=400)
        post = Post.objects.create(user=request.user, content=content, image=image)
        return JsonResponse({'ok': True, 'post': _serialize_post(post, request.user)})

    page = max(1, int(request.GET.get('page', 1)))
    limit = 10
    offset = (page - 1) * limit
    qs = Post.objects.select_related('user', 'user__profile').prefetch_related('likes', 'comments')
    total = qs.count()
    posts = qs[offset:offset + limit]
    return JsonResponse({
        'posts': [_serialize_post(p, request.user) for p in posts],
        'has_more': total > offset + limit,
    })

@login_required
@require_POST
def api_post_like(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    if post.likes.filter(id=request.user.id).exists():
        post.likes.remove(request.user)
        liked = False
    else:
        post.likes.add(request.user)
        liked = True
    return JsonResponse({'ok': True, 'liked': liked, 'likes_count': post.likes.count()})

@login_required
@require_POST
def api_post_delete(request, pk):
    try:
        post = Post.objects.get(pk=pk, user=request.user)
        if post.image:
            post.image.delete(save=False)
        post.delete()
    except Post.DoesNotExist:
        pass
    return JsonResponse({'ok': True})

@login_required
def api_post_comments(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return HttpResponseBadRequest('Invalid JSON')
        content = payload.get('content', '').strip()
        if not content:
            return JsonResponse({'error': 'Comment cannot be empty.'}, status=400)
        comment = Comment.objects.create(post=post, user=request.user, content=content)
        avatar_url = None
        try:
            if request.user.profile.avatar:
                avatar_url = request.user.profile.avatar.url
        except Exception:
            pass
        return JsonResponse({'ok': True, 'comment': {
            'id': comment.id,
            'user': {'username': request.user.username, 'avatar': avatar_url, 'initials': request.user.username[0].upper()},
            'content': comment.content,
            'time_ago': 'just now',
        }})

    comments = post.comments.select_related('user', 'user__profile').all()
    result = []
    for c in comments:
        avatar_url = None
        try:
            if c.user.profile.avatar:
                avatar_url = c.user.profile.avatar.url
        except Exception:
            pass
        result.append({
            'id': c.id,
            'user': {'username': c.user.username, 'avatar': avatar_url, 'initials': c.user.username[0].upper()},
            'content': c.content,
            'time_ago': _time_ago(c.created_at),
        })
    return JsonResponse({'comments': result})


@login_required
@require_GET
def api_notifications_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return JsonResponse({'count': count})

@login_required
@require_GET
def api_notifications(request):
    notifs = Notification.objects.filter(recipient=request.user).select_related('sender', 'post')[:20]
    data = [{
        'id': n.id,
        'sender': n.sender.username,
        'post_id': n.post_id,
        'is_read': n.is_read,
        'time_ago': _time_ago(n.created_at),
    } for n in notifs]
    return JsonResponse({'notifications': data})

@login_required
@require_POST
def api_notifications_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return JsonResponse({'ok': True})


def _serialize_challenge(challenge, current_user):
    participants = list(
        challenge.participations.select_related('user').values_list('user__username', flat=True)[:10]
    )
    return {
        'id': challenge.id,
        'title': challenge.title,
        'description': challenge.description,
        'creator': challenge.creator.username,
        'end_date': str(challenge.end_date),
        'participant_count': challenge.participations.count(),
        'participants': participants,
        'is_joined': challenge.participations.filter(user=current_user).exists(),
        'is_mine': challenge.creator_id == current_user.id,
    }

@login_required
def api_challenges(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return HttpResponseBadRequest('Invalid JSON')
        from datetime import date, timedelta
        end_date = data.get('end_date') or str(date.today() + timedelta(days=7))
        challenge = Challenge.objects.create(
            creator=request.user,
            title=(data.get('title') or '').strip(),
            description=(data.get('description') or '').strip(),
            end_date=end_date,
        )
        ChallengeParticipant.objects.create(challenge=challenge, user=request.user)
        return JsonResponse({'ok': True, 'challenge': _serialize_challenge(challenge, request.user)})

    challenges = Challenge.objects.select_related('creator').prefetch_related('participations')
    return JsonResponse({'challenges': [_serialize_challenge(c, request.user) for c in challenges]})

@login_required
@require_POST
def api_challenge_join(request, pk):
    try:
        challenge = Challenge.objects.get(pk=pk)
    except Challenge.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    participation, created = ChallengeParticipant.objects.get_or_create(challenge=challenge, user=request.user)
    if not created:
        participation.delete()
        joined = False
    else:
        joined = True
    participants = list(
        challenge.participations.select_related('user').values_list('user__username', flat=True)[:10]
    )
    return JsonResponse({
        'ok': True,
        'joined': joined,
        'participant_count': challenge.participations.count(),
        'participants': participants,
    })


@login_required
def api_dashboard_month(request):
    user = request.user
    today = timezone.localdate()
    start = today - timedelta(days=29)

    labels = []
    steps = []
    workouts = []
    weight = []

    base_weight = float(user.profile.weight or 0)

    all_sessions = WorkoutSession.objects.filter(user=user, date__gte=start, date__lte=today)
    session_duration_map = {}
    for s in all_sessions:
        d = s.date
        if d not in session_duration_map or s.duration_minutes > session_duration_map[d]:
            session_duration_map[d] = s.duration_minutes

    durations_nonzero = [v for v in session_duration_map.values() if v > 0]
    avg_duration = round(sum(durations_nonzero) / len(durations_nonzero)) if durations_nonzero else 0

    for i in range(30):
        day = start + timedelta(days=i)
        labels.append(day.strftime("%d"))

        summary = DailySummary.objects.filter(user=user, date=day).first()
        steps.append(summary.steps if summary else 0)

        dur = session_duration_map.get(day, 0)
        workouts.append(dur if dur else (1 if day in session_duration_map else 0))

        weight.append(base_weight)

    return JsonResponse({
        "labels": labels,
        "steps": steps,
        "workouts": workouts,
        "weight": weight,
        "avgDuration": avg_duration,
    })
