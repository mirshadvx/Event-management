from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')
        
        if not access_token:
            return None
        
        validated_token = self.get_validated_token(access_token)
        print(validated_token,"its auth class")
        try:
            user = self.get_user(validated_token)
            print(user)
        except:
            return None
        
        return (user, validated_token)
        