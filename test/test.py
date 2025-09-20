import streamlit as st
import requests

API_URL = "https://ac-teamx.onrender.com/chat"
SESSION_ID = "8000"
USER_ID = "8899"

def send(msg):
    try:
        payload = {"message": msg, "sessionid": SESSION_ID, "userid": USER_ID}
        r = requests.post(API_URL, json=payload, timeout=30)
        if r.ok:
            data = r.json()
            return data.get("response") or data.get("error", "No response")
        return f"Error: {r.status_code}"
    except Exception as e:
        return f"Error communicating with server: {e}"

def main():
    st.set_page_config(page_title="Chatbot", page_icon="🤖", layout="centered")
    messages = st.session_state.setdefault("messages", [])
    for m in messages:
        with st.chat_message("user" if m["role"] == "user" else "bot"):
            st.markdown(m["content"])
    prompt = st.chat_input("Type your message here...")
    if prompt:
        if prompt.strip().lower() == "exit":
            messages.clear()
            st.success("Chat cleared! Start a new conversation.")
        else:
            messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            with st.chat_message("bot"):
                with st.spinner("Thinking..."):
                    resp = send(prompt)
                st.markdown(resp)
            messages.append({"role": "bot", "content": resp})

if __name__ == "__main__":
    main()