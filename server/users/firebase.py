import json
import os

import firebase_admin
from firebase_admin import auth, credentials


class FirebaseNotConfigured(Exception):
    pass


def initialize_firebase():
    firebase_json = os.getenv("FIREBASE_CREDENTIALS")
    credentials_file = os.getenv("FIREBASE_CREDENTIALS_FILE")

    if not firebase_json and not credentials_file:
        return False

    if firebase_admin._apps:
        return True

    if credentials_file:
        if not os.path.isfile(credentials_file):
            raise FirebaseNotConfigured("Firebase credentials file does not exist")
        cred = credentials.Certificate(credentials_file)
    else:
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
