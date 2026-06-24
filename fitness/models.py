from django.conf import settings
from django.db import models
from django.utils import timezone
from django.db.models import Sum

OBJECTIVE_CHOICES = [
    ("lose", "Lose Weight"),
    ("gain", "Gain Weight"),
    ("maintain", "Maintain Weight"),
]

GENDER_CHOICES = [
    ("female", "Female"),
    ("male", "Male"),
]

def today_localdate():
    return timezone.localdate()

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)
    objective = models.CharField(max_length=10, choices=OBJECTIVE_CHOICES, default="maintain")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    def __str__(self):
        return f"{self.user} Profile"


class ProgressPhoto(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    photo = models.ImageField(upload_to="progress/%Y/%m/")
    note = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.user} progress photo {self.uploaded_at:%Y-%m-%d}"

class DailyGoal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    calories = models.PositiveIntegerField(default=2200)
    protein_g = models.PositiveIntegerField(default=150)
    carbs_g = models.PositiveIntegerField(default=250)
    fat_g = models.PositiveIntegerField(default=70)
    steps = models.PositiveIntegerField(default=10000)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Goals({self.user}) kc:{self.calories} P:{self.protein_g} C:{self.carbs_g} F:{self.fat_g} steps:{self.steps}"

class DailySummary(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField()
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fat_g = models.FloatField(default=0)
    steps = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("user", "date")

    def __str__(self):
        return f"Summary({self.user}, {self.date}) kc:{self.calories} P:{self.protein_g} C:{self.carbs_g} F:{self.fat_g} steps:{self.steps}"

class MealEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=255)

    calories = models.PositiveIntegerField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fat_g = models.FloatField(default=0)

    logged_at = models.DateTimeField(default=timezone.now)
    date = models.DateField(default=today_localdate)

    class Meta:
        ordering = ['-logged_at', '-created_at']

    def __str__(self):
        return f"Meal({self.user}, {self.name}, {self.calories} kcal)"

class StepSample(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start = models.DateTimeField()
    end = models.DateTimeField()
    steps = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=64, default="manual")

    def __str__(self):
        return f"Steps({self.user}, {self.steps} @ {self.start}–{self.end}, src:{self.source})"

def update_today_summary(user, date=None):
    if date is None:
        date = timezone.localdate()
    today = date
    summary, _ = DailySummary.objects.get_or_create(user=user, date=today)

    agg = MealEntry.objects.filter(user=user, date=today).aggregate(
        kc=Sum("calories"), p=Sum("protein_g"), c=Sum("carbs_g"), f=Sum("fat_g")
    )
    summary.calories = agg["kc"] or 0
    summary.protein_g = agg["p"] or 0
    summary.carbs_g = agg["c"] or 0
    summary.fat_g = agg["f"] or 0

    steps_today = StepSample.objects.filter(
        user=user, start__date=today
    ).aggregate(s=Sum("steps"))["s"] or 0
    summary.steps = steps_today

    summary.save()
    return summary

class Workout(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    days = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkoutExercise(models.Model):
    workout = models.ForeignKey(Workout, related_name="exercises", on_delete=models.CASCADE)

    api_id = models.CharField(max_length=120)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80, blank=True)
    target = models.CharField(max_length=80, blank=True)
    equipment = models.CharField(max_length=80, blank=True)
    media_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.name}"

class ExerciseSet(models.Model):
    exercise = models.ForeignKey(WorkoutExercise, related_name="sets", on_delete=models.CASCADE)
    reps = models.IntegerField(default=0)
    minutes = models.FloatField(default=0)
    weight_value = models.FloatField(default=0)
    weight_unit = models.CharField(max_length=5, default="kg")

    def __str__(self):
        return f"{self.reps} reps"

GOAL_CHOICES = [
    ("gain", "Gain Weight"),
    ("maintain", "Maintain"),
    ("lose", "Lose Weight"),
]

MEAL_TYPE_CHOICES = [
    ("breakfast", "Breakfast"),
    ("lunch", "Lunch"),
    ("dinner", "Dinner"),
    ("snack", "Snack"),
    ("pre_training", "Pre-Training"),
    ("post_training", "Post-Training"),
]


class Recipe(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES, blank=True)
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES)
    description = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    calories = models.PositiveIntegerField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fat_g = models.FloatField(default=0)
    image = models.ImageField(upload_to="recipes/", null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["goal", "meal_type", "name"]

    def __str__(self):
        return f"{self.name} ({self.goal or 'any'})"


class WorkoutSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120, default="Workout")
    date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date",]

    def __str__(self):
        return f"{self.user} session on {self.date}"


class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(blank=True)
    image = models.FileField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post({self.user}, {self.created_at:%Y-%m-%d})"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='post_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment({self.user} on Post {self.post_id})"


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_notifications')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification({self.recipient} from {self.sender})"


class Challenge(models.Model):
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_challenges')
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('challenge', 'user')
