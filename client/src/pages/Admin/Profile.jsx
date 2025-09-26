import React from "react";
import Layout from "@/components/layout/user/Profile/Layout";
import { Outlet } from "react-router-dom";

const Profile = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default Profile;
