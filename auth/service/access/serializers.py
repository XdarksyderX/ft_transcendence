import jwt
import uuid
import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers
from core.models import User, EmailVerification
from django.core.signing import BadSignature, Signer

class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        if User.objects.filter(email=data['email']).exists() or User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                "status": "error",
                "message": "This email or username is already registered."
            })

        if 'password' in data and len(data['password']) < 8:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Password must be at least 8 characters long."
            })
        
        return data

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            is_email_verified=False
        )
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

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    two_fa_code = serializers.CharField(required=False, write_only=True)

    def validate(self, data):
        if not User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({
                "status": "error",
                "message": "Invalid credentials"
            })
        
        user = User.objects.get(username=data['username'])
        if not user.is_email_verified:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Email is not verified."
            })
        
        return data

class RefreshTokenValidator:
    @staticmethod
    def validate_token(value):
        if not value.strip():
            raise serializers.ValidationError({
                "status": "error",
                "message": "Refresh token is required."
            })
        
        try:
            jwt.decode(value, settings.JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Refresh token has expired."
            })
        except jwt.InvalidTokenError:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Invalid refresh token."
            })
        
        return value

class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()

    def validate_refresh_token(self, value):
        return RefreshTokenValidator.validate_token(value)

signer = Signer()

class VerifyOTPSerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    two_fa_code = serializers.CharField()

    def validate(self, data):
        temp_token = data.get('temp_token')
        two_fa_code = data.get('two_fa_code')

        if not temp_token or not two_fa_code:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Temp token and 2FA code are required."
            })

        try:
            user_id = signer.unsign(temp_token)
            user = User.objects.get(id=user_id)
        except (BadSignature, User.DoesNotExist):
            raise serializers.ValidationError({
                "status": "error",
                "message": "Invalid or expired temp token."
            })

        data['user'] = user
        return data