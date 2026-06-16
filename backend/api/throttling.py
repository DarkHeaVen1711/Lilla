from rest_framework.throttling import SimpleRateThrottle

class RequestOTPThrottle(SimpleRateThrottle):
    scope = 'request_otp'
    rate = '3/min'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        identity = request.data.get('identity', '')
        if identity:
            # Combine client IP and identity to throttle per-user and per-IP
            return self.cache_format % {
                'scope': self.scope,
                'ident': f"{ident}:{identity.strip()}"
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }

class VerifyOTPThrottle(SimpleRateThrottle):
    scope = 'verify_otp'
    rate = '5/min'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        identity = request.data.get('identity', '')
        if identity:
            # Combine client IP and identity to throttle per-user and per-IP
            return self.cache_format % {
                'scope': self.scope,
                'ident': f"{ident}:{identity.strip()}"
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
