import requests
import json

u = "http://localhost:8000/chat"
sessionid = "sessions1"
userid = "8899"

while True:
    user_input = input("You: ")
    if user_input.strip().lower() == "exit":
        print("Goodbye!")
        break
    b = {
        "message": user_input,
        "sessionid": sessionid,
        "userid": userid
    }
    try:
        r = requests.post(u, data=json.dumps(b), headers={"Content-Type": "application/json"})
        response = r.json()
        print("Bot:", response.get("response", response.get("error", "No response")))
    except Exception as e:
        print("Error communicating with server:", e)