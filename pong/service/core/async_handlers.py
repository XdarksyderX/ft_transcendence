from core.tasks import create_user_statistics, delete_user_data, update_username

def process_event(event):
    data = event.get('data', {})
    if event['event'] == "auth.user_registered":
        create_user_statistics.delay(data['user_id'], data['username'])
    elif event['event'] == "auth.user_deleted": #TODO Create Auth user delete View/Endpoint
        delete_user_data.delay(data['user_id'])
    elif event['event'] == "auth.username_changed":
        update_username.delay(data['user_id'], data['new_username'])
