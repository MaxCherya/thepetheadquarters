from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegisterThrottle(AnonRateThrottle):
    rate = "5/minute"


class LoginThrottle(AnonRateThrottle):
    rate = "10/minute"


class TokenRefreshThrottle(AnonRateThrottle):
    rate = "30/minute"


class VerifyEmailThrottle(AnonRateThrottle):
    rate = "10/minute"


class ResendVerificationThrottle(UserRateThrottle):
    rate = "3/minute"


class PasswordResetRequestThrottle(AnonRateThrottle):
    rate = "3/minute"


class PasswordResetConfirmThrottle(AnonRateThrottle):
    rate = "5/minute"


class PasswordChangeThrottle(UserRateThrottle):
    rate = "5/minute"


