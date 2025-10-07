// Toast utility functions for showing notifications
export const showToast = (message, type = 'info') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 ${getToastStyles(type)}`;
  toast.textContent = message;

  // Add to DOM
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.add('opacity-100');
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

const getToastStyles = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-black';
    case 'info':
    default:
      return 'bg-blue-500 text-white';
  }
};

// Export toast object for compatibility
export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  warning: (message) => showToast(message, 'warning'),
  info: (message) => showToast(message, 'info')
};

export default showToast;
