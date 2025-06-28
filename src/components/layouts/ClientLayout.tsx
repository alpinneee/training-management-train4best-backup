'use client';

import Chatbot from '@/components/common/Chatbot'
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <div className="py-4">
        {children}
      </div>
      <Chatbot />
    </ThemeProvider>
  );
} 