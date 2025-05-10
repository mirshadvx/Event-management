import React from "react";
import Header from "@/components/common/user/Home/Header";
import Layout from "@/components/layout/Explore/Layout";

const Explore = () => {
    return (
        <div className="min-h-screen bg-[#000000] md:pt-15">
            <Header />
            <Layout />
        </div>
    );
};

export default Explore;