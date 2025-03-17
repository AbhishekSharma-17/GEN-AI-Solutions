import React from 'react'
import "./Atl_Oauth_button.css"

const SLACK_CLIENT_ID = import.meta.env.VITE_SLACK_CLIENT_ID
const REDIRECT_URI = "https://36a1-2401-4900-36c1-64b3-5cec-9505-a92c-56e7.ngrok-free.app/atlassian/oauth/callback"
const YOUR_USER_BOUND_VALUE = "jira_CCC"
const Oauth_button = () => {
  const slack_oauth_url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=kUCza8dbbpn9BmyGyoYiuIDfdLgefAtV&scope=read%3Ame%20read%3Ajira-work%20manage%3Ajira-project%20manage%3Ajira-configuration%20read%3Ajira-user%20write%3Ajira-work&redirect_uri=https%3A%2F%2F36a1-2401-4900-36c1-64b3-5cec-9505-a92c-56e7.ngrok-free.app%2Fatlassian%2Foauth%2Fcallback&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent`

  const handleClick = () => {
    window.location.href = slack_oauth_url
  }

  return (
    <button className="button" onClick={handleClick}>Connect to ATL</button>
  )
}

export default Oauth_button
