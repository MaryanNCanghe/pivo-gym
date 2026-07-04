"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()

# Run pending migrations and seed exercises on cold start.
# Vercel build phase has no DB access, so we do it here instead.
try:
    from django.core.management import call_command
    call_command('migrate', '--noinput', verbosity=0)
    call_command('seed_exercises', verbosity=0)
except Exception:
    pass
