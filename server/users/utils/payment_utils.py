from decimal import Decimal
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import stripe
from users.models import Wallet, WalletTransaction


def handle_wallet_payment(user, total, booking, event_title):
    wallet = get_object_or_404(Wallet, user=user)
    if wallet.balance < total:
        raise ValidationError("Insufficient wallet balance.")

    wallet.balance -= total
    wallet.save()

    WalletTransaction.objects.create(
        wallet=wallet,
        booking=booking,
        transaction_type="PAYMENT",
        amount=total,
        description=f"Payment for {event_title} tickets (Booking {booking.booking_id})",
    )


def handle_stripe_payment(
    stripe_payment_method_id, total_in_cents, booking, event_title, user, event_id
):
    if not stripe_payment_method_id:
        raise ValidationError("Stripe payment method ID required.")

    payment_intent = stripe.PaymentIntent.create(
        amount=total_in_cents,
        currency="inr",
        payment_method=stripe_payment_method_id,
        confirmation_method="manual",
        confirm=True,
        description=f"Payment for {event_title} tickets (Booking {booking.booking_id})",
        metadata={
            "user_id": user.id,
            "event_id": event_id,
            "booking_id": str(booking.booking_id),
        },
        return_url="http://localhost:3000/checkout/success",
    )

    return payment_intent
