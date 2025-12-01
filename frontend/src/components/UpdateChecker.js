import { useEffect } from 'react';

const UpdateChecker = () => {
  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      console.log('🔍 Setting up update checker...');
      
      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 New service worker activated - reloading page');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('✨ New version detected:', event.data.version);
          // Auto-reload to apply updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });

      // Check for updates every 30 seconds
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            console.log('🔍 Checking for service worker updates...');
            registration.update().catch(err => {
              console.log('Update check failed:', err);
            });
          }
        });
      };

      // Initial check
      checkForUpdates();

      // Check for updates periodically
      const intervalId = setInterval(checkForUpdates, 30000); // Every 30 seconds

      // Check for updates when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('📱 Page visible - checking for updates');
          checkForUpdates();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Force check on focus
      const handleFocus = () => {
        console.log('👁️ Window focused - checking for updates');
        checkForUpdates();
      };

      window.addEventListener('focus', handleFocus);

      // Cleanup
      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  return null; // This component doesn't render anything
};

export default UpdateChecker;
