import { useEffect, useState } from 'react';

const UpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      console.log('🔍 Setting up aggressive update checker...');
      
      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 New service worker activated - reloading page immediately');
        window.location.reload(true);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('✨ New version detected:', event.data.version);
          setUpdateAvailable(true);
          // Auto-reload immediately
          setTimeout(() => {
            window.location.reload(true);
          }, 500);
        }
      });

      // Check for updates aggressively - every 10 seconds
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            console.log('🔍 Checking for service worker updates...');
            registration.update().then(() => {
              console.log('✅ Update check completed');
            }).catch(err => {
              console.log('⚠️ Update check failed:', err);
            });
          }
        });
      };

      // Initial check
      checkForUpdates();

      // Check for updates very frequently - every 10 seconds
      const intervalId = setInterval(checkForUpdates, 10000);

      // Check for updates when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('📱 Page visible - force checking for updates');
          checkForUpdates();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Force check on focus
      const handleFocus = () => {
        console.log('👁️ Window focused - force checking for updates');
        checkForUpdates();
      };

      window.addEventListener('focus', handleFocus);
      
      // Check on page load
      const handleLoad = () => {
        console.log('📄 Page loaded - checking for updates');
        checkForUpdates();
      };
      
      window.addEventListener('load', handleLoad);

      // Cleanup
      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  // Show update indicator when update is available
  if (updateAvailable) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 z-50 animate-pulse">
        🔄 Updating to latest version...
      </div>
    );
  }

  return null;
};

export default UpdateChecker;
