"""
Seed the CustomExercise table from the bundled free-exercise-db dataset.

Dataset: https://github.com/yuhonas/free-exercise-db
Images:  https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/{n}.jpg
"""
import gzip
import json
import os
from django.core.management.base import BaseCommand

IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"
FIXTURE = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "exercises.json.gz")


class Command(BaseCommand):
    help = "Seed exercises from bundled fixture (idempotent)"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Re-seed even if exercises already exist")

    def handle(self, *args, **options):
        from fitness.models import CustomExercise

        if not options["force"] and CustomExercise.objects.exists():
            # Auto-fix: if all exercises have empty target it means the camelCase bug hit them
            needs_fix = not CustomExercise.objects.exclude(target="").exists()
            if not needs_fix:
                self.stdout.write("Exercises already seeded.")
                return
            self.stdout.write("Reseeding to fix muscle target data...")

        try:
            with gzip.open(FIXTURE, "rb") as f:
                data = json.loads(f.read().decode("utf-8"))
        except Exception as e:
            self.stderr.write(f"Failed to load exercise fixture: {e}")
            return

        self.stdout.write(f"Importing {len(data)} exercises...")

        objs = []
        for ex in data:
            ex_id = ex.get("id", "")
            if not ex_id:
                continue
            images = ex.get("images", [])
            image_url = f"{IMAGE_BASE}/{images[0]}" if images else ""
            # primaryMuscles is camelCase in the free-exercise-db JSON
            primary = ex.get("primaryMuscles") or []
            secondary = ex.get("secondaryMuscles") or []
            body_part = ex.get("category", "")

            objs.append(CustomExercise(
                external_id=ex_id,
                name=ex.get("name", ""),
                body_part=body_part,
                equipment=ex.get("equipment", ""),
                target=primary[0] if primary else "",
                secondary_muscles=secondary,
                instructions=ex.get("instructions", []),
                image_url=image_url,
                gif_url=image_url,
                level=ex.get("level", ""),
                force=ex.get("force") or "",
                mechanic=ex.get("mechanic") or "",
                category=body_part,
            ))

        # Single bulk query instead of 873 individual ones — runs in <1s vs ~20s
        CustomExercise.objects.bulk_create(
            objs,
            update_conflicts=True,
            update_fields=[
                "name", "body_part", "equipment", "target", "secondary_muscles",
                "instructions", "image_url", "gif_url", "level", "force", "mechanic", "category",
            ],
            unique_fields=["external_id"],
        )

        self.stdout.write(self.style.SUCCESS(f"Done — {len(objs)} exercises seeded."))
