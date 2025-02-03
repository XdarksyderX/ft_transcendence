from rest_framework import serializers
from core.models import EmailVerification
from django.utils import timezone

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(
        error_messages={'required': 'This field is required: token'}
    )

    def validate_token(self, value):
        try:
            verification = EmailVerification.objects.get(verification_code=value)
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError({"error": "Invalid verification code."})

        if verification.expires_at < timezone.now():
            raise serializers.ValidationError({"error": "Verification code has expired."})

        if verification.verified:
            raise serializers.ValidationError({"error": "This email is already verified."})

        return value

    def save(self):
        token = self.validated_data['token']
        verification = EmailVerification.objects.get(verification_code=token)
        verification.verified = True
        verification.save()
        verification.user.is_email_verified = True
        verification.user.save()
        return verification.user