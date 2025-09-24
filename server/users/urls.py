from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import *
from users.services.stripe_webhooks import stripe_webhook

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomRefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", logout, name="logout"),
    path("authenticated/", is_authenticated, name="check_auth"),
    path("register/", register, name="register"),
    path("check-username/", check_username_exists, name="check_username_exists"),
    path("verify-otp/", verify_otp, name="verify_otp"),
    path("google-login/", google_login, name="google_login"),
    path("profile/", get_user_profile.as_view(), name="profile"),
    path(
        "request-organizer/", OrganizerRequestHandle.as_view(), name="request_organizer"
    ),
    path(
        "organizer-request-status/",
        OrganizerRequestStatus.as_view(),
        name="organizer_reqeust_status",
    ),
    path("update-profile-info/", UpdateProfileInfo, name="update_profile_info"),
    path(
        "update-profile-picture/", UpdateProfilePicture, name="update_profile_picture"
    ),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("apply-coupon/", ApplyCouponAPIView.as_view(), name="apply-coupon"),
    path("my-events/", joined_events, name="my-events"),
    path("cancel-ticket/", cancel_ticket, name="cancel-ticket"),
    path("wallet/", WalletDetail.as_view(), name="wallet"),
    path("password-reset/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("password-reset/confirm/", ResetPasswordView.as_view(), name="reset_password"),
    path(
        "subscription-checkout/",
        SubscriptionCheckout.as_view(),
        name="subscription-checkout",
    ),
    path("subscription-upgrade/", UpgradePlan.as_view(), name="subscription_upgrade"),
    path("stripe-webhook/", stripe_webhook, name="stripe_webhook"),
    path(
        "subscription-details/", UserPlanDetails.as_view(), name="subscription_details"
    ),
    path("renew-subscription/", RenewSubscription.as_view(), name="renew_subscriptoin"),
]
