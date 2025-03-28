import React from 'react';
import { Typography, Box } from '@mui/material';
import './Tools.css';

const Tools = () => {
  const toolsList = [
    'web_search',
    'final_answer',
    'search_in_slack',
    'web_image_search',
    'send_message_to_slack_channel',
    'reply_to_a_message_in_slack_channel',
    'create_slack_canvas',
    'draft_canvas_content',
    'edit_response',
  ];

  return (
    <Box className="tools-component">
      <Typography variant="h6" className="tools-title">
        Available Tools
      </Typography>
      <div className="tools-grid">
        {toolsList.map((tool, index) => (
          <div key={index} className="tool-card">
            <span className="tool-name">{tool.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </Box>
  );
};

export default Tools;