from rest_framework import serializers
from core.models import EmailVerification
from django.utils import timezone

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate_token(self, value):
        try:
            verification = EmailVerification.objects.get(verification_code=value)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError({
                "status": "error",
                "message": "Invalid verification code."
            })

        if verification.expires_at < timezone.now():
            raise serializers.ValidationError({
                "status": "error",
                "message": "Verification code has expired."
            })

        if verification.verified:
            raise serializers.ValidationError({
                "status": "error",
                "message": "This email is already verified."
            })

        return value

    def save(self):
        token = self.validated_data['token']
        verification = EmailVerification.objects.get(verification_code=token)
        verification.verified = True
        verification.save()
        verification.user.is_email_verified = True
        verification.user.save()
        return verification.user

from rest_framework import serializers

class Activate2FASerializer(serializers.Serializer):
    enable = serializers.BooleanField()

    def validate(self, data):
        user = self.context['request'].user
        if not user.is_authenticated:
            raise serializers.ValidationError({
                "status": "error",
                "message": "User must be authenticated to activate 2FA."
            })
        return data
