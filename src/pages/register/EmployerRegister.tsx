import { useEffect } from "react";
import RegistrationForm from "./RegistrationForm";

const EmployerRegister = () => {
  useEffect(() => {
    document.title = "Post a Project & Hire Freelancers in India | Freelan Space";
    return () => { document.title = "Freelan Space"; };
  }, []);
  return <RegistrationForm userType="Employer" />;
};

export default EmployerRegister;
