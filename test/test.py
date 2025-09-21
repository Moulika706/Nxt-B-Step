import streamlit as st
import requests

API_URL = "https://ac-teamx.onrender.com/chat"
SESSION_ID = "8000"
EMAIL_ID = "hireai.teamx@gmail.com"

def send_message(msg):
    try:
        res = {"message": msg, "sessionid": SESSION_ID, "userid": EMAIL_ID}
        response = requests.post(API_URL, json=res, verify=True, timeout=30)
        return response.json().get("response", response.json().get("error", "No response")) if response.ok else f"Error: {response.status_code}"
    except Exception as e:
        return f"Error communicating with server: {e}"

def main():
    st.set_page_config(page_title="Chatbot", page_icon="🤖", layout="centered")
    msgs = st.session_state.setdefault("messages", [])
    for m in msgs:
        with st.chat_message("user" if m["role"] == "user" else "bot"):
            st.markdown(m["content"])
    prompt = st.chat_input("Type your message here...")
    if prompt:
        if prompt.strip().lower() == "exit":
            msgs.clear()
            st.success("Chat cleared! Start a new conversation.")
        else:
            msgs.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            with st.chat_message("bot"):
                with st.spinner("Thinking..."):
                    resp = send_message(prompt)
                st.markdown(resp)
            msgs.append({"role": "bot", "content": resp})

if __name__ == "__main__":
    main()