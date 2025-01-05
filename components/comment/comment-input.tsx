import Image from "next/image";
import { useSelector } from "react-redux";
import AccountDefaultImg from "../../public/account-default-img.jpg";
import { useEffect, useState } from "react";

export default function CommentInput() {
    const user = useSelector((state: any) => state.account.user);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (user) setIsAuthenticated(true)
    }, [user])

    if (!isAuthenticated) return;

    return (
        <div>
            <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 shadow-sm bg-white">
                <div className="mr-3">
                    <Image
                        src={user.photo || AccountDefaultImg}
                        alt="User Profile"
                        className="cursor-pointer rounded-full"
                        width={40}
                        height={40}
                    />
                </div>
                <input
                    type="text"
                    placeholder="Write a comment..."
                    className="flex-grow bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                />
            </div>
            <div className="text-right mt-3"><button type="button" className="bg-[#e20913] px-5 py-2 rounded-md">Bình luận</button></div>
        </div>
    );
}
