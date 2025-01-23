import React from 'react'
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Divider
} from '@mui/material'
import { 
  Folder, 
  InsertDriveFile, 
  StarBorder, 
  AccessTime, 
  DeleteOutline,
  Add,
  FolderSpecial,
  CloudUpload,
  Share
} from '@mui/icons-material'

const Sidebar = () => {
  const recentFiles = [
    { name: 'Project_Report.pdf', date: '2 hours ago', shared: true },
    { name: 'Documentation.pdf', date: 'Yesterday', starred: true },
    { name: 'Research_Paper.pdf', date: '3 days ago' },
  ]

  const folders = [
    { name: 'Work', count: 12, color: '#3b82f6' },
    { name: 'Personal', count: 8, color: '#8b5cf6' },
    { name: 'Projects', count: 5, color: '#10b981' },
  ]

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600 }}>
          Recent Files
        </Typography>
        <Tooltip title="Upload new file">
          <IconButton size="small" color="primary">
            <Add />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {recentFiles.map((file, index) => (
            <ListItem
              key={file.name}
              button
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'primary.50',
                }
              }}
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={file.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {file.date}
                    </Typography>
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {file.shared && (
                  <Tooltip title="Shared">
                    <IconButton size="small">
                      <Share fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                )}
                {file.starred && (
                  <Tooltip title="Starred">
                    <IconButton size="small">
                      <StarBorder fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
            Folders
          </Typography>
          {folders.map((folder) => (
            <Box
              key={folder.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 1,
                borderRadius: 1,
                bgcolor: 'grey.50',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'grey.100',
                }
              }}
            >
              <FolderSpecial sx={{ color: folder.color, mr: 1 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {folder.name}
                </Typography>
              </Box>
              <Chip 
                size="small" 
                label={folder.count}
                sx={{ 
                  bgcolor: 'white',
                  fontWeight: 500,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  )
}

export default Sidebar
