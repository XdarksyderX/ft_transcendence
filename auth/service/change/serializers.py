from rest_framework import serializers
from core.models import User

class ChangeUsernameSerializer(serializers.Serializer):
    new_username = serializers.CharField(
        error_messages={'required': 'This field is required: username'}
    )
    password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: password'}
    )

    def validate(self, data):
        user = self.context['request'].user
        
        if not user.check_password(data['password']):
            raise serializers.ValidationError({"error": "Invalid password."})

        if user.username == data['new_username']:
            raise serializers.ValidationError({"error": "New username cannot be the same as the current username."})

        if User.objects.filter(username=data['new_username']).exists():
            raise serializers.ValidationError({"error": "This username is already registered."})
        
        return data

    def save(self):
        user = self.context['request'].user
        user.username = self.validated_data['new_username']
        user.save()
        return user


class ChangeEmailSerializer(serializers.Serializer):
    new_email = serializers.EmailField(
        error_messages={'required': 'This field is required: email'}
    )
    password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: password'}
    )

    def validate(self, data):
        user = self.context['request'].user

        if not user.check_password(data['password']):
            raise serializers.ValidationError({"error": "Invalid password."})

        if user.email == data['new_email']:
            raise serializers.ValidationError({"error": "New email cannot be the same as the current email."})

        if user.oauth_registered:
            raise serializers.ValidationError({"error": "Email cannot be changed for users registered with OAuth."})

        if User.objects.filter(email=data['new_email']).exists():
            raise serializers.ValidationError({"error": "This email is already registered."})
        
        return data

    def save(self):
        user = self.context['request'].user
        user.email = self.validated_data['new_email']
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: current_password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: new_password'}
    )

    def validate(self, data):
        user = self.context['request'].user
        print("pepe")
        if not user.check_password(data['password']):
            raise serializers.ValidationError({"error": "Invalid current password."})

        if len(data['new_password']) < 8:
            raise serializers.ValidationError({"error": "Password must be at least 8 characters long."})
        
        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(
        error_messages={'required': 'This field is required: email'}
    )

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError({"error": "Email not registered."})
        return value


class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField(
        error_messages={'required': 'This field is required: reset_token'}
    )
    new_password = serializers.CharField(
        write_only=True,
        error_messages={'required': 'This field is required: new_password'}
    )

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError({"error": "Password must be at least 8 characters long."})
        return value

    def save(self, user):
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
