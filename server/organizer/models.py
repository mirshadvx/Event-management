from django.db import models
from users.models import Profile

class Follow(models.Model):
    follower = models.ForeignKey(Profile, related_name="following", on_delete=models.CASCADE)
    followed = models.ForeignKey(Profile, related_name="followers", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ["follower","followed"]
        
    def __str__(self):
        return f"{self.follower} followed {self.followed}"
    