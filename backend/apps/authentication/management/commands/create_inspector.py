from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a CA inspector user'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Username for the inspector')
        parser.add_argument('--email', type=str, help='Email for the inspector')
        parser.add_argument('--password', type=str, help='Password for the inspector')
        parser.add_argument('--employee-id', type=str, help='Employee ID')
        parser.add_argument('--superuser', action='store_true', help='Create as superuser')

    def handle(self, *args, **options):
        username = options['username'] or input('Username: ')
        email = options['email'] or input('Email: ')
        password = options['password'] or input('Password: ')
        employee_id = options['employee_id'] or input('Employee ID: ')
        
        if options['superuser']:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                employee_id=employee_id,
                department='IT Administration',
                is_inspector=True
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser inspector "{username}" created successfully!'))
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                employee_id=employee_id,
                department='Inspection Department',
                is_inspector=True
            )
            self.stdout.write(self.style.SUCCESS(f'Inspector "{username}" created successfully!'))