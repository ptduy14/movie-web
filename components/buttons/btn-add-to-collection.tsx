"use client";

import { FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";

interface BtnAddToCollectionProps {
  variant: 'primary' | 'secondary'; // Prop để điều chỉnh kiểu dáng
}

export default function BtnAddToCollection({variant}: BtnAddToCollectionProps) {
    const user = useSelector((state: any) => state.account.user);
    // console.log(user)
    return (
    <button
      className={
        variant === 'primary'
          ? 'flex items-center space-x-2 bg-[#717171] py-3 px-5 rounded-md text-white'
          : 'flex items-center bg-white px-3 py-2 rounded-md gap-x-2 text-black font-semibold'
      }
    >
      <FaPlus size={18} /> {/* Hiển thị icon trong cả hai kiểu */}
      <span className="block leading-4 font-semibold">Bộ sưu tập</span>
    </button>
  );
}
