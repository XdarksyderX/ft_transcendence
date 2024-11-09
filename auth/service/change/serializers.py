from rest_framework import serializers
from core.models import User

class ChangeUsernameSerializer(serializers.Serializer):
    email = serializers.EmailField()
    current_password = serializers.CharField(write_only=True)
    new_username = serializers.CharField()

    def validate(self, data):
        user = User.objects.filter(email=data['email']).first()
        if not user:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Email not registered."
            })

        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({
                "status": "error",
                "message": "Invalid current password."
            })

        if User.objects.filter(username=data['new_username']).exists():
            raise serializers.ValidationError({
                "status": "error",
                "message": "This username is already taken."
            })
        
        return data

    def save(self):
        user = User.objects.get(email=self.validated_data['email'])
        user.username = self.validated_data['new_username']
        user.save()
        return user

class ChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField()

    def validate_new_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError({
                "status": "error",
                "message": "This email is already taken."
            })
        return value

    def save(self, user):
        user.email = self.validated_data['new_email']
        user.is_email_verified = False
        user.save()
        return user

class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError({
                "status": "error",
                "message": "Email not registered."
            })
        return value

class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Password must be at least 8 characters long."
            })
        return value

    def save(self, user):
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
