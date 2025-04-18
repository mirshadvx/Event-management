import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from users.models import Profile
from Admin.models import UserSubscription, SubscriptionTransaction, SubscriptionPlan
import logging
logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
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

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_intent_succeeded(payment_intent)
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_intent_failed(payment_intent)
    elif event['type'] == 'charge.refunded':
        charge = event['data']['object']
        handle_charge_refunded(charge)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
        
    return HttpResponse(status=200)
    
def handle_payment_intent_succeeded(payment_intent):
    user_id = payment_intent.get('metadata', {}).get('user_id')
    transaction_type = payment_intent.get('metadata', {}).get('transaction_type')
    
    if not user_id or not transaction_type:
        return
        
    try:
        user = Profile.objects.get(id=user_id)
        
        if transaction_type == 'subscription_upgrade':
            try:
                current_subscription = UserSubscription.objects.get(user=user)
                premium_plan = SubscriptionPlan.objects.get(name="premium", active=True)
                
                transaction_exists = SubscriptionTransaction.objects.filter(
                    transaction_id=payment_intent['id'],
                    transaction_type="upgrade"
                ).exists()
                
                if not transaction_exists:
                    current_subscription.plan = premium_plan
                    current_subscription.payment_method = "stripe"
                    current_subscription.payment_id = payment_intent['id']
                    current_subscription.save()
                    
                    amount = payment_intent['amount'] / 100
                    SubscriptionTransaction.objects.create(
                        subscription=current_subscription,
                        amount=amount,
                        transaction_type="upgrade",
                        payment_method="stripe",
                        transaction_id=payment_intent['id']
                    )
            except UserSubscription.DoesNotExist:
                print(f"[Webhook Error]: Subscription not found for user {user_id}")
            except SubscriptionPlan.DoesNotExist:
                print(f"[Webhook Error]: Premium plan not found")
                
        elif transaction_type == 'subscription_purchase':
            pass
    except Profile.DoesNotExist:
        print(f"[Webhook Error]: User not found with ID {user_id}")
    except Exception as e:
        print(f"[Webhook Error]: {e}")

def handle_payment_intent_failed(payment_intent):
    user_id = payment_intent.get('metadata', {}).get('user_id')
    
    if not user_id:
        return
        
    print(f"[Payment Failed]: User {user_id}, Intent {payment_intent['id']}")
    
def handle_charge_refunded(charge):
    payment_intent_id = charge.get('payment_intent')
    
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