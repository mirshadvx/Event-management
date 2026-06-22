import json
import os

import firebase_admin
from firebase_admin import auth, credentials


class FirebaseNotConfigured(Exception):
    pass


def initialize_firebase():
    firebase_json = os.getenv("FIREBASE_CREDENTIALS")
    if not firebase_json:
        return False

    if firebase_admin._apps:
        return True

    try:
        data = json.loads(firebase_json)
    except json.JSONDecodeError as exc:
        raise FirebaseNotConfigured("FIREBASE_CREDENTIALS must be valid JSON") from exc

    cred = credentials.Certificate(data)
    firebase_admin.initialize_app(cred)
    return True


def verify_id_token(token):
    if not initialize_firebase():
        raise FirebaseNotConfigured("FIREBASE_CREDENTIALS is not configured")

    return auth.verify_id_token(token)


initialize_firebase()
