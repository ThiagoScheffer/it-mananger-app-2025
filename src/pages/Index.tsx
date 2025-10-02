
import { Navigate } from "react-router-dom";

const Index = () => {
  // Redirect to dashboard to avoid any initialization issues
  return <Navigate to="/login" replace />;
};

export default Index;
