from django.contrib.auth.models import AbstractUser
from django.db import models

class CAUser(AbstractUser):
    """Extended user model for CA officials"""
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, blank=True)
    is_inspector = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.employee_id})"

    class Meta:
        db_table = 'ca_users'