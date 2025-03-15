import streamlit as st
from chat_with_slack import answer

st.title("JIRA Chat Assistant")

# Initialize chat history and conversation context
if "messages" not in st.session_state:
    st.session_state.messages = []
if "conversation_context" not in st.session_state:
    st.session_state.conversation_context = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# React to user input
if prompt := st.chat_input("What would you like to know?"):
    # Display user message in chat message container
    st.chat_message("user").markdown(prompt)
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    # Add user message to conversation context
    st.session_state.conversation_context.append({"role": "user", "content": prompt})

    # Get AI response
    with st.spinner('AI is thinking...'):
        response = answer(prompt, st.session_state.conversation_context)

    # Display assistant response in chat message container
    with st.chat_message("assistant"):
        st.markdown(response)
    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": response})
    # Add assistant response to conversation context
    st.session_state.conversation_context.append({"role": "assistant", "content": response})

    # Limit conversation context to last 10 messages (5 exchanges) to prevent token limit issues
    if len(st.session_state.conversation_context) > 10:
        st.session_state.conversation_context = st.session_state.conversation_context[-10:]
