import requests
import json

u = "http://localhost:8000/chat"
b = {
    "message": "What is the status of Order Package ID: Y7251702",
    "sessionid": "sessions1",
    "userid": "8899"
}
r = requests.post(u, data=json.dumps(b), headers={"Content-Type": "application/json"})
print(r.json())