from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from Admin.models import Coupon
from event.models import Event
from decimal import Decimal

def validate_coupon(code, user, event_id):
    coupon = get_object_or_404(Coupon, code=code, is_active=True)
    event = get_object_or_404(Event, id=event_id, is_published=True)

    now = timezone.now().date() 
    if now < coupon.start_date or now > coupon.end_date:
        raise ValidationError("Coupon is not valid at this time.")
    
    if coupon.used_count >= coupon.usage_limit:
        raise ValidationError("Coupon usage limit reached.")
    
    if coupon.used_by.filter(id=user.id).exists():
        raise ValidationError("You have already used this coupon.")

    return coupon, event


def calculate_coupon_discount(coupon, event, request_data):
    subtotal = sum(
        float(ticket.price) * int(request_data.get(ticket.ticket_type, 0))
        for ticket in event.tickets.all()
    )

    if subtotal < float(coupon.min_order_amount):
        raise ValidationError(f"Order amount must be at least ₹{coupon.min_order_amount} to use this coupon.")

    if coupon.discount_type == 'percentage':
        discount = (subtotal * float(coupon.discount_value)) / 100
    else:
        discount = float(coupon.discount_value)
    return subtotal, discount

def validate_and_apply_coupon(code, user, event, selected_tickets):
    coupon = get_object_or_404(Coupon, code=code, is_active=True)

    now = timezone.now().date()
    if now < coupon.start_date or now > coupon.end_date:
        raise ValidationError("Coupon expired or not yet active.")
    if coupon.used_by.filter(id=user.id).exists():
        raise ValidationError("You have already used this coupon.")
    if coupon.used_count >= coupon.usage_limit:
        raise ValidationError("Coupon usage limit reached.")

    subtotal = sum(
        Decimal(ticket.price) * Decimal(selected_tickets.get(ticket.ticket_type, 0))
        for ticket in event.tickets.all()
    )

    if subtotal < Decimal(coupon.min_order_amount):
        raise ValidationError(f"Minimum order amount is ₹{coupon.min_order_amount}.")

    if coupon.discount_type == 'fixed':
        discount = Decimal(coupon.discount_value)
    else:
        discount = (subtotal * Decimal(coupon.discount_value)) / Decimal('100')

    return coupon, subtotal, discount