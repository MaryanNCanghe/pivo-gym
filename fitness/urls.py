from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("", views.index, name="index"),

    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),

    path("password-reset/", auth_views.PasswordResetView.as_view(
        template_name="registration/password_reset_form.html",
        email_template_name="registration/password_reset_email.html",
        subject_template_name="registration/password_reset_subject.txt",
    ), name="password_reset"),
    path("password-reset/done/", auth_views.PasswordResetDoneView.as_view(
        template_name="registration/password_reset_done.html",
    ), name="password_reset_done"),
    path("reset/<uidb64>/<token>/", auth_views.PasswordResetConfirmView.as_view(
        template_name="registration/password_reset_confirm.html",
    ), name="password_reset_confirm"),
    path("reset/done/", auth_views.PasswordResetCompleteView.as_view(
        template_name="registration/password_reset_complete.html",
    ), name="password_reset_complete"),

    path("profile/", views.profile, name="profile"),
    path("profile/avatar/", views.upload_avatar, name="upload_avatar"),
    path("profile/progress/add/", views.upload_progress_photo, name="upload_progress_photo"),
    path("profile/progress/delete/<int:pk>/", views.delete_progress_photo, name="delete_progress_photo"),
    path("questions/", views.questions, name="questions"),

    path("workouts/", views.workouts, name="workouts"),
    path("log-workout/", views.log_workout, name="log_workout"),
    path("add-workout/", views.add_workout, name="add_workout"),
    path("exercise-list/", views.exercise_list, name="exercise_list"),
    path("add-exercise/", views.add_exercise, name="add_exercise"),

    path("meals/", views.meals, name="meals"),
    path("recipes/", views.recipes, name="recipes"),
    path("recipes/add/", views.add_recipe, name="add_recipe"),
    path("recipes/delete/<int:pk>/", views.delete_recipe, name="delete_recipe"),
    path("recipes/<int:pk>/log/", views.log_recipe_as_meal, name="log_recipe_as_meal"),
    path("steps/", views.steps, name="steps"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("ai/", views.ai, name="ai"),
    path("help/", views.help_view, name="help"),

    path("meals/search/", views.meal_search, name="meal_search"),
    path("meals/scan/", views.food_scan, name="food_scan"),
    path("meals/log/", views.meal_log, name="meal_log"),
    path("meals/goals/", views.meal_goals, name="meal_goals"),
    path("meals/clear-today/", views.clear_today_meals, name="clear_today_meals"),

    path("steps/add/", views.steps_add_manual, name="steps_add_manual"),

    path("ai/suggest/", views.ai_suggest, name="ai_suggest"),

    path("api/workouts/save/", views.api_save_workout, name="api_save_workout"),
    path("api/workouts/list/", views.api_list_workouts, name="api_list_workouts"),
    path("api/workouts/get/<int:id>/", views.api_get_workout, name="api_get_workout"),
    path("api/workouts/delete/<int:id>/", views.api_delete_workout, name="api_delete_workout"),
    path("api/workouts/log-session/", views.api_log_session, name="api_log_session"),
    path("api/workouts/weekly-summary/", views.api_weekly_summary, name="api_weekly_summary"),
    path("api/workouts/update/<int:id>/", views.api_update_workout, name="api_update_workout"),

    path("api/exercises/search/", views.search_exercises, name="search_exercises"),


path("meals/day/", views.meals_day),
path("api/dashboard/month/", views.api_dashboard_month),

    path("community/", views.community, name="community"),
    path("api/posts/", views.api_posts, name="api_posts"),
    path("api/posts/<int:pk>/like/", views.api_post_like, name="api_post_like"),
    path("api/posts/<int:pk>/delete/", views.api_post_delete, name="api_post_delete"),
    path("api/posts/<int:pk>/comments/", views.api_post_comments, name="api_post_comments"),

    path("api/notifications/", views.api_notifications, name="api_notifications"),
    path("api/notifications/count/", views.api_notifications_count, name="api_notifications_count"),
    path("api/notifications/read/", views.api_notifications_read, name="api_notifications_read"),

    path("api/challenges/", views.api_challenges, name="api_challenges"),
    path("api/challenges/<int:pk>/join/", views.api_challenge_join, name="api_challenge_join"),
]
