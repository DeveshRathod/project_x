import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import people from "../data/images/people.png";
import pending from "../data/images/pending.png";
import completed from "../data/images/completed.png";
import products from "../data/images/products.png";
import axios from "axios";

const Dashboard = () => {
  const [details, setDetails] = useState({
    userCount: 0,
    productCount: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/admin/getDashboardDetails`, {
          headers: {
            authorization: `${localStorage.getItem("token")}`,
          },
        });
        const detailsData = response.data;
        setDetails(detailsData);
      } catch (error) {
        console.log(error);
      }
    };

    fetchDetails();
  }, []);

  const boxes = [
    {
      image: people,
      number: details.userCount,
      label: "Users",
    },
    {
      image: products,
      number: details.productCount,
      label: "Products",
    },
    {
      image: completed,
      number: details.completedOrdersCount,
      label: "Completed Orders",
    },
    {
      image: pending,
      number: details.pendingOrdersCount,
      label: "Pending Orders",
    },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-10">
        {details &&
          boxes.map((box, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border shadow-md"
            >
              <img
                src={box.image}
                alt={box.label}
                className="h-24 w-24 object-cover mb-4 mx-auto"
              />
              <p className="text-xl font-bold text-gray-800 text-center">
                {box.number}
              </p>
              <p className="text-gray-600 text-center">{box.label}</p>
            </div>
          ))}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
