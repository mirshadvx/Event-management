from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import date

@shared_task
def send_otp_email(email, otp):
    context = {
        'otp': otp,
        'current_date': date.today(),
    }
    html_message = render_to_string('email/otp_send.html', context)
    plain_message = strip_tags(html_message)
    print(email, otp)
    send_mail(
        subject='Verify Your Email',
        message=plain_message,
        from_email=None,
        recipient_list=[email],
        fail_silently=False,
        html_message=html_message
    )
    
    

@shared_task
def test_celery(test):
    # Simulate sending an email
    print(f"testing celery {test}")
    return f"testing{test}"
