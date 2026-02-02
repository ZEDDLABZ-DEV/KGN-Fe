import { type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';

interface ParentLayoutProps {
  children: ReactNode;
  title: string
}

const ParentLayout = ({ children, title = "Dashboard" }: ParentLayoutProps) => {
  return (
    <div className="min-h-[80vh] box-border flex font-[montserrat] bg-[#F9FAFB]">
        <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          className: 'login-toast',
          style: {
            maxWidth: '400px',
            borderRadius: '16px',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(8, 145, 178, 0.9))',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            color: '#f8fafc',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 40px rgba(45, 212, 191, 0.28)',
            animation:
              'loginToastPop 420ms cubic-bezier(0.23, 1, 0.32, 1) forwards, loginToastPulse 3s ease-in-out 420ms infinite alternate',
            willChange: 'transform, opacity, box-shadow',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#f97316',
              secondary: '#0f172a',
            },
          }
        }}
      />
      <div className="p-4">
      <Sidebar />
      </div>
      <div className="flex-1 flex overflow-y-hidden! flex-col pt-4 pr-4 h-screen">
        <Header title={title} />
        <main className="flex-1 mt-4 p-8 h-full! overflow-y-scroll bg-white rounded-xl border border-[#E5E7EB] shadow-[0px_0px_10px_0px_#E5E7EB]">
          {children}
        </main>
      </div>
    </div>
  );
};

export { ParentLayout };
