import streamlit as st
from chat_with_confi_lit import answer, clear_history

def main():
    st.title("Chat with AI")

    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "organization_id" not in st.session_state:
        st.session_state.organization_id = ""
    if "user_id" not in st.session_state:
        st.session_state.user_id = ""

    # Custom CSS to align the button
    st.markdown("""
    <style>
    .stButton > button {
        margin-top: 25px;
    }
    </style>
    """, unsafe_allow_html=True)

    # Get user inputs and add clear history button
    col1, col2, col3 = st.columns([2, 2, 1])
    with col1:
        new_org_id = st.text_input("Enter organization ID:", value=st.session_state.organization_id)
    with col2:
        new_user_id = st.text_input("Enter user ID:", value=st.session_state.user_id)
    with col3:
        if st.button("Clear History", key="clear_history"):
            clear_history(st.session_state.user_id, st.session_state.organization_id)
            st.session_state.messages = []
            st.success("Chat history cleared!")

    # Update session state if inputs change
    if new_org_id != st.session_state.organization_id:
        st.session_state.organization_id = new_org_id
        st.session_state.messages = []  # Clear chat history on org change
    if new_user_id != st.session_state.user_id:
        st.session_state.user_id = new_user_id
        st.session_state.messages = []  # Clear chat history on user change

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Get user input
    if prompt := st.chat_input("You:"):
        if not st.session_state.organization_id or not st.session_state.user_id:
            st.error("Please enter both organization ID and user ID before chatting.")
        else:
            # Add user message to chat history
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            # Get AI response
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = answer(prompt, st.session_state.organization_id, st.session_state.user_id)
                    st.markdown(response)
            
            # Add AI response to chat history
            st.session_state.messages.append({"role": "assistant", "content": response})

if __name__ == "__main__":
    main()
