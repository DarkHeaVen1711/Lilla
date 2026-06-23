from django.db import migrations


def backfill_admin_roles(apps, schema_editor):
    """Set role='admin' for all existing staff/superuser accounts.

    Any user created before Phase 17 who had is_staff=True or is_superuser=True
    should retain full admin access after the role field is introduced.
    New users created after this migration default to 'customer' via the
    auto-create signal in models.py.
    """
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("api", "UserProfile")

    # Ensure every existing user has a profile
    for user in User.objects.all():
        role = "admin" if (user.is_superuser or user.is_staff) else "customer"
        UserProfile.objects.update_or_create(
            user=user,
            defaults={"role": role},
        )


def reverse_backfill(apps, schema_editor):
    """No-op reverse: profiles already exist, just leave them as-is."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0018_userprofile"),
    ]

    operations = [
        migrations.RunPython(backfill_admin_roles, reverse_backfill),
    ]
