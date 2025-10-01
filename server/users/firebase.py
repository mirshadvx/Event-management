import os, json, tempfile
import firebase_admin
from firebase_admin import credentials

firebase_json = os.environ["FIREBASE_CREDENTIALS"]
data = json.loads(firebase_json)

with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as f:
    f.write(json.dumps(data).encode())
    temp_path = f.name

cred = credentials.Certificate(temp_path)
firebase_admin.initialize_app(cred)
