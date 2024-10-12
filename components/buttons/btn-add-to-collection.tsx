"use client";

import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useAuthModel } from "../context/auth-modal-context";

interface BtnAddToCollectionProps {
  variant: 'primary' | 'secondary'; // Prop để điều chỉnh kiểu dáng
}

export default function BtnAddToCollection({variant}: BtnAddToCollectionProps) {
    const user = useSelector((state: any) => state.account.user);
    const {openAuthModal} = useAuthModel();

    const toogleAddToCollection = () => {
        if (!user) {
            openAuthModal();
            return;
        }
    }

    return (
        <button
        className={
          variant === 'primary'
            ? 'flex items-center space-x-2 bg-[#717171] py-3 px-5 rounded-md text-white transition duration-200 ease-in-out hover:bg-[#5a5a5a]' // Thay đổi màu nền khi hover
            : 'flex items-center bg-white px-3 py-2 rounded-md gap-x-2 text-black font-semibold transition duration-200 ease-in-out hover:bg-gray-200' // Thay đổi màu nền khi hover
        }
        onClick={toogleAddToCollection}
      >
        <FaPlus size={18} /> {/* Hiển thị icon trong cả hai kiểu */}
        <span className="block leading-4 font-semibold">Bộ sưu tập</span>
      </button>
      
  );
}
