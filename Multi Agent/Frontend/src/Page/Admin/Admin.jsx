import { useContext } from "react";
import "./Admin.css";
import AdminNav from "../../Components/Admin Nav/AdminNav";
import assets from "../../assets/assets";
import { FaUserShield } from "react-icons/fa6";
import { AdminContext } from "../../Context/AdminContext";
import { toast } from "react-toastify";

const Admin = () => {
  const {
    adminEmail,
    setAdminEmail,
    adminPassword,
    setAdminPassword,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
  } = useContext(AdminContext);

  const handleFormData = (event) => {
    event.preventDefault();
    console.log("Admin Email: ", adminEmail);
    console.log("Admin Password: ", adminPassword);

    const adminData = {
      admin_email: adminEmail,
      admin_password: adminPassword,
    };

    localStorage.setItem("Admin", JSON.stringify(adminData));

    if (adminEmail === "admin@gmail.com" && adminPassword === "admin@1234") {
      setIsAdminLoggedIn(true);
      toast.success("Admin Logged In Successfully");
    } else {
      toast.error("Log In Failed !! ");
    }
    setAdminEmail("");
    setAdminPassword("");
  };

  return (
    <div className="admin-page">
      <AdminNav></AdminNav>

      <div className="main-admin-section">
        {!isAdminLoggedIn &&
          <div className="admin-login container">
            <form onSubmit={handleFormData}>
              <div className="mb-5 form-top">
                <FaUserShield style={{ fontSize: "150px" }} />
              </div>
              <div className="mb-3">
                <label className="form-label">Admin ID</label>
                <input
                  value={adminEmail}
                  type="email"
                  className="form-control"
                  aria-describedby="emailHelp"
                  placeholder="Admin ID"
                  onChange={(event) => setAdminEmail(event.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  value={adminPassword}
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  onChange={(event) => setAdminPassword(event.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-dark w-100">
                Submit
              </button>
            </form>
            <img src={assets.frontPage} alt="" />
          </div>}
      </div>
    </div>
  );
};

export default Admin;
