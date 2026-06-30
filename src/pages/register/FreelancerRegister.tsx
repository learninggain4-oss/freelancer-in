import { useEffect } from "react";
import RegistrationForm from "./RegistrationForm";

const FreelancerRegister = () => {
  useEffect(() => {
    document.title = "Register as a Freelancer in India | Freelan Space";
    return () => { document.title = "Freelan Space"; };
  }, []);
  return <RegistrationForm userType="Freelancer" />;
};

export default FreelancerRegister;
