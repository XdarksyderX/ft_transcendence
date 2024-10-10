from django.shortcuts import render, get_object_or_404, redirect
from .models import User, Messages
from django.db.models import Q


# ETSO CREO QUE NO SIRVE PA NA AL USAR LA API

def chat_list(request):
    user = request.user
    # Filter users there the user is sender o receiver
    conversations = Messages.objects.filter(sender=user).values('receiver').distinct() | \
                    Messages.objects.filter(receiver=user).values('sender').distinct()
    
    # return ALGO
    # return render(request, 'chat_list.html', {'conversations': conversations}) # VIEW JSON FORMAT WITH THE API THAT I NEED RETURN

def chat_detail(request, user_id):
    other_user = get_object_or_404(User, id=user_id)
    user = request.user
    
    # Obtain all messages sended and received between the users
    messages = Messages.objects.filter(
        (Q(sender=user) & Q(receiver=other_user)) |
        (Q(sender=other_user) & Q(receiver=user))
    ).order_by('created_at')
    
    # RETURN ALGO
    # return render(request, 'chat_detail.html', {'messages': messages, 'other_user': other_user})
