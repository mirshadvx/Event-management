from decimal import Decimal
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
import stripe
from users.models import Wallet, WalletTransaction

STRIPE_MINIMUM_AMOUNTS = {
    "inr": Decimal("50.00"),
    "usd": Decimal("0.50"),
}


def validate_stripe_minimum_amount(amount, currency="inr"):
    minimum_amount = STRIPE_MINIMUM_AMOUNTS.get(currency.lower())
    if minimum_amount and amount < minimum_amount:
        if currency.lower() == "inr":
            raise ValidationError(
                f"Payment amount (₹{amount:.2f}) is too small. "
                f"Stripe requires a minimum payment of ₹{minimum_amount:.2f} "
                f"(approximately $0.50 USD equivalent). Please add more items to your order."
            )
        else:
            raise ValidationError(
                f"Payment amount ({currency.upper()} {amount:.2f}) is too small. "
                f"Stripe requires a minimum payment of {currency.upper()} {minimum_amount:.2f}."
            )
    return True


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

    total_amount = Decimal(total_in_cents) / Decimal("100")
    
    validate_stripe_minimum_amount(total_amount, currency="inr")

    try:
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
            return_url="http://localhost",
        )
        return payment_intent
    except stripe.error.InvalidRequestError as e:
        if "amount_too_small" in str(e):
            raise ValidationError(
                f"Payment amount (₹{total_amount:.2f}) is too small for Stripe processing. "
                f"Minimum payment required is ₹{STRIPE_MINIMUM_AMOUNTS['inr']:.2f}. "
                f"Please add more items to your order."
            )
        raise ValidationError(f"Stripe payment error: {str(e)}")
    except stripe.error.StripeError as e:
        raise ValidationError(f"Payment processing error: {str(e)}")
