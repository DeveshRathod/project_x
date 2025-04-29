import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import LogoutIcon from "@mui/icons-material/Logout";
import { setCart } from "../store/reducers/cart.slice";
import {
  setNotifications,
  setNewNotificationCount,
} from "../store/reducers/notification.slice";

const Navbar = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const cart = useSelector((state) => state.current.cart);
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const notificationCount = useSelector(
    (state) => state.notification.newNotificationCount
  );

  useEffect(() => {
    if (currentUser) {
    }
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/user/notifications`, {
          headers: {
            authorization: `${token}`,
          },
        });

        dispatch(setNotifications(response.data.notifications));
        dispatch(setNewNotificationCount(response.data.unreadCount));
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    if (currentUser) {
      fetchMessages();
    }
  }, [dispatch]);

  useEffect(() => {
    const markAsRead = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/user/markAsRead`, {
          headers: {
            authorization: `${token}`,
          },
        });

        dispatch(setNewNotificationCount(0));
      } catch (err) {
        console.error("Error marking as read", err);
      }

      if (window.location.href === "/messages" && currentUser) {
        markAsRead();
      }
    };
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE}/api/products/getcart`,

          {
            headers: {
              authorization: `${localStorage.getItem("token")}`,
            },
          }
        );
        dispatch(setCart(response.data));
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    if (currentUser) {
      fetchCart();
    }
  }, [dispatch]);

  let settingUrl = "";
  if (currentUser && currentUser.isAdmin) {
    settingUrl = "/adminsetting";
  }

  if (currentUser && !currentUser.isAdmin) {
    settingUrl = "/setting";
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/signin");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="flex nav pt-8 pb-8 sm:pl-20 pl-10 pr-10 sm:pr-20 justify-between items-center bg-white sticky top-0 z-30 shadow-md">
      <Link to="/" className="text-md sm:text-base">
        <h1>ShopEase</h1>
      </Link>

      <div className="flex items-center gap-8">
        {token && currentUser && !currentUser.isAdmin && (
          <div className="flex justify-center items-center gap-2 sm:gap-8">
            <Link to="/cart">
              <div className="relative">
                <ShoppingCartIcon sx={{ fontSize: 20 }} />
                <div className="absolute top-3 right-3 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">
                  {cart.length}
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="relative flex gap-8">
          {token && currentUser && (
            <div className="flex justify-center items-center gap-2 sm:gap-8">
              <Link to="/messages">
                <div className="relative">
                  <NotificationsIcon sx={{ fontSize: 20 }} />
                  <div className="absolute top-3 right-3 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">
                    {notificationCount}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {token && currentUser ? (
            <>
              <button onClick={toggleDropdown}>
                <img
                  src={currentUser.profile}
                  alt="profle"
                  className="w-6 h-6 object-cover rounded-full self-center shadow-md"
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white shadow-md rounded-lg transition ease-in-out">
                  <ul className="p-4 flex flex-col gap-2">
                    <li
                      className={`${!currentUser.isAdmin ? "hidden" : "block"}`}
                    >
                      <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li
                      className={`${!currentUser.isAdmin ? "block" : "hidden"}`}
                    >
                      <Link to="/orders">Orders</Link>
                    </li>

                    <li>
                      <Link to={settingUrl}>Settings</Link>
                    </li>
                    <li>
                      <button
                        className=" text-red-500 flex justify-center items-center gap-2"
                        onClick={logout}
                      >
                        <div>
                          <LogoutIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>Logout</div>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <Link to="/signin" className="p-2 rounded-md text-md">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
