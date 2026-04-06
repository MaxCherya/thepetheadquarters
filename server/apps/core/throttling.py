from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AnonBurstThrottle(AnonRateThrottle):
    scope = "anon_burst"


class AnonSustainedThrottle(AnonRateThrottle):
    scope = "anon_sustained"


class UserBurstThrottle(UserRateThrottle):
    scope = "user_burst"


class UserSustainedThrottle(UserRateThrottle):
    scope = "user_sustained"
