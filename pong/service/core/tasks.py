from celery import shared_task
from .models import User, PongStatistics

@shared_task
def create_user_statistics(user_id, username):
    user = User.objects.create(user_id=user_id, username=username)
    PongStatistics.objects.create(user=user)
    return f"Statistics created for user {user_id}"

@shared_task
def delete_user_data(user_id):
    User.objects.filter(user_id=user_id).delete()
    return f"Deleted all data for user {user_id}"
