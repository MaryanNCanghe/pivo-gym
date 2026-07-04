"""
Seed the CustomExercise table from the free-exercise-db open-source dataset.
Run once on Vercel via `python manage.py seed_exercises` or via wsgi.py on cold start.

Dataset: https://github.com/yuhonas/free-exercise-db
Images:  https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/{n}.jpg
"""
import json
import urllib.request
from django.core.management.base import BaseCommand

EXERCISES_JSON_URL = (
    "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
)
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"


class Command(BaseCommand):
    help = "Seed exercises from free-exercise-db (idempotent)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-seed even if exercises already exist",
        )

    def handle(self, *args, **options):
        from fitness.models import CustomExercise

        if not options["force"] and CustomExercise.objects.exists():
            self.stdout.write("Exercises already seeded. Use --force to re-seed.")
            return

        self.stdout.write("Downloading exercise data...")
        try:
            with urllib.request.urlopen(EXERCISES_JSON_URL, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            self.stderr.write(f"Failed to download exercises: {e}")
            return

        self.stdout.write(f"Importing {len(data)} exercises...")
        created = updated = 0

        for ex in data:
            ex_id = ex.get("id", "")
            images = ex.get("images", [])
            image_url = f"{IMAGE_BASE}/{images[0]}" if images else ""
            gif_url = f"{IMAGE_BASE}/{images[0]}" if images else ""

            primary = ex.get("primary_muscles", [])
            secondary = ex.get("secondary_muscles", [])
            target = primary[0] if primary else ""
            body_part = ex.get("category", "")

            defaults = {
                "name": ex.get("name", ""),
                "body_part": body_part,
                "equipment": ex.get("equipment", ""),
                "target": target,
                "secondary_muscles": secondary,
                "instructions": ex.get("instructions", []),
                "image_url": image_url,
                "gif_url": gif_url,
                "level": ex.get("level", ""),
                "force": ex.get("force") or "",
                "mechanic": ex.get("mechanic") or "",
                "category": body_part,
            }

            _, is_new = CustomExercise.objects.update_or_create(
                external_id=ex_id, defaults=defaults
            )
            if is_new:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — {created} created, {updated} updated."
            )
        )
