import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#646cff' },
    secondary: { main: '#61dafb' },
    background: { default: '#f7f7f9' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { variant: 'contained' },
    },
  },
})

export default theme

