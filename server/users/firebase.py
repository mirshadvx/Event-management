# import firebase_admin
# from firebase_admin import credentials, auth

# # cred = credentials.Certificate("evenxo-g-auth-firebase-adminsdk.json")
# cred = credentials.Certificate("C:/Users/mirsh/OneDrive/Documents/Event - mangement/server/users/evenxo-g-auth-firebase-adminsdk.json")
# firebase_admin.initialize_app(cred)


# backend/users/firebase.py
import firebase_admin
from firebase_admin import credentials, auth
import os

# Get the directory of this file (users/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Construct path to the JSON file
cred_path = os.path.join(BASE_DIR, "evenxo-g-auth-firebase-adminsdk.json")
cred = credentials.Certificate(cred_path)

firebase_admin.initialize_app(cred)
