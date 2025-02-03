import uuid
import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers
from core.models import User, EmailVerification
from django.core.signing import BadSignature, Signer
import re

class RegisterUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        error_messages={'required': 'This field is required: username'}
    )
    email = serializers.EmailField(
        error_messages={'required': 'This field is required: email'}
    )
    password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: password'}
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, data['email']):
            raise serializers.ValidationError({"error": "The email must be a valid address."})

        if User.objects.filter(email=data['email']).exists() or User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"error": "This email or username is already registered."})

        if 'password' in data and len(data['password']) < 8:
            raise serializers.ValidationError({"error": "Password must be at least 8 characters long."})
        
        return data

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            is_email_verified=settings.DEBUG
        )
        print(settings.DEBUG)
        user.set_password(validated_data['password'])
        user.save()

        verification_code = str(uuid.uuid4())[:6]
        expires_at = timezone.now() + datetime.timedelta(hours=1)

        EmailVerification.objects.create(
            user=user,
            verification_code=verification_code,
            expires_at=expires_at
        )

        verification_link = f"{settings.FRONTEND_URL}/verify-email/?token={verification_code}"
        send_mail(
            subject="Verify your email address",
            message=f"Please verify your email address by clicking on the following link: {verification_link}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user

class LogoutSerializer(serializers.Serializer):
    access_token = serializers.CharField(
        error_messages={'required': 'This field is required: access_token'}
    )

signer = Signer()

class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError({"error": "Incorrect password."})
        return value
