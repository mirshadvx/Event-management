import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
import json
from users.models import Profile
from Admin.models import UserSubscription, SubscriptionTransaction, SubscriptionPlan
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"[Webhook Error]: Invalid payload - {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"[Webhook Error]: Signature verification failed - {e}")
        return HttpResponse(status=400)

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        handle_payment_intent_succeeded(payment_intent)
    elif event["type"] == "payment_intent.payment_failed":
        payment_intent = event["data"]["object"]
        handle_payment_intent_failed(payment_intent)
    elif event["type"] == "charge.refunded":
        charge = event["data"]["object"]
        handle_charge_refunded(charge)
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        handle_subscription_deleted(subscription)

    return HttpResponse(status=200)


def handle_payment_intent_succeeded(payment_intent):
    user_id = payment_intent.get("metadata", {}).get("user_id")
    transaction_type = payment_intent.get("metadata", {}).get("transaction_type")

    if not user_id or not transaction_type:
        return

    try:
        user = Profile.objects.get(id=user_id)

        if transaction_type == "subscription_upgrade":
            try:
                current_subscription = UserSubscription.objects.get(user=user)
                premium_plan = SubscriptionPlan.objects.get(name="premium", active=True)

                transaction_exists = SubscriptionTransaction.objects.filter(
                    transaction_id=payment_intent["id"], transaction_type="upgrade"
                ).exists()

                if not transaction_exists:
                    current_subscription.plan = premium_plan
                    current_subscription.payment_method = "stripe"
                    current_subscription.payment_id = payment_intent["id"]
                    current_subscription.save()

                    amount = payment_intent["amount"] / 100
                    SubscriptionTransaction.objects.create(
                        subscription=current_subscription,
                        amount=amount,
                        transaction_type="upgrade",
                        payment_method="stripe",
                        transaction_id=payment_intent["id"],
                    )
            except UserSubscription.DoesNotExist:
                print(f"[Webhook Error]: Subscription not found for user {user_id}")
            except SubscriptionPlan.DoesNotExist:
                print(f"[Webhook Error]: Premium plan not found")

        elif transaction_type == "subscription_purchase":
            try:
                plan_id = payment_intent.get("metadata", {}).get("plan_id")
                if plan_id:
                    plan = SubscriptionPlan.objects.get(id=plan_id, active=True)

                    existing_subscription = UserSubscription.objects.filter(
                        user=user, is_active=True, end_date__gt=timezone.now()
                    ).first()

                    if (
                        existing_subscription
                        and existing_subscription.plan.name == "trial"
                    ):
                        end_date = timezone.now() + timedelta(days=30)
                        existing_subscription.plan = plan
                        existing_subscription.start_date = timezone.now()
                        existing_subscription.end_date = end_date
                        existing_subscription.is_active = True
                        existing_subscription.payment_method = "stripe"
                        existing_subscription.payment_id = payment_intent["id"]
                        existing_subscription.events_joined_current_month = 0
                        existing_subscription.events_organized_current_month = 0
                        existing_subscription.save()

                        amount = payment_intent["amount"] / 100
                        SubscriptionTransaction.objects.create(
                            subscription=existing_subscription,
                            amount=amount,
                            transaction_type="purchase",
                            payment_method="stripe",
                            transaction_id=payment_intent["id"],
                        )

                        logger.info(
                            f"Replaced trial subscription with {plan.name} plan for user {user_id}"
                        )
                    elif not existing_subscription:
                        end_date = timezone.now() + timedelta(days=30)
                        subscription = UserSubscription.objects.create(
                            user=user,
                            plan=plan,
                            start_date=timezone.now(),
                            end_date=end_date,
                            is_active=True,
                            payment_method="stripe",
                            payment_id=payment_intent["id"],
                        )

                        amount = payment_intent["amount"] / 100
                        SubscriptionTransaction.objects.create(
                            subscription=subscription,
                            amount=amount,
                            transaction_type="purchase",
                            payment_method="stripe",
                            transaction_id=payment_intent["id"],
                        )

                        logger.info(f"Created subscription for user {user_id}")
                    else:
                        logger.info(
                            f"User {user_id} already has active non-trial subscription"
                        )

            except SubscriptionPlan.DoesNotExist:
                logger.error(f"[Webhook Error]: Plan not found for ID {plan_id}")
            except Exception as e:
                logger.error(
                    f"[Webhook Error]: Error processing subscription purchase: {str(e)}"
                )
    except Profile.DoesNotExist:
        print(f"[Webhook Error]: User not found with ID {user_id}")
    except Exception as e:
        print(f"[Webhook Error]: {e}")


def handle_payment_intent_failed(payment_intent):
    user_id = payment_intent.get("metadata", {}).get("user_id")
    transaction_type = payment_intent.get("metadata", {}).get("transaction_type")

    if not user_id:
        return

    logger.error(
        f"[Payment Failed]: User {user_id}, Intent {payment_intent['id']}, Type: {transaction_type}"
    )


def handle_charge_refunded(charge):
    payment_intent_id = charge.get("payment_intent")
    if payment_intent_id:
        try:
            transaction = SubscriptionTransaction.objects.get(
                transaction_id=payment_intent_id
            )
            logger.info(f"Charge refunded for transaction {payment_intent_id}")
        except SubscriptionTransaction.DoesNotExist:
            logger.warning(
                f"Transaction not found for refunded charge {payment_intent_id}"
            )


def handle_subscription_deleted(subscription):
    stripe_subscription_id = subscription.get("id")
    try:
        user_subscription = UserSubscription.objects.get(
            payment_id=stripe_subscription_id
        )
        user_subscription.is_active = False
        user_subscription.save()
        logger.info(f"Deactivated subscription {user_subscription.id}")
    except UserSubscription.DoesNotExist:
        logger.warning(
            f"Subscription not found for deleted Stripe subscription {stripe_subscription_id}"
        )

    if not user_id:
        return

    print(f"[Payment Failed]: User {user_id}, Intent {payment_intent['id']}")


def handle_charge_refunded(charge):
    payment_intent_id = charge.get("payment_intent")

    if not payment_intent_id:
        return

    try:
        transaction = SubscriptionTransaction.objects.filter(
            transaction_id=payment_intent_id
        ).first()

        if transaction:
            transaction.refunded = True
            transaction.save()

    except Exception as e:
        print(f"[Refund Webhook Error]: {e}")


def handle_subscription_deleted(subscription):
    pass
