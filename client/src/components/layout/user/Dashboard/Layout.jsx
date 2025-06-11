import React from "react";
import Header from "../../../common/user/Home/Header";

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#333030] pt-15">
            <Header />
            {children}
        </div>
    );
};

export default Layout;
