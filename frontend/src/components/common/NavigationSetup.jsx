import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setNavigate } from "../../services/navigation";

const NavigationSetup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
};

export default NavigationSetup;
