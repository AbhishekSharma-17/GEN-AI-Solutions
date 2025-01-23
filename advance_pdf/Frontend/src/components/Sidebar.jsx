import React from 'react'
import { Drawer, List, ListItem, ListItemText, ListSubheader, Typography } from '@mui/material'
import { Folder, InsertDriveFile } from '@mui/icons-material'

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <List>
        <ListSubheader>
          <Typography variant="h6">Recent Files</Typography>
        </ListSubheader>
        {['Project_Report.pdf', 'Documentation.pdf', 'Research_Paper.pdf'].map((text, index) => (
          <ListItem button key={text}>
            <InsertDriveFile sx={{ mr: 2 }} />
            <ListItemText primary={text} />
          </ListItem>
        ))}
        <ListSubheader>
          <Typography variant="h6">Folders</Typography>
        </ListSubheader>
        {['Work', 'Personal'].map((text, index) => (
          <ListItem button key={text}>
            <Folder sx={{ mr: 2 }} />
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
