from django.utils import timezone
from django.db.models import Sum
from django.contrib.auth.models import User

from .models import (
    Profile,
    MealEntry,
    DailySummary,
    DailyGoal,
    StepSample,
)

def profile_complete(user: User) -> bool:
    profile, _ = Profile.objects.get_or_create(user=user)

    has_all = (
        profile.gender and
        profile.age and
        profile.weight and
        profile.height and
        profile.objective
    )
    return bool(has_all)


def update_today_summary(user: User) -> DailySummary:
    today = timezone.localdate()

    meal_totals = MealEntry.objects.filter(
        user=user,
        date=today
    ).aggregate(
        calories=Sum("calories"),
        protein_g=Sum("protein_g"),
        carbs_g=Sum("carbs_g"),
        fat_g=Sum("fat_g"),
    )

    steps_total = StepSample.objects.filter(
        user=user,
        start__date=today
    ).aggregate(total=Sum("steps"))["total"] or 0

    summary, _ = DailySummary.objects.get_or_create(
        user=user,
        date=today,
        defaults={
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "steps": 0,
        }
    )

    summary.calories = meal_totals["calories"] or 0
    summary.protein_g = meal_totals["protein_g"] or 0
    summary.carbs_g = meal_totals["carbs_g"] or 0
    summary.fat_g = meal_totals["fat_g"] or 0
    summary.steps = steps_total

    summary.save()
    return summary


def get_daily_goal(user: User) -> DailyGoal:
    goal, _ = DailyGoal.objects.get_or_create(
        user=user,
        defaults={
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "steps": 0,
        }
    )
    return goal


def reset_daily_goal(user: User):
    goal = get_daily_goal(user)
    goal.calories = 0
    goal.protein_g = 0
    goal.carbs_g = 0
    goal.fat_g = 0
    goal.steps = 0
    goal.save()


def clear_today_meals(user: User) -> DailySummary:
    today = timezone.localdate()

    MealEntry.objects.filter(
        user=user,
        date=today
    ).delete()

    return update_today_summary(user)


def clear_today_steps(user: User) -> DailySummary:
    today = timezone.localdate()

    StepSample.objects.filter(
        user=user,
        start__date=today
    ).delete()

    return update_today_summary(user)


def get_today_data(user: User) -> dict:
    today = timezone.localdate()

    goal = get_daily_goal(user)
    summary, _ = DailySummary.objects.get_or_create(
        user=user,
        date=today
    )

    remaining = max(0, goal.calories - summary.calories)

    return {
        "goal": goal.calories,
        "consumed": summary.calories,
        "remaining": remaining,
        "protein": summary.protein_g,
        "carbs": summary.carbs_g,
        "fat": summary.fat_g,
        "steps": summary.steps,
    }
