# Generated by Django 4.2.7 on 2025-05-30 07:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('broadcasters', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProgramName',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True, verbose_name='Program Name')),
                ('description', models.TextField(blank=True, verbose_name='Program Description')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('broadcasters', models.ManyToManyField(blank=True, related_name='programs', to='broadcasters.broadcaster', verbose_name='Associated Broadcasters')),
            ],
            options={
                'db_table': 'program_names',
                'ordering': ['name'],
            },
        ),
    ]
