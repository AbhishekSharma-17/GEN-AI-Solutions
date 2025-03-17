import React from 'react'
import "./Oauth_button.css"

const SLACK_CLIENT_ID = import.meta.env.VITE_SLACK_CLIENT_ID
const REDIRECT_URI = "https://8b2e-2401-4900-529d-b384-51f4-3ac6-dd50-e194.ngrok-free.app/slack/oauth/callback"

const Oauth_button = () => {
  const slack_oauth_url = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=chat:write,channels:read,groups:read,channels:history,groups:history,channels:join,bookmarks:read,canvases:read,workflows.templates:read,users:read,files:read&redirect_uri=${REDIRECT_URI}`

  const handleClick = () => {
    window.location.href = slack_oauth_url
  }

  return (
    <button className="button" onClick={handleClick}>Connect to Slack</button>
  )
}

export default Oauth_button
