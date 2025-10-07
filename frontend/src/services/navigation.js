
let navigate = null;

export const setNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

export const getNavigate = () => {
  if (!navigate) {
    console.warn('Navigation function not set');
    return () => {};
  }
  return navigate;
};